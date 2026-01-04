"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth, getToken, getUser } from "../../lib/auth";

const navItems = [
  { label: "Houses", href: "/dashboard/houses" },
  { label: "Users", href: "/dashboard/users" },
  { label: "Shifts", href: "/dashboard/shifts" },
  { label: "Assignments", href: "/dashboard/assignments" }
];

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userLabel, setUserLabel] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const user = getUser();
    if (user) {
      setUserLabel(`${user.email} (${user.role})`);
    }
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  return (
    <div className="relative min-h-screen bg-[#f7f7f4] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-[#ffe7e8] blur-3xl" />
        <div className="absolute right-10 top-40 h-80 w-80 rounded-full bg-[#e8f2ff] blur-3xl" />
      </div>
      <div className="relative flex min-h-screen">
        <aside className="w-64 border-r border-[#e6e7ea] bg-white/80 p-6 backdrop-blur">
          <div className="mb-8 flex items-center gap-2 text-lg font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ff5a5f] text-sm font-semibold text-white">
              R
            </span>
            <span>Rota Admin</span>
          </div>
          <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[#151618] text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-[#e6e7ea] bg-white/80 px-6 py-4 backdrop-blur">
            <div className="text-sm text-slate-600">Dashboard</div>
            <div className="flex items-center gap-4">
              {userLabel ? (
                <span className="rounded-full bg-[#f2f3f5] px-3 py-1 text-xs font-medium text-slate-600">
                  {userLabel}
                </span>
              ) : null}
              <button
                type="button"
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </header>
          <main className="flex-1 px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
