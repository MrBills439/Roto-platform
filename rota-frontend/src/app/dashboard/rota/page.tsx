"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "../../../lib/api";
import { getUser } from "../../../lib/auth";
import type { RotaWeekResponse, UserSummary } from "../../../types/api";

const getMonday = (date: Date) => {
  const day = date.getUTCDay();
  const diff = (day + 6) % 7;
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - diff);
  return monday;
};

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export default function RotaPage() {
  const [weekStart, setWeekStart] = useState(() => formatDate(getMonday(new Date())));
  const [rota, setRota] = useState<RotaWeekResponse | null>(null);
  const [staff, setStaff] = useState<UserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setError(null);
    try {
      const requests = [
        apiFetch<RotaWeekResponse>(`/rota/week?weekStart=${weekStart}`),
        apiFetch<UserSummary[]>("/users?role=STAFF")
      ] as const;

      const [rotaData, staffData] = await Promise.all(requests);

      setRota(rotaData);
      setStaff(staffData);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load rota data");
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, [weekStart]);

  const weekDates = useMemo(() => {
    const start = new Date(`${weekStart}T00:00:00Z`);
    return Array.from({ length: 7 }).map((_, idx) => addDays(start, idx));
  }, [weekStart]);

  const filteredStaff = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return staff;
    return staff.filter((person) => {
      const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
      return fullName.includes(term) || person.email.toLowerCase().includes(term);
    });
  }, [search, staff]);

  const formatDayLabel = (date: Date) =>
    new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC"
    }).format(date);

  const assignmentsByStaffDay = useMemo(() => {
    if (!rota) return {} as Record<string, Record<string, RotaWeekResponse["houses"][number]["shifts"][number]["assignments"]>>;
    const map: Record<string, Record<string, typeof rota.houses[number]["shifts"][number]["assignments"]>> = {};
    rota.houses.forEach((house) => {
      house.shifts.forEach((shift) => {
        shift.assignments.forEach((assignment) => {
          if (!map[assignment.staffUserId]) {
            map[assignment.staffUserId] = {};
          }
          if (!map[assignment.staffUserId][shift.shiftDate]) {
            map[assignment.staffUserId][shift.shiftDate] = [];
          }
          map[assignment.staffUserId][shift.shiftDate].push({
            ...assignment,
            shiftId: shift.id,
            shiftType: shift.shiftType,
            startTime: shift.startTime,
            endTime: shift.endTime,
            houseName: house.name
          } as typeof assignment & {
            shiftId: string;
            shiftType: string;
            startTime: string;
            endTime: string;
            houseName: string;
          });
        });
      });
    });
    return map;
  }, [rota]);

  const handleDragStart = (event: React.DragEvent, assignment: { id: string; shiftId: string; staffUserId: string }) => {
    event.dataTransfer.setData("application/json", JSON.stringify(assignment));
  };

  const handleDropOnStaff = async (event: React.DragEvent, staffUserId: string) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("application/json");
    if (!payload) return;
    const assignment = JSON.parse(payload) as { id: string; shiftId: string; staffUserId: string };
    if (assignment.staffUserId === staffUserId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/assignments/${assignment.id}`, {
        method: "PATCH",
        body: JSON.stringify({ staffUserId })
      });
      setSuccess("Assignment updated");
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to update assignment");
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Weekly rota</h1>
          <p className="text-sm text-slate-600">Drag and drop assignments across staff or open shifts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
            onClick={() => {
              const prev = addDays(new Date(`${weekStart}T00:00:00Z`), -7);
              setWeekStart(formatDate(prev));
            }}
          >
            Previous week
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
            onClick={() => {
              const next = addDays(new Date(`${weekStart}T00:00:00Z`), 7);
              setWeekStart(formatDate(next));
            }}
          >
            Next week
          </button>
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            Week of {weekStart}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-[#e6e7ea] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-700">Staff schedule</div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search staff"
              className="w-52 rounded-full border border-slate-200 px-3 py-1 text-xs"
            />
          </div>

          <div className="overflow-auto">
            <div className="min-w-[980px]">
              <div className="sticky top-0 z-20 grid grid-cols-[200px_repeat(7,minmax(140px,1fr))] gap-2 bg-white pb-2 text-xs font-semibold text-slate-600">
                <div className="sticky left-0 z-30 bg-white px-2">Employee</div>
                {weekDates.map((date) => (
                  <div key={date.toISOString()} className="rounded-lg bg-slate-50 px-2 py-1 text-center">
                    {formatDayLabel(date)}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {filteredStaff.map((person) => {
                  return (
                    <div
                      key={person.id}
                      className="grid grid-cols-[200px_repeat(7,minmax(140px,1fr))] gap-2"
                    >
                      <div
                        className="sticky left-0 z-10 rounded-xl border border-slate-200 bg-slate-50 p-2"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => void handleDropOnStaff(event, person.id)}
                      >
                        <div className="text-sm font-semibold text-slate-800">
                          {person.firstName} {person.lastName}
                        </div>
                        <div className="text-xs text-slate-500">{person.email}</div>
                      </div>
                      {weekDates.map((date) => {
                        const key = formatDate(date);
                        const assignments = assignmentsByStaffDay?.[person.id]?.[key] || [];
                        return (
                          <div
                            key={`${person.id}-${key}`}
                            className="min-h-[70px] rounded-xl border border-slate-100 bg-white p-2"
                          >
                            <div className="space-y-2">
                              {assignments.map((assignment) => (
                                <div
                                  key={assignment.id}
                                  draggable
                                  onDragStart={(event) =>
                                    handleDragStart(event, {
                                      id: assignment.id,
                                      shiftId: assignment.shiftId,
                                      staffUserId: person.id
                                    })
                                  }
                                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
                                >
                                  <div className="font-semibold text-slate-800">
                                    {assignment.startTime} - {assignment.endTime}
                                  </div>
                                  <div className="text-slate-500">{assignment.shiftType}</div>
                                </div>
                              ))}
                              {assignments.length === 0 ? (
                                <div className="text-xs text-slate-300">--</div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {filteredStaff.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No staff match this search.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
      </section>
    </div>
  );
}
