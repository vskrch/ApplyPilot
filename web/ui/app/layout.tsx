"use client";

import { usePathname } from "next/navigation";
import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "ApplyPilot",
  description: "Automated job application pipeline",
};

const FULL_BLEED = new Set(["/", "/review"]);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const fullBleed = FULL_BLEED.has(pathname);

  if (fullBleed) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}