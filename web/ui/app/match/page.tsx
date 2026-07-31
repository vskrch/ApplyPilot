"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMatchStore } from "@/stores/match";
import { ArrowRight, Loader2, Sparkles, Search, MapPin, User, CheckCircle2 } from "lucide-react";

const DEFAULT_LOCATION =
  "Canada (Toronto, Vancouver, Ottawa, Montreal, Calgary), USA (remote)";

export default function MatchPage() {
  const router = useRouter();
  const { isRunning, statusMsg, runMatch, pollResult, loadTodayJobs } = useMatchStore();
  const [role, setRole] = useState("");
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [username, setUsername] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ap_username") || "";
    if (saved) setUsername(saved);
    loadTodayJobs(saved || undefined);
  }, [loadTodayJobs]);

  useEffect(() => {
    if (!isRunning) return;
    pollRef.current = setInterval(async () => {
      const done = await pollResult();
      if (done !== null) {
        if (pollRef.current) clearInterval(pollRef.current);
        if (done) router.push("/review");
      }
    }, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isRunning, pollResult, router]);

  const todayCount = useMatchStore((s) => s.todayJobs.length);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim() || isRunning) return;
    const u = username.trim() || "anonymous";
    localStorage.setItem("ap_username", u);
    await runMatch(role.trim(), location.trim() || DEFAULT_LOCATION, u);
  };

  return (
    <div className="p-6 bg-[#0a0c10] min-h-screen space-y-6 flex flex-col justify-center max-w-4xl mx-auto">
      <div className="card bg-[#12161f] border-[#2a3447] p-8 md:p-10 rounded-2xl space-y-6 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
            <Sparkles size={14} /> Zero-Noise Startup Role Matcher
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 leading-tight">
            Remote Startup Roles in Your Inbox
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-2xl">
            We analyze job descriptions across 10,000+ remote startup portals and surface only the high-fit roles matching your profile query.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-2" htmlFor="role">
              <Search size={14} className="text-blue-400" /> Ideal Role Description
            </label>
            <input
              id="role"
              className="input w-full bg-[#181d28] border-[#2a3447] text-slate-100 text-sm focus:border-emerald-500 p-3 h-12 rounded-xl"
              placeholder="e.g. Senior Python backend engineer at a remote-first fintech startup"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isRunning}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-2" htmlFor="location">
                <MapPin size={14} className="text-amber-400" /> Location / Regions
              </label>
              <input
                id="location"
                className="input w-full bg-[#181d28] border-[#2a3447] text-slate-100 text-xs focus:border-emerald-500 p-3 h-10 rounded-xl"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isRunning}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-2" htmlFor="username">
                <User size={14} className="text-purple-400" /> Your Handle / Handle Filter
              </label>
              <input
                id="username"
                className="input w-full bg-[#181d28] border-[#2a3447] text-slate-100 text-xs focus:border-emerald-500 p-3 h-10 rounded-xl"
                placeholder="anonymous"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-white border-none h-11 px-6 rounded-xl font-semibold flex items-center gap-2 text-sm"
              disabled={isRunning || !role.trim()}
            >
              {isRunning ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {isRunning ? "Running Matcher…" : "Find Matching Roles"}
            </button>
            {!isRunning && todayCount > 0 && (
              <button
                type="button"
                className="btn btn-ghost border-[#2a3447] text-emerald-400 hover:bg-emerald-500/10 h-11 px-5 rounded-xl text-xs font-medium flex items-center gap-2"
                onClick={() => router.push("/review")}
              >
                <CheckCircle2 size={16} />
                Review Today&apos;s {todayCount} Roles
              </button>
            )}
          </div>
        </form>

        {statusMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-3">
            <Loader2 size={16} className={isRunning ? "animate-spin" : "hidden"} />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="pt-4 border-t border-[#2a3447] text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>Scrapes LinkedIn, Indeed, RemoteOK, WeWorkRemotely & 10,000+ career sites.</span>
          <span className="font-mono text-slate-400">Results saved to dated JSON</span>
        </div>
      </div>
    </div>
  );
}
