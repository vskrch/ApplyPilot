"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMatchStore } from "@/stores/match";
import { ArrowRight, Loader2 } from "lucide-react";

const DEFAULT_LOCATION =
  "Canada (Toronto, Vancouver, Ottawa, Montreal, Calgary), USA (remote)";

export default function LandingPage() {
  const router = useRouter();
  const { isRunning, statusMsg, runMatch, pollResult, loadTodayJobs } = useMatchStore();
  const [role, setRole] = useState("");
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [username, setUsername] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ponytail: load saved username + today's job count once
  useEffect(() => {
    const saved = localStorage.getItem("ap_username") || "";
    if (saved) setUsername(saved);
    loadTodayJobs(saved || undefined);
  }, [loadTodayJobs]);

  // Poll the match task until it finishes, then route to /review
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
    <div className="matcha-root">
      <div className="matcha-container">
        <div className="matcha-eyebrow">Zero-noise job matching</div>
        <h1 className="matcha-hero">Remote startup roles in your inbox</h1>
        <p className="matcha-sub">
          We read every job description across 10k+ under-the-radar remote startups
          and surface only the handful of roles that actually fit you — delivered as
          a single, zero-noise list. No spam, no recruiters, no scrolling.
        </p>

        <form onSubmit={submit} className="flex flex-col gap-5">
          <div>
            <label className="matcha-label" htmlFor="role">Describe your ideal role</label>
            <input
              id="role"
              className="matcha-input"
              placeholder="e.g. Senior Python backend engineer at a remote-first fintech"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isRunning}
              autoFocus
            />
          </div>

          <div>
            <label className="matcha-label" htmlFor="location">Location (optional)</label>
            <input
              id="location"
              className="matcha-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="matcha-label" htmlFor="username">Your username (optional)</label>
            <input
              id="username"
              className="matcha-input"
              placeholder="anonymous"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isRunning}
            />
          </div>

          <div className="flex items-center gap-3 mt-1">
            <button type="submit" className="matcha-btn" disabled={isRunning || !role.trim()}>
              {isRunning ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {isRunning ? "Matching…" : "Find my roles"}
            </button>
            {!isRunning && todayCount > 0 && (
              <button type="button" className="matcha-btn matcha-btn-ghost" onClick={() => router.push("/review")}>
                Review today&apos;s {todayCount} jobs
              </button>
            )}
          </div>
        </form>

        {statusMsg && (
          <div className="matcha-status">
            <Loader2 size={16} className={isRunning ? "animate-spin" : "hidden"} />
            <span>{statusMsg}</span>
          </div>
        )}

        <p className="matcha-note">
          Covers LinkedIn, Indeed, Eluta, Job Bank, Talent.com, RemoteOK, WeWorkRemotely,
          and 10k+ remote startup boards. Matches are saved to a dated, timestamped file.
        </p>
      </div>
    </div>
  );
}