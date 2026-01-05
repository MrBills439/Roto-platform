"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../../../lib/api";
import { getUser } from "../../../lib/auth";

const getMonday = (date: Date) => {
  const day = date.getUTCDay();
  const diff = (day + 6) % 7;
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - diff);
  return monday;
};

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

export default function AvailabilityPage() {
  const [role, setRole] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "AVAILABLE",
    startDate: formatDate(getMonday(new Date())),
    endDate: formatDate(getMonday(new Date())),
    notes: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getUser();
    setRole(user?.role ?? null);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await apiFetch("/availability", {
        method: "POST",
        body: JSON.stringify({
          type: form.type,
          startDate: form.startDate,
          endDate: form.endDate,
          notes: form.notes || undefined
        })
      });
      setSuccess("Availability submitted");
      setForm((prev) => ({ ...prev, notes: "" }));
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
      {role && role !== "STAFF" && role !== "TEAM_LEADER" ? (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          This page is intended for staff availability submissions.
        </div>
      ) : null}
      <div>
        <h1 className="text-2xl font-semibold">Availability</h1>
        <p className="text-sm text-slate-600">Let managers know when you are available or on leave.</p>
      </div>

      <form className="space-y-4 rounded border border-slate-200 bg-white p-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="availability-type">
              Type
            </label>
            <select
              id="availability-type"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
            >
              <option value="AVAILABLE">Available</option>
              <option value="UNAVAILABLE">Unavailable</option>
              <option value="LEAVE">Leave</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="availability-start">
              Start date
            </label>
            <input
              id="availability-start"
              type="date"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.startDate}
              onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="availability-end">
              End date
            </label>
            <input
              id="availability-end"
              type="date"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.endDate}
              onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="availability-notes">
              Notes
            </label>
            <input
              id="availability-notes"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Optional notes"
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
          {loading ? "Submitting..." : "Submit availability"}
        </button>
      </form>
    </div>
  );
}
