"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "sonner";

const FULL_BLEED = new Set(["/", "/review"]);

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullBleed = FULL_BLEED.has(pathname);

  if (fullBleed) {
    return (
      <>
        {children}
        <Toaster position="top-right" theme="dark" richColors />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto min-h-screen">{children}</main>
      <Toaster position="top-right" theme="dark" richColors />
    </div>
  );
}
