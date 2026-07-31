"use client";

import { useEffect } from "react";
import { useConfigStore } from "@/stores/config";
import { PageHeader } from "@/components/layout/PageHeader";
import { BarChart3, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";

export default function DashboardPage() {
  const { fetchDoctor, tier, tierLabel, doctorChecks } = useConfigStore();

  useEffect(() => {
    fetchDoctor();
  }, [fetchDoctor]);

  const okCount = doctorChecks.filter((c) => c.status === "ok").length;
  const missingCount = doctorChecks.filter((c) => c.status === "missing").length;
  const warnCount = doctorChecks.filter((c) => c.status === "warn").length;

  return (
    <div className="p-6 ml-64">
      <PageHeader
        title="Dashboard"
        description="Welcome to ApplyPilot"
      />

      {!doctorChecks.length ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-[var(--success)]" />
                <div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{okCount}</div>
                  <div className="text-sm text-[var(--text-muted)]">Checks OK</div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <XCircle size={24} className="text-[var(--danger)]" />
                <div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{missingCount}</div>
                  <div className="text-sm text-[var(--text-muted)]">Missing</div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-[var(--warning)]" />
                <div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{warnCount}</div>
                  <div className="text-sm text-[var(--text-muted)]">Warnings</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 size={24} className="text-[var(--accent)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Current Tier: {tierLabel}
              </h3>
            </div>
            <p className="text-[var(--text-secondary)]">
              Your system is configured at Tier {tier}. {missingCount > 0 ? `${missingCount} configuration items need attention.` : "All systems operational."}
            </p>
          </div>

          {doctorChecks.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Health Check Summary</h3>
              <div className="space-y-2">
                {doctorChecks.map((check, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                    <span className="text-[var(--text-secondary)]">{check.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      check.status === "ok" ? "bg-[var(--success)]/20 text-[var(--success)]" :
                      check.status === "missing" ? "bg-[var(--danger)]/20 text-[var(--danger)]" :
                      check.status === "warn" ? "bg-[var(--warning)]/20 text-[var(--warning)]" :
                      "bg-[var(--text-muted)]/20 text-[var(--text-muted)]"
                    }`}>
                      {check.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
