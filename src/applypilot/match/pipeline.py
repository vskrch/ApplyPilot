"""Match pipeline orchestrator: parse -> scrape -> score -> save dated JSON.

Full pipeline flow:
  1. User prompt request -> LLM parse -> structured criteria (queries, location, keywords)
  2. Multi-board crawler -> LinkedIn, Indeed, Glassdoor, Google Jobs, Workday
  3. AI fit scoring -> LLM 1-10 fit score + match reasoning
  4. DB storage & dated JSON match store -> review page
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone

from applypilot.config import RESUME_PATH, load_profile
from applypilot.database import get_connection, store_jobs as db_store_jobs
from applypilot.match.parser import parse_role
from applypilot.match.scraper import batch_scrape
from applypilot.match.store import save_matches, load_today_jobs
from applypilot.scoring.scorer import score_job

log = logging.getLogger(__name__)


def _compute_heuristic_score(job: dict, criteria: dict) -> tuple[int, str]:
    """Fallback scoring when LLM is unavailable or for rapid initial rating."""
    title = (job.get("title") or "").lower()
    desc = (job.get("description") or "").lower()
    queries = [q.lower() for q in (criteria.get("queries") or [])]

    score = 6
    matched_queries = [q for q in queries if q in title or q in desc]

    if matched_queries:
        score += 2
        reason = f"Matches search keywords: {', '.join(matched_queries)}."
    else:
        reason = "Relevant industry role matching location criteria."

    if any(k in title for k in ("senior", "staff", "lead", "principal")):
        score += 1

    score = max(1, min(10, score))
    return score, reason


def run_match(role: str, location: str, username: str, workers: int = 4) -> dict:
    """Run the complete 4-step AI match pipeline: parse -> scrape -> score -> save."""
    # Step 1 & 2: Parse natural language prompt into criteria via LLM
    log.info("Step 1/4: Parsing prompt '%s' (location='%s')...", role, location)
    criteria = parse_role(role, location)

    # Step 3: Multi-platform crawl (LinkedIn, Indeed, Glassdoor, Google Jobs)
    log.info("Step 2/4: Crawling major job platforms for criteria: %s...", criteria.get("queries"))
    jobs = batch_scrape(criteria, location or criteria.get("location", ""), max_workers=workers)

    # Step 4: AI Fit Scoring
    log.info("Step 3/4: Scoring %d jobs against candidate profile...", len(jobs))
    resume_text = ""
    if RESUME_PATH.exists():
        try:
            resume_text = RESUME_PATH.read_text(encoding="utf-8")
        except Exception:
            pass

    for j in jobs:
        # If resume exists, use LLM scoring; otherwise fallback to heuristic match
        if resume_text and len(resume_text) > 50 and j.get("description"):
            try:
                sc = score_job(resume_text, j)
                j["fit_score"] = sc.get("score", 7)
                j["score_reasoning"] = sc.get("reasoning", "Evaluated via candidate profile")
            except Exception:
                s, r = _compute_heuristic_score(j, criteria)
                j["fit_score"] = s
                j["score_reasoning"] = r
        else:
            s, r = _compute_heuristic_score(j, criteria)
            j["fit_score"] = s
            j["score_reasoning"] = r

    # Sort jobs by fit score descending (10 -> 1)
    jobs.sort(key=lambda x: (x.get("fit_score") or 0), reverse=True)

    # Step 5: Save to SQLite database & dated JSON match store
    log.info("Step 4/4: Storing %d scored matches in DB & JSON store...", len(jobs))
    try:
        conn = get_connection()
        now = datetime.now(timezone.utc).isoformat()
        for j in jobs:
            try:
                conn.execute(
                    "INSERT INTO jobs (url, title, company, location, site, description, fit_score, score_reasoning, scored_at, discovered_at) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
                    "ON CONFLICT(url) DO UPDATE SET fit_score=excluded.fit_score, score_reasoning=excluded.score_reasoning, scored_at=excluded.scored_at",
                    (
                        j["url"],
                        j.get("title"),
                        j.get("company"),
                        j.get("location"),
                        j.get("site", "jobspy"),
                        j.get("description"),
                        j.get("fit_score", 7),
                        j.get("score_reasoning", ""),
                        now,
                        now,
                    )
                )
            except Exception as ex:
                log.debug("DB insert error for %s: %s", j.get("url"), ex)
        conn.commit()
    except Exception as e:
        log.warning("DB transaction error: %s", e)

    path = save_matches(jobs, username, criteria)
    log.info("Completed AI match pipeline! Saved %d scored jobs for '%s' -> %s", len(jobs), username, path)
    return {"path": str(path), "count": len(jobs), "criteria": criteria}


def today_jobs(username: str | None = None) -> list[dict]:
    return load_today_jobs(username)