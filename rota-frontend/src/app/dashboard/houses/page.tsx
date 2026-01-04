"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../../../lib/api";
import type { House, RotaWeekResponse } from "../../../types/api";

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

const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC"
  }).format(new Date(value));

export default function HousesPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [weekStart, setWeekStart] = useState<string>("");
  const [rotaWeek, setRotaWeek] = useState<RotaWeekResponse | null>(null);

  const loadHouses = async () => {
    setError(null);
    try {
      const data = await apiFetch<House[]>("/houses");
      setHouses(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load houses");
      }
    }
  };

  const loadRotaWeek = async (week: string) => {
    try {
      const data = await apiFetch<RotaWeekResponse>(`/rota/week?weekStart=${week}`);
      setRotaWeek(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load rota week");
      }
    }
  };

  useEffect(() => {
    void loadHouses();
  }, []);

  useEffect(() => {
    setWeekStart(formatDate(getMonday(new Date())));
  }, []);

  useEffect(() => {
    if (weekStart) {
      void loadRotaWeek(weekStart);
    }
  }, [weekStart]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const created = await apiFetch<House>("/houses", {
        method: "POST",
        body: JSON.stringify({ name, location })
      });
      setSuccess(`Created house ${created.name}`);
      setName("");
      setLocation("");
      await loadHouses();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create house");
      }
    } finally {
      setLoading(false);
    }
  };

  const houseAssignments = rotaWeek?.houses.reduce<Record<string, RotaWeekResponse["houses"][number]["shifts"]>>(
    (acc, house) => {
      acc[house.id] = house.shifts;
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Houses</h1>
        <p className="text-sm text-slate-600">Manage house locations and status.</p>
      </div>

      <form className="space-y-4 rounded border border-slate-200 bg-white p-4" onSubmit={handleCreate}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="house-name">
              Name
            </label>
            <input
              id="house-name"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="house-location">
              Location
            </label>
            <input
              id="house-location"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              required
            />
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
        <button
          type="submit"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create house"}
        </button>
      </form>

      <div className="rounded border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
          Current Houses
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {houses.map((house) => (
                <tr key={house.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{house.name}</td>
                  <td className="px-4 py-2 text-slate-700">{house.location}</td>
                  <td className="px-4 py-2 text-slate-700">{house.isActive ? "Yes" : "No"}</td>
                </tr>
              ))}
              {houses.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={3}>
                    No houses yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-semibold text-slate-700">House staffing</div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
              onClick={() =>
                weekStart
                  ? setWeekStart(formatDate(addDays(new Date(`${weekStart}T00:00:00Z`), -7)))
                  : null
              }
              disabled={!weekStart}
            >
              Previous week
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
              onClick={() =>
                weekStart
                  ? setWeekStart(formatDate(addDays(new Date(`${weekStart}T00:00:00Z`), 7)))
                  : null
              }
              disabled={!weekStart}
            >
              Next week
            </button>
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              Week of {weekStart || "--"}
            </div>
          </div>
        </div>

        <div className="space-y-6 p-4">
          {houses.map((house) => {
            const shifts = houseAssignments?.[house.id] || [];
            const rows = shifts.flatMap((shift) =>
              shift.assignments.map((assignment) => ({
                key: `${shift.id}-${assignment.id}`,
                staffName: assignment.staffName,
                staffGender: assignment.staffGender,
                shiftType: shift.shiftType,
                shiftDate: shift.shiftDate,
                startTime: shift.startTime,
                endTime: shift.endTime
              }))
            );

            return (
              <div key={house.id} className="rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{house.name}</div>
                    <div className="text-xs text-slate-500">{house.location}</div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {rows.length} staff assigned
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-2">Staff</th>
                        <th className="px-4 py-2">Gender</th>
                        <th className="px-4 py-2">Shift type</th>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Start</th>
                        <th className="px-4 py-2">End</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.key} className="border-t border-slate-100">
                          <td className="px-4 py-2 font-medium text-slate-900">{row.staffName}</td>
                          <td className="px-4 py-2 text-slate-700">{row.staffGender}</td>
                          <td className="px-4 py-2 text-slate-700">{row.shiftType}</td>
                          <td className="px-4 py-2 text-slate-700">
                            {formatShortDate(row.shiftDate)}
                          </td>
                          <td className="px-4 py-2 text-slate-700">{row.startTime}</td>
                          <td className="px-4 py-2 text-slate-700">{row.endTime}</td>
                        </tr>
                      ))}
                      {rows.length === 0 ? (
                        <tr>
                          <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                            No assigned staff for this week.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          {houses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
              No houses yet.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
