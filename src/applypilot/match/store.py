"""Dated JSON store: write matched jobs to a day/timestamp-stamped JSON file.

Layout: ~/.applypilot/matches/YYYY-MM-DD/HHMMSS_<username>.json
Each entry carries full metadata plus the submitting user's username.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from applypilot.config import APP_DIR


def matches_dir() -> Path:
    return APP_DIR / "matches"


def save_matches(jobs: list[dict], username: str, criteria: dict | None = None) -> Path:
    """Write matched jobs to a dated, timestamped JSON file. Returns the path."""
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    ts = datetime.now(timezone.utc).strftime("%H%M%S")
    safe_user = "".join(c for c in (username or "anonymous") if c.isalnum() or c in "-_") or "anonymous"
    d = matches_dir() / day
    d.mkdir(parents=True, exist_ok=True)
    path = d / f"{ts}_{safe_user}.json"

    payload = {
        "date": day,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "username": username or "anonymous",
        "criteria": criteria or {},
        "count": len(jobs),
        "jobs": jobs,
    }
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return path


def load_today_jobs(username: str | None = None) -> list[dict]:
    """Load all jobs from the current day's JSON files (optionally filtered by user)."""
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    d = matches_dir() / day
    if not d.exists():
        return []
    jobs: list[dict] = []
    seen: set[str] = set()
    for f in sorted(d.glob("*.json"), reverse=True):
        try:
            payload = json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            continue
        if username and payload.get("username") != username:
            continue
        for j in payload.get("jobs", []):
            url = j.get("url")
            if url and url not in seen:
                seen.add(url)
                j = dict(j)
                j["username"] = payload.get("username")
                jobs.append(j)
    return jobs