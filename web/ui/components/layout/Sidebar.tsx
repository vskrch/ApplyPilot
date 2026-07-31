"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConfigStore } from "@/stores/config";
import {
  LayoutDashboard,
  Briefcase,
  Play,
  Zap,
  BarChart3,
  Settings,
  Stethoscope,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/pipeline", label: "Pipeline", icon: Play },
  { href: "/apply", label: "Apply", icon: Zap },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/config", label: "Config", icon: Settings },
  { href: "/doctor", label: "Doctor", icon: Stethoscope },
];

export function Sidebar() {
  const pathname = usePathname();
  const tier = useConfigStore((s) => s.tier);
  const tierLabel = useConfigStore((s) => s.tierLabel);

  const tierColors: Record<number, string> = {
    1: "badge-gray",
    2: "badge-blue",
    3: "badge-purple",
  };

  return (
    <aside className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-[var(--border)]">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">ApplyPilot</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                active
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--border)]">
        <div className={`badge ${tierColors[tier] || "badge-gray"}`}>
          Tier {tier}: {tierLabel}
        </div>
      </div>
    </aside>
  );
}
