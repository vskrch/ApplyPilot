import type { Metadata } from "next";
import "./globals.css";
import { ClientShell } from "@/components/layout/ClientShell";

export const metadata: Metadata = {
  title: "ApplyPilot — AI Job Application Pipeline Control Center",
  description: "Automated job discovery, AI scoring, resume tailoring, and autonomous application pipeline",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0a0c10] text-[#e2e8f0]">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}