"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../../../lib/api";
import type { AssignmentCreateResponse, AssignmentDeleteResponse, Shift, UserSummary } from "../../../types/api";

export default function AssignmentsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staff, setStaff] = useState<UserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const [form, setForm] = useState({
    shiftId: "",
    staffUserId: "",
    override: false,
    overrideReason: ""
  });

  const [deleteId, setDeleteId] = useState("");

  const loadData = async () => {
    setError(null);
    try {
      const [shiftData, staffData] = await Promise.all([
        apiFetch<Shift[]>("/shifts"),
        apiFetch<UserSummary[]>("/users?role=STAFF")
      ]);
      setShifts(shiftData);
      setStaff(staffData);
      if (!form.shiftId && shiftData.length > 0) {
        setForm((prev) => ({ ...prev, shiftId: shiftData[0].id }));
      }
      if (!form.staffUserId && staffData.length > 0) {
        setForm((prev) => ({ ...prev, staffUserId: staffData[0].id }));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load assignments data");
      }
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("rota_user");
    if (stored) {
      try {
        const user = JSON.parse(stored) as { role?: string };
        setRole(user.role ?? null);
      } catch {
        setRole(null);
      }
    }
    void loadData();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const payload = {
        shiftId: form.shiftId,
        staffUserId: form.staffUserId,
        override: form.override,
        overrideReason: form.override ? form.overrideReason : undefined
      };
      const created = await apiFetch<AssignmentCreateResponse>("/assignments", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setSuccess(`Assigned ${created.staffName} (assignment ${created.id})`);
      setDeleteId(created.id);
      setForm((prev) => ({ ...prev, override: false, overrideReason: "" }));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create assignment");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!deleteId) {
      setError("Assignment ID is required");
      return;
    }
    setLoading(true);
    try {
      const result = await apiFetch<AssignmentDeleteResponse>(`/assignments/${deleteId}`, {
        method: "DELETE"
      });
      setSuccess(`Unassigned ${result.id}`);
      setDeleteId("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to delete assignment");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {role === "STAFF" ? (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          You do not have access to manage assignments.
        </div>
      ) : null}
      <div>
        <h1 className="text-2xl font-semibold">Assignments</h1>
        <p className="text-sm text-slate-600">Assign staff to shifts and manage overrides.</p>
      </div>

      <form className="space-y-4 rounded border border-slate-200 bg-white p-4" onSubmit={handleCreate}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="assignment-shift">
              Shift
            </label>
            <select
              id="assignment-shift"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.shiftId}
              onChange={(event) => setForm({ ...form, shiftId: event.target.value })}
              required
            >
              <option value="" disabled>
                Select shift
              </option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name || "(no name)"} — {shift.shiftDate.slice(0, 10)} {shift.startTime}-{shift.endTime}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="assignment-staff">
              Staff
            </label>
            <select
              id="assignment-staff"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.staffUserId}
              onChange={(event) => setForm({ ...form, staffUserId: event.target.value })}
              required
            >
              <option value="" disabled>
                Select staff
              </option>
              {staff.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="assignment-override"
              type="checkbox"
              checked={form.override}
              onChange={(event) => setForm({ ...form, override: event.target.checked })}
            />
            <label htmlFor="assignment-override" className="text-sm text-slate-700">
              Use override
            </label>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="assignment-override-reason">
              Override reason
            </label>
            <input
              id="assignment-override-reason"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.overrideReason}
              onChange={(event) => setForm({ ...form, overrideReason: event.target.value })}
              disabled={!form.override}
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
          {loading ? "Assigning..." : "Create assignment"}
        </button>
      </form>

      <form className="space-y-4 rounded border border-slate-200 bg-white p-4" onSubmit={handleDelete}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="assignment-delete-id">
            Assignment ID
          </label>
          <input
            id="assignment-delete-id"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={deleteId}
            onChange={(event) => setDeleteId(event.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Removing..." : "Unassign"}
        </button>
      </form>
    </div>
  );
}
