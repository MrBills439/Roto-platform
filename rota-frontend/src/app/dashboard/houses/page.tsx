"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../../../lib/api";
import type { House } from "../../../types/api";

export default function HousesPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    void loadHouses();
  }, []);

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
    </div>
  );
}
