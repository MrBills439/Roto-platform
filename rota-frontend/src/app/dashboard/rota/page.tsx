"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "../../../lib/api";
import { getUser } from "../../../lib/auth";
import type { Availability, OpenShift, RotaWeekResponse, ShiftTemplate, UserSummary } from "../../../types/api";

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
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [openShifts, setOpenShifts] = useState<OpenShift[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templateName, setTemplateName] = useState("");
  const [availabilityForm, setAvailabilityForm] = useState({
    type: "AVAILABLE",
    startDate: weekStart,
    endDate: weekStart,
    notes: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const loadData = async () => {
    setError(null);
    try {
      const currentUser = getUser();
      const userRole = currentUser?.role ?? null;
      setRole(userRole);

      const requests = [
        apiFetch<RotaWeekResponse>(`/rota/week?weekStart=${weekStart}`),
        apiFetch<UserSummary[]>("/users?role=STAFF"),
        apiFetch<OpenShift[]>(`/shifts/open?weekStart=${weekStart}`)
      ] as const;

      const [rotaData, staffData, openShiftData] = await Promise.all(requests);

      let availabilityData: Availability[] = [];
      if (userRole && ["ADMIN", "MANAGER", "TEAM_LEADER"].includes(userRole)) {
        availabilityData = await apiFetch<Availability[]>(`/availability?weekStart=${weekStart}`);
      }

      let templateData: ShiftTemplate[] = [];
      if (userRole && ["ADMIN", "MANAGER"].includes(userRole)) {
        templateData = await apiFetch<ShiftTemplate[]>("/templates");
      }

      setRota(rotaData);
      setStaff(staffData);
      setAvailability(availabilityData);
      setOpenShifts(openShiftData);
      setTemplates(templateData);
      if (!selectedTemplate && templateData.length > 0) {
        setSelectedTemplate(templateData[0].id);
      }
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

  const availabilityByStaff = useMemo(() => {
    return availability.reduce<Record<string, Availability[]>>((acc, item) => {
      acc[item.userId] = acc[item.userId] || [];
      acc[item.userId].push(item);
      return acc;
    }, {});
  }, [availability]);

  const openShiftsByDate = useMemo(() => {
    return openShifts.reduce<Record<string, OpenShift[]>>((acc, shift) => {
      const date = shift.shiftDate.slice(0, 10);
      acc[date] = acc[date] || [];
      acc[date].push(shift);
      return acc;
    }, {});
  }, [openShifts]);

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

  const handleDropOnOpenShift = async (event: React.DragEvent, shiftId: string) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("application/json");
    if (!payload) return;
    const assignment = JSON.parse(payload) as { id: string; shiftId: string; staffUserId: string };
    if (assignment.shiftId === shiftId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/assignments/${assignment.id}`, {
        method: "PATCH",
        body: JSON.stringify({ shiftId })
      });
      setSuccess("Assignment moved to new shift");
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to move assignment");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToShift = async (shiftId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/shifts/${shiftId}/apply`, { method: "POST" });
      setSuccess("Application submitted");
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to apply for shift");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/templates/${selectedTemplate}/apply`, {
        method: "POST",
        body: JSON.stringify({ weekStart })
      });
      setSuccess("Template applied to week");
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to apply template");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch("/templates", {
        method: "POST",
        body: JSON.stringify({ name: templateName, weekStart })
      });
      setTemplateName("");
      setSuccess("Template saved");
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create template");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyWeek = async (targetWeekStart: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch("/rota/copy-week", {
        method: "POST",
        body: JSON.stringify({ fromWeekStart: weekStart, toWeekStart: targetWeekStart })
      });
      setSuccess("Week copied");
      setWeekStart(targetWeekStart);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to copy week");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAvailability = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch("/availability", {
        method: "POST",
        body: JSON.stringify({
          type: availabilityForm.type,
          startDate: availabilityForm.startDate,
          endDate: availabilityForm.endDate,
          notes: availabilityForm.notes || undefined
        })
      });
      setSuccess("Availability submitted");
      setAvailabilityForm((prev) => ({ ...prev, notes: "" }));
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to submit availability");
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
        <section className="space-y-4 rounded-2xl border border-[#e6e7ea] bg-white p-4 shadow-sm">
          <div className="grid grid-cols-[220px_repeat(7,minmax(0,1fr))] gap-2 text-xs font-semibold text-slate-600">
            <div className="px-2">Employee</div>
            {weekDates.map((date) => (
              <div key={date.toISOString()} className="rounded-lg bg-slate-50 px-2 py-1 text-center">
                {date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {staff.map((person) => {
              const availabilityItems = availabilityByStaff[person.id] || [];
              return (
                <div key={person.id} className="grid grid-cols-[220px_repeat(7,minmax(0,1fr))] gap-2">
                  <div
                    className="rounded-xl border border-slate-200 bg-slate-50 p-2"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => void handleDropOnStaff(event, person.id)}
                  >
                    <div className="text-sm font-semibold text-slate-800">
                      {person.firstName} {person.lastName}
                    </div>
                    <div className="text-xs text-slate-500">{person.email}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {availabilityItems.map((item) => (
                        <span
                          key={item.id}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            item.type === "LEAVE"
                              ? "bg-rose-100 text-rose-700"
                              : item.type === "UNAVAILABLE"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {item.type}
                        </span>
                      ))}
                      {availabilityItems.length === 0 ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                          No availability
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {weekDates.map((date) => {
                    const key = formatDate(date);
                    const assignments = assignmentsByStaffDay?.[person.id]?.[key] || [];
                    return (
                      <div key={`${person.id}-${key}`} className="min-h-[70px] rounded-xl border border-slate-100 bg-white p-2">
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
                              <div className="font-semibold text-slate-800">{assignment.shiftType}</div>
                              <div className="text-slate-500">
                                {assignment.startTime} - {assignment.endTime}
                              </div>
                              <div className="text-slate-400">{assignment.houseName}</div>
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
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#e6e7ea] bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-700">Availability</div>
            <p className="text-xs text-slate-500">Submit availability or leave for the week.</p>
            <div className="mt-3 space-y-2">
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={availabilityForm.type}
                onChange={(event) =>
                  setAvailabilityForm((prev) => ({ ...prev, type: event.target.value }))
                }
              >
                <option value="AVAILABLE">Available</option>
                <option value="UNAVAILABLE">Unavailable</option>
                <option value="LEAVE">Leave</option>
              </select>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={availabilityForm.startDate}
                onChange={(event) =>
                  setAvailabilityForm((prev) => ({ ...prev, startDate: event.target.value }))
                }
              />
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={availabilityForm.endDate}
                onChange={(event) =>
                  setAvailabilityForm((prev) => ({ ...prev, endDate: event.target.value }))
                }
              />
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Notes (optional)"
                value={availabilityForm.notes}
                onChange={(event) =>
                  setAvailabilityForm((prev) => ({ ...prev, notes: event.target.value }))
                }
              />
              <button
                type="button"
                className="w-full rounded-full bg-[#151618] px-3 py-2 text-xs font-semibold text-white"
                onClick={handleSubmitAvailability}
                disabled={loading}
              >
                Submit availability
              </button>
            </div>
          </div>

          {role && [\"ADMIN\", \"MANAGER\"].includes(role) ? (
            <>
              <div className=\"rounded-2xl border border-[#e6e7ea] bg-white p-4 shadow-sm\">\n                <div className=\"text-sm font-semibold text-slate-700\">Templates</div>\n                <div className=\"mt-2 space-y-2\">\n                  <select\n                    className=\"w-full rounded-xl border border-slate-200 px-3 py-2 text-sm\"\n                    value={selectedTemplate}\n                    onChange={(event) => setSelectedTemplate(event.target.value)}\n                  >\n                    <option value=\"\" disabled>\n                      Select template\n                    </option>\n                    {templates.map((template) => (\n                      <option key={template.id} value={template.id}>\n                        {template.name}\n                      </option>\n                    ))}\n                  </select>\n                  <button\n                    type=\"button\"\n                    className=\"w-full rounded-full bg-[#151618] px-3 py-2 text-xs font-semibold text-white\"\n                    onClick={handleApplyTemplate}\n                    disabled={loading || !selectedTemplate}\n                  >\n                    Apply template\n                  </button>\n                </div>\n                <div className=\"mt-4 space-y-2\">\n                  <div className=\"text-xs font-semibold text-slate-600\">Save current week as template</div>\n                  <input\n                    className=\"w-full rounded-xl border border-slate-200 px-3 py-2 text-sm\"\n                    placeholder=\"Template name\"\n                    value={templateName}\n                    onChange={(event) => setTemplateName(event.target.value)}\n                  />\n                  <button\n                    type=\"button\"\n                    className=\"w-full rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700\"\n                    onClick={handleCreateTemplate}\n                    disabled={loading || !templateName.trim()}\n                  >\n                    Save template\n                  </button>\n                </div>\n              </div>\n\n              <div className=\"rounded-2xl border border-[#e6e7ea] bg-white p-4 shadow-sm\">\n                <div className=\"text-sm font-semibold text-slate-700\">Copy schedule</div>\n                <p className=\"text-xs text-slate-500\">Duplicate this week's shifts into another week.</p>\n                <button\n                  type=\"button\"\n                  className=\"mt-3 w-full rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700\"\n                  onClick={() => {\n                    const target = addDays(new Date(`${weekStart}T00:00:00Z`), 7);\n                    void handleCopyWeek(formatDate(target));\n                  }}\n                  disabled={loading}\n                >\n                  Copy to next week\n                </button>\n              </div>\n            </>\n          ) : null}

          <div className="rounded-2xl border border-[#e6e7ea] bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-700">Open shifts</div>
            <p className="text-xs text-slate-500">Drop assignments here to move to open shifts.</p>
            <div className="mt-3 space-y-3">
              {weekDates.map((date) => {
                const key = formatDate(date);
                const items = openShiftsByDate[key] || [];
                return (
                  <div key={key} className="space-y-2">
                    <div className="text-xs font-semibold text-slate-600">{key}</div>
                    {items.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400">
                        No open shifts
                      </div>
                    ) : (
                      items.map((shift) => (
                        <div
                          key={shift.id}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => void handleDropOnOpenShift(event, shift.id)}
                        >
                          <div className="font-semibold text-slate-700">{shift.name || "Untitled"}</div>
                          <div className="text-slate-500">
                            {shift.startTime} - {shift.endTime} · {shift.shiftType}
                          </div>
                          <div className="text-slate-400">Open slots: {shift.openSlots}</div>
                          {role === "STAFF" ? (
                            <button
                              type="button"
                              className="mt-2 rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700"
                              onClick={() => void handleApplyToShift(shift.id)}
                              disabled={loading}
                            >
                              Apply
                            </button>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
