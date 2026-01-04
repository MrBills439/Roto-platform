import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6">
        <h1 className="text-3xl font-semibold">Rota Admin</h1>
        <p className="text-center text-slate-600">
          Sign in to manage houses, users, shifts, and assignments.
        </p>
        <div className="flex gap-3">
          <Link
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            href="/login"
          >
            Go to Login
          </Link>
          <Link
            className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            href="/dashboard/houses"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
