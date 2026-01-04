"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "../../../lib/api";
import type { House, Shift, ShiftType } from "../../../types/api";

const shiftTypes: ShiftType[] = [
  "LONG_DAY",
  "MID_DAY",
  "WAKE_NIGHT",
  "SLEEP_IN",
  "CUSTOM"
];

const standardHours: Partial<Record<ShiftType, { label: string; start: string; end: string }>> = {
  LONG_DAY: { label: "Long day", start: "08:00", end: "20:00" },
  MID_DAY: { label: "Mid day", start: "08:00", end: "16:00" },
  WAKE_NIGHT: { label: "Wake night", start: "20:00", end: "08:00" },
  SLEEP_IN: { label: "Sleep in", start: "22:00", end: "07:00" },
  CUSTOM: { label: "Custom", start: "09:00", end: "17:00" }
};

const typeColor: Record<ShiftType, string> = {
  LONG_DAY: "border-amber-300 bg-amber-50",
  MID_DAY: "border-emerald-300 bg-emerald-50",
  WAKE_NIGHT: "border-indigo-300 bg-indigo-50",
  SLEEP_IN: "border-rose-300 bg-rose-50",
  CUSTOM: "border-slate-300 bg-slate-50"
};

const formatDateLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
};

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const [form, setForm] = useState({
    name: "",
    houseId: "",
    shiftDate: "",
    shiftType: "LONG_DAY" as ShiftType,
    startTime: "08:00",
    endTime: "20:00",
    requiredStaffCount: 1
  });

  const loadData = async () => {
    setError(null);
    try {
      const [shiftData, houseData] = await Promise.all([
        apiFetch<Shift[]>("/shifts"),
        apiFetch<House[]>("/houses")
      ]);
      setShifts(shiftData);
      setHouses(houseData);
      if (!form.houseId && houseData.length > 0) {
        setForm((prev) => ({ ...prev, houseId: houseData[0].id }));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load shifts");
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return shifts;
    return shifts.filter((shift) => {
      return (
        shift.name?.toLowerCase().includes(lower) ||
        shift.shiftDate.toLowerCase().includes(lower) ||
        shift.houseId.toLowerCase().includes(lower)
      );
    });
  }, [query, shifts]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, Shift[]>>((acc, shift) => {
      const key = shift.shiftDate.slice(0, 10);
      acc[key] = acc[key] || [];
      acc[key].push(shift);
      return acc;
    }, {});
  }, [filtered]);

  const groupedEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  const handleShiftTypeChange = (value: ShiftType) => {
    const hours = standardHours[value];
    setForm((prev) => ({
      ...prev,
      shiftType: value,
      startTime: hours?.start || prev.startTime,
      endTime: hours?.end || prev.endTime
    }));
  };

  const applyPreset = (value: ShiftType) => {
    const preset = standardHours[value];
    if (!preset) return;
    setForm((prev) => ({
      ...prev,
      shiftType: value,
      name: preset.label,
      startTime: preset.start,
      endTime: preset.end
    }));
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const created = await apiFetch<Shift>("/shifts", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          houseId: form.houseId,
          shiftDate: form.shiftDate,
          shiftType: form.shiftType,
          startTime: form.startTime,
          endTime: form.endTime,
          requiredStaffCount: form.requiredStaffCount
        })
      });
      setSuccess(`Created shift ${created.name || created.id}`);
      setForm((prev) => ({
        ...prev,
        name: "",
        shiftDate: ""
      }));
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create shift");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff5a5f] text-white">
              S
            </span>
            <h1 className="text-2xl font-semibold">Shifts</h1>
            <span className="rounded-full bg-[#ffe7e8] px-2 py-0.5 text-xs font-semibold text-[#ff5a5f]">
              Draft
            </span>
          </div>
          <p className="text-sm text-slate-600">Plan, review, and assign shifts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
            onClick={() => setForm((prev) => ({ ...prev, shiftDate: new Date().toISOString().slice(0, 10) }))}
          >
            Today
          </button>
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
        <section className="space-y-4 rounded-2xl border border-[#e6e7ea] bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-700">Schedule</div>
            <div className="flex items-center gap-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search shifts"
                className="w-48 rounded-full border border-slate-200 px-3 py-1 text-xs"
              />
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {filtered.length} shifts
              </span>
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

          <div className="space-y-4">
            {groupedEntries.map(([date, items]) => (
              <div key={date} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-800">{formatDateLabel(date)}</div>
                  <div className="text-xs text-slate-500">{items.length} shift(s)</div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((shift) => (
                    <div
                      key={shift.id}
                      className={`rounded-xl border px-4 py-3 shadow-sm ${typeColor[shift.shiftType]}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900">
                          {shift.name || "Untitled shift"}
                        </div>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {shift.shiftType}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                        <span>
                          {shift.startTime} - {shift.endTime}
                        </span>
                        <span className="truncate">House {shift.houseId.slice(0, 6)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {groupedEntries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No shifts yet. Create the first shift on the right.
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-4 rounded-2xl border border-[#e6e7ea] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-800">Add shift</div>
              <div className="text-xs text-slate-500">Saved shifts + from scratch</div>
            </div>
            <span className="rounded-full bg-[#e8f2ff] px-2 py-0.5 text-xs font-semibold text-slate-600">
              {houses.length} houses
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-600">Saved shifts</div>
            <div className="space-y-2">
              {shiftTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => applyPreset(type)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:border-slate-300"
                >
                  <span>{standardHours[type]?.label || type}</span>
                  <span className="text-slate-500">
                    {standardHours[type]?.start} - {standardHours[type]?.end}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <form className="space-y-3" onSubmit={handleCreate}>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600" htmlFor="shift-name">
                Shift name
              </label>
              <input
                id="shift-name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600" htmlFor="shift-house">
                House
              </label>
              <select
                id="shift-house"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.houseId}
                onChange={(event) => setForm({ ...form, houseId: event.target.value })}
                required
              >
                <option value="" disabled>
                  Select house
                </option>
                {houses.map((house) => (
                  <option key={house.id} value={house.id}>
                    {house.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="shift-date">
                  Date
                </label>
                <input
                  id="shift-date"
                  type="date"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.shiftDate}
                  onChange={(event) => setForm({ ...form, shiftDate: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="shift-type">
                  Shift type
                </label>
                <select
                  id="shift-type"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.shiftType}
                  onChange={(event) => handleShiftTypeChange(event.target.value as ShiftType)}
                  required
                >
                  {shiftTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="shift-start">
                  Start time
                </label>
                <input
                  id="shift-start"
                  type="time"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.startTime}
                  onChange={(event) => setForm({ ...form, startTime: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="shift-end">
                  End time
                </label>
                <input
                  id="shift-end"
                  type="time"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.endTime}
                  onChange={(event) => setForm({ ...form, endTime: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="shift-count">
                  Required staff
                </label>
                <input
                  id="shift-count"
                  type="number"
                  min={1}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.requiredStaffCount}
                  onChange={(event) =>
                    setForm({ ...form, requiredStaffCount: Number(event.target.value) || 1 })
                  }
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-[#151618] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Saving..." : "Add shift"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
