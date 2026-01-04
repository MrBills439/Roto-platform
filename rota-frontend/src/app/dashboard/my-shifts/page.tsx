"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "../../../lib/api";
import { getUser } from "../../../lib/auth";
import type { ShiftType } from "../../../types/api";

type MyShift = {
  id: string;
  shiftId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  shift: {
    id: string;
    name: string | null;
    shiftDate: string;
    shiftType: ShiftType;
    startTime: string;
    endTime: string;
    houseId: string;
  };
};

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

const formatShortDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC"
  }).format(date);

export default function MyShiftsPage() {
  const [weekStart, setWeekStart] = useState<string>("");
  const [items, setItems] = useState<MyShift[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const loadShifts = async () => {
    setError(null);
    try {
      const data = await apiFetch<MyShift[]>(`/users/me/shifts?weekStart=${weekStart}`);
      setItems(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load shifts");
      }
    }
  };

  useEffect(() => {
    const user = getUser();
    setRole(user?.role ?? null);
  }, []);

  useEffect(() => {
    if (role === "STAFF" && weekStart) {
      void loadShifts();
    }
  }, [weekStart, role]);

  useEffect(() => {
    setWeekStart(formatDate(getMonday(new Date())));
  }, []);

  const grouped = useMemo(() => {
    return items.reduce<Record<string, MyShift[]>>((acc, item) => {
      const key = item.shift.shiftDate.slice(0, 10);
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [items]);

  const days = useMemo(() => {
    if (!weekStart) {
      return [];
    }
    const start = new Date(`${weekStart}T00:00:00Z`);
    return Array.from({ length: 7 }).map((_, idx) => addDays(start, idx));
  }, [weekStart]);

  if (role && role !== "STAFF") {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        This page is only available for staff members.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My shifts</h1>
          <p className="text-sm text-slate-600">Your assigned shifts for the week.</p>
        </div>
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
            Week of {weekStart}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#e6e7ea] bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          {days.map((date) => {
            const key = formatDate(date);
            const dayItems = grouped[key] || [];
            return (
              <div key={key} className="space-y-2">
                <div className="text-sm font-semibold text-slate-700">
                  {formatShortDate(date)}
                </div>
                {dayItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400">
                    No shifts
                  </div>
                ) : (
                  dayItems.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                      <div className="font-semibold text-slate-800">{item.shift.name || "Shift"}</div>
                      <div className="text-slate-500">
                        {item.shift.startTime} - {item.shift.endTime} · {item.shift.shiftType}
                      </div>
                      <div className="text-slate-400">House ID: {item.shift.houseId}</div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
