"""Match pipeline orchestrator: parse -> scrape -> save dated JSON.

Single entry point `run_match(role, location, username)` returns the saved
file path and the matched job count.
"""

from __future__ import annotations

import logging

from applypilot.match.parser import parse_role
from applypilot.match.scraper import batch_scrape
from applypilot.match.store import save_matches, load_today_jobs

log = logging.getLogger(__name__)


def run_match(role: str, location: str, username: str, workers: int = 4) -> dict:
    """Run the zero-noise match pipeline. Returns {path, count, criteria}."""
    criteria = parse_role(role, location)
    jobs = batch_scrape(criteria, location or criteria.get("location", ""), max_workers=workers)
    path = save_matches(jobs, username, criteria)
    log.info("Matched %d jobs for '%s' -> %s", len(jobs), username, path)
    return {"path": str(path), "count": len(jobs), "criteria": criteria}


def today_jobs(username: str | None = None) -> list[dict]:
    return load_today_jobs(username)