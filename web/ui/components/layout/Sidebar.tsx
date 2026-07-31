"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConfigStore } from "@/stores/config";
import {
  Rocket,
  LayoutDashboard,
  Briefcase,
  Play,
  Zap,
  BarChart3,
  Settings,
  Stethoscope,
  Activity,
  CheckCircle2,
} from "lucide-react";

const navSections = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/jobs", label: "Jobs Center", icon: Briefcase },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Automation",
    items: [
      { href: "/pipeline", label: "Pipeline Control", icon: Play },
      { href: "/apply", label: "Auto-Apply Workers", icon: Zap },
    ],
  },
  {
    title: "Configuration",
    items: [
      { href: "/config", label: "Settings & Profile", icon: Settings },
      { href: "/doctor", label: "System Health", icon: Stethoscope },
    ],
  },
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
    <aside className="w-64 bg-[#12161f] border-r border-[#2a3447] flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#2a3447] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Rocket size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">ApplyPilot</h1>
            <p className="text-[11px] text-slate-400 font-medium">SaaS Control Plane</p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/25 font-semibold"
                      : "text-slate-400 hover:bg-[#1e2636] hover:text-slate-200"
                  }`}
                >
                  <Icon size={16} className={active ? "text-white" : "text-slate-400"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Status & Tier */}
      <div className="p-4 border-t border-[#2a3447] bg-[#0d1017] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-medium text-slate-300">Live API Ready</span>
        </div>
        <div className={`badge ${tierColors[tier] || "badge-gray"} text-[10px]`}>
          Tier {tier}: {tierLabel}
        </div>
      </div>
    </aside>
  );
}
