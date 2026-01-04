"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../../../lib/api";
import type { NotificationItem } from "../../../types/api";

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(value));

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(value));

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  const loadNotifications = async () => {
    setError(null);
    try {
      const data = await apiFetch<NotificationItem[]>("/notifications");
      setItems(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load notifications");
      }
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const handleAccept = async (assignmentId: string, notificationId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/assignments/${assignmentId}/accept`, { method: "POST" });
      await apiFetch(`/notifications/${notificationId}/read`, { method: "PATCH" });
      setSuccess("Assignment accepted");
      await loadNotifications();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "ASSIGNMENT_NOT_PENDING" || err.code === "ASSIGNMENT_EXPIRED") {
          await apiFetch(`/notifications/${notificationId}/read`, { method: "PATCH" });
          setError(err.message);
          await loadNotifications();
          return;
        }
        setError(err.message);
      } else {
        setError("Failed to accept assignment");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (assignmentId: string, notificationId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/assignments/${assignmentId}/reject`, { method: "POST" });
      await apiFetch(`/notifications/${notificationId}/read`, { method: "PATCH" });
      setSuccess("Assignment rejected");
      await loadNotifications();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "ASSIGNMENT_NOT_PENDING" || err.code === "ASSIGNMENT_EXPIRED") {
          await apiFetch(`/notifications/${notificationId}/read`, { method: "PATCH" });
          setError(err.message);
          await loadNotifications();
          return;
        }
        setError(err.message);
      } else {
        setError("Failed to reject assignment");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-slate-600">Review assignment requests and updates.</p>
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

      <div className="rounded-2xl border border-[#e6e7ea] bg-white p-4 shadow-sm">
        <div className="space-y-3">
          {items.map((item) => {
            const data = item.data as { assignmentId?: string; expiresAt?: string } | null;
            const expiresAtMs = data?.expiresAt ? new Date(data.expiresAt).getTime() : null;
            const isExpired = now !== null && expiresAtMs !== null && expiresAtMs < now;
            const canRespond = item.type === "SHIFT_ASSIGNED" && data?.assignmentId && !isExpired;
            return (
              <div key={item.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-800">{item.title}</div>
                  <div className="text-xs text-slate-400">
                    {formatDateTime(item.createdAt)}
                  </div>
                </div>
                <div className="mt-1 text-slate-600">{item.body}</div>
                {data?.expiresAt ? (
                  <div className="mt-1 text-xs text-amber-600">
                    Expires at {formatTime(data.expiresAt)}
                    {isExpired ? " (expired)" : null}
                  </div>
                ) : null}
                {canRespond ? (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="rounded-full bg-[#151618] px-3 py-1 text-xs font-semibold text-white"
                      onClick={() => handleAccept(data.assignmentId!, item.id)}
                      disabled={loading}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                      onClick={() => handleReject(data.assignmentId!, item.id)}
                      disabled={loading}
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
              No notifications yet.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
