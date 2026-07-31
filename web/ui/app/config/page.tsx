"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useConfigStore } from "@/stores/config";
import { PageHeader } from "@/components/layout/PageHeader";
import { User, Search, FileText, Terminal } from "lucide-react";

export default function ConfigPage() {
  const { fetchProfile, fetchSearches, fetchResume, fetchEnv, profile, searches, resumeText, env } = useConfigStore();

  useEffect(() => {
    fetchProfile();
    fetchSearches();
    fetchResume();
    fetchEnv();
  }, [fetchProfile, fetchSearches, fetchResume, fetchEnv]);

  const configCards = [
    {
      href: "/config/profile",
      icon: User,
      title: "Profile",
      description: "Personal information, work authorization, skills",
      status: profile ? "Configured" : "Not set",
    },
    {
      href: "/config/searches",
      icon: Search,
      title: "Search Config",
      description: "Job search queries, locations, boards",
      status: searches ? `${Object.keys(searches).length} searches` : "Not set",
    },
    {
      href: "/config/resume",
      icon: FileText,
      title: "Resume",
      description: "Resume content and PDF",
      status: resumeText ? "Available" : "Not set",
    },
    {
      href: "/config/env",
      icon: Terminal,
      title: "Environment",
      description: "API keys, LLM settings",
      status: env?.gemini_key_set ? "Configured" : "Missing keys",
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Configuration"
        description="Manage your ApplyPilot settings"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {configCards.map((card) => (
          <Link key={card.href} href={card.href} className="card hover:border-[var(--accent)] transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                <card.icon size={24} className="text-[var(--accent)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{card.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{card.description}</p>
                <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                  card.status === "Not set" || card.status === "Missing keys"
                    ? "bg-[var(--danger)]/20 text-[var(--danger)]"
                    : "bg-[var(--success)]/20 text-[var(--success)]"
                }`}>
                  {card.status}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
