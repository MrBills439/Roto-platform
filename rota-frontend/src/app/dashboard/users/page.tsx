"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../../../lib/api";
import type { UserSummary } from "../../../types/api";

const roles = ["MANAGER", "TEAM_LEADER", "STAFF"] as const;
const genders = ["M", "F", "OTHER", "NA"] as const;

export default function UsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [staffOnly, setStaffOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "STAFF",
    phone: "",
    gender: "NA"
  });
  const [loading, setLoading] = useState(false);

  const formatError = (err: ApiError) => {
    if (err.code === "VALIDATION_ERROR" && err.details && typeof err.details === "object") {
      const details = err.details as { fieldErrors?: Record<string, string[]> };
      const fieldErrors = details.fieldErrors || {};
      const firstField = Object.keys(fieldErrors)[0];
      if (firstField && fieldErrors[firstField]?.length) {
        return `${firstField}: ${fieldErrors[firstField][0]}`;
      }
    }
    return err.message;
  };

  const loadUsers = async () => {
    setError(null);
    try {
      const query = staffOnly ? "?role=STAFF" : "";
      const data = await apiFetch<UserSummary[]>(`/users${query}`);
      setUsers(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load users");
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
    void loadUsers();
  }, [staffOnly]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const payload = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        phone: form.phone || undefined,
        gender: form.gender || undefined
      };
      const created = await apiFetch<UserSummary>("/users", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setSuccess(`Created user ${created.email}`);
      setForm({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "STAFF",
        phone: "",
        gender: "NA"
      });
      await loadUsers();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(formatError(err));
      } else {
        setError("Failed to create user");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {role === "STAFF" ? (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          You do not have access to manage users.
        </div>
      ) : null}
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-slate-600">Manage staff accounts and access.</p>
      </div>

      <form className="space-y-4 rounded border border-slate-200 bg-white p-4" onSubmit={handleCreate}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="user-email">
              Email
            </label>
            <input
              id="user-email"
              type="email"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="user-password">
              Password
            </label>
            <input
              id="user-password"
              type="password"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="user-first-name">
              First name
            </label>
            <input
              id="user-first-name"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.firstName}
              onChange={(event) => setForm({ ...form, firstName: event.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="user-last-name">
              Last name
            </label>
            <input
              id="user-last-name"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.lastName}
              onChange={(event) => setForm({ ...form, lastName: event.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="user-role">
              Role
            </label>
            <select
              id="user-role"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
              required
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="user-gender">
              Gender
            </label>
            <select
              id="user-gender"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.gender}
              onChange={(event) => setForm({ ...form, gender: event.target.value })}
            >
              {genders.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="user-phone">
              Phone
            </label>
            <input
              id="user-phone"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
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
          {loading ? "Creating..." : "Create user"}
        </button>
      </form>

      <div className="flex items-center gap-2">
        <input
          id="staff-only"
          type="checkbox"
          checked={staffOnly}
          onChange={(event) => setStaffOnly(event.target.checked)}
        />
        <label htmlFor="staff-only" className="text-sm text-slate-600">
          Show staff only
        </label>
      </div>

      <div className="rounded border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
          Users
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Active</th>
                <th className="px-4 py-2">ID</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-2 text-slate-700">{user.email}</td>
                  <td className="px-4 py-2 text-slate-700">{user.role}</td>
                  <td className="px-4 py-2 text-slate-700">{user.isActive ? "Yes" : "No"}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">{user.id}</td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                    No users found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
