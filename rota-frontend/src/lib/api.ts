import { clearAuth, getToken } from "./auth";

export type ApiErrorPayload = {
  error?: { message: string; code: string };
  details?: unknown;
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const getBaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }
  return base;
};

const handleUnauthorized = () => {
  clearAuth();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

export const apiFetch = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new ApiError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? ((await res.json()) as ApiErrorPayload | T)
    : undefined;

  if (!res.ok) {
    const errorPayload = payload as ApiErrorPayload | undefined;
    const message = errorPayload?.error?.message || "Request failed";
    const code = errorPayload?.error?.code || "REQUEST_FAILED";
    throw new ApiError(message, res.status, code, errorPayload?.details);
  }

  return payload as T;
};
