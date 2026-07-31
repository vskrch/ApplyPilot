"use client";

import { useEffect } from "react";
import { useConfigStore } from "@/stores/config";
import { PageHeader } from "@/components/layout/PageHeader";
import { CheckCircle, AlertTriangle, XCircle, AlertCircle } from "lucide-react";
import { clsx } from "@/lib/utils";

export default function DoctorPage() {
  const { doctorChecks, tier, tierLabel, fetchDoctor } = useConfigStore();

  useEffect(() => {
    fetchDoctor();
  }, [fetchDoctor]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle size={20} className="text-[var(--success)]" />;
      case "missing":
        return <XCircle size={20} className="text-[var(--danger)]" />;
      case "warn":
        return <AlertTriangle size={20} className="text-[var(--warning)]" />;
      case "optional":
        return <AlertCircle size={20} className="text-[var(--text-muted)]" />;
      default:
        return <AlertCircle size={20} className="text-[var(--text-muted)]" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const tierNames = ["Discovery", "Standard", "Premium", "Enterprise"];

  return (
    <div className="p-6">
      <PageHeader
        title="Health Check"
        description="System diagnostics and configuration status"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {doctorChecks.map((check, i) => (
          <div key={i} className="card">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-[var(--text-primary)]">{check.name}</h3>
              {getStatusIcon(check.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className={clsx(
                "text-xs px-2 py-1 rounded",
                check.status === "ok" && "bg-[var(--success)]/20 text-[var(--success)]",
                check.status === "missing" && "bg-[var(--danger)]/20 text-[var(--danger)]",
                check.status === "warn" && "bg-[var(--warning)]/20 text-[var(--warning)]",
                check.status === "optional" && "bg-[var(--text-muted)]/20 text-[var(--text-muted)]"
              )}>
                {getStatusLabel(check.status)}
              </span>
            </div>
            {check.note && (
              <p className="text-sm text-[var(--text-secondary)] mt-3">{check.note}</p>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Current Tier</h3>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-[var(--accent)]">
            {tierLabel}
          </span>
          <span className="text-sm text-[var(--text-muted)]">
            (Tier {tier} - {tierNames[tier - 1] || "Unknown"})
          </span>
        </div>
      </div>
    </div>
  );
}
