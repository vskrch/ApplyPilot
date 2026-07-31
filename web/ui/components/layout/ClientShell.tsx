"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "sonner";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto min-h-screen">{children}</main>
      <Toaster position="top-right" theme="dark" richColors />
    </div>
  );
}
