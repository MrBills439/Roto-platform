"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../../../lib/api";
import type {
  AssignmentCreateResponse,
  AssignmentDeleteResponse,
  AssignmentListItem,
  House,
  Shift,
  UserSummary
} from "../../../types/api";

export default function AssignmentsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [staff, setStaff] = useState<UserSummary[]>([]);
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const [form, setForm] = useState({
    houseId: "",
    shiftId: "",
    staffUserId: ""
  });

  const [deleteId, setDeleteId] = useState("");
  const [deleteQuery, setDeleteQuery] = useState("");

  const loadData = async () => {
    setError(null);
    try {
      const [shiftData, staffData, assignmentData] = await Promise.all([
        apiFetch<Shift[]>("/shifts"),
        apiFetch<UserSummary[]>("/users?role=STAFF"),
        apiFetch<AssignmentListItem[]>("/assignments")
      ]);
      const houseData = await apiFetch<House[]>("/houses");
      setShifts(shiftData);
      setHouses(houseData);
      setStaff(staffData);
      setAssignments(assignmentData);
      if (!form.houseId && houseData.length > 0) {
        setForm((prev) => ({ ...prev, houseId: houseData[0].id }));
      }
      const filteredShifts = form.houseId
        ? shiftData.filter((shift) => shift.houseId === form.houseId)
        : shiftData;
      if (!form.shiftId && filteredShifts.length > 0) {
        setForm((prev) => ({ ...prev, shiftId: filteredShifts[0].id }));
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
        staffUserId: form.staffUserId
      };
      const created = await apiFetch<AssignmentCreateResponse>("/assignments", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setSuccess(`Assigned ${created.staffName} (assignment ${created.id})`);
      setDeleteId(created.id);
      setForm((prev) => ({ ...prev }));
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
      setDeleteQuery("");
      await loadData();
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

  const filteredAssignments = assignments.filter((assignment) => {
    const name = `${assignment.user.firstName} ${assignment.user.lastName}`.toLowerCase();
    return deleteQuery ? name.includes(deleteQuery.toLowerCase()) : true;
  });

  return (
    <div className="space-y-6">
      {role === "STAFF" ? (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          You do not have access to manage assignments.
        </div>
      ) : null}
      <div>
        <h1 className="text-2xl font-semibold">Assignments</h1>
        <p className="text-sm text-slate-600">Assign staff to shifts by house and shift type.</p>
      </div>

      <form className="space-y-4 rounded border border-slate-200 bg-white p-4" onSubmit={handleCreate}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="assignment-house">
              House
            </label>
            <select
              id="assignment-house"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.houseId}
              onChange={(event) => {
                const nextHouseId = event.target.value;
                const nextShift = shifts.find((shift) => shift.houseId === nextHouseId);
                setForm((prev) => ({
                  ...prev,
                  houseId: nextHouseId,
                  shiftId: nextShift?.id || ""
                }));
              }}
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
              {shifts
                .filter((shift) => (form.houseId ? shift.houseId === form.houseId : true))
                .map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.shiftType} — {shift.startTime}-{shift.endTime}
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
          <label className="text-sm font-medium text-slate-700" htmlFor="assignment-delete-query">
            Find staff to unassign
          </label>
          <input
            id="assignment-delete-query"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={deleteQuery}
            onChange={(event) => setDeleteQuery(event.target.value)}
            placeholder="Search by staff name"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="assignment-delete-select">
            Assignment
          </label>
          <select
            id="assignment-delete-select"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={deleteId}
            onChange={(event) => setDeleteId(event.target.value)}
            required
          >
            <option value="" disabled>
              Select assignment
            </option>
            {filteredAssignments.map((assignment) => {
              const staffName = `${assignment.user.firstName} ${assignment.user.lastName}`;
              const shiftName = assignment.shift.name || "(no name)";
              return (
                <option key={assignment.id} value={assignment.id}>
                  {staffName} — {shiftName} ({assignment.shift.shiftType}) · {assignment.shift.house.name}
                </option>
              );
            })}
          </select>
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
