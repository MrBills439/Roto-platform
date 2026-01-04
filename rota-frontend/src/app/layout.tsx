import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rota Admin",
  description: "Rota platform admin"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
