"""Job service — bridge between API and applypilot database module."""

from __future__ import annotations

import math
from pathlib import Path

from applypilot.database import get_connection

from web.api.models.job import (
    JobCoverLetterResponse,
    JobDetail,
    JobListResponse,
    JobResumeResponse,
    JobSummary,
)


def get_job_list(
    stage: str | None = None,
    min_score: int | None = None,
    max_score: int | None = None,
    site: str | None = None,
    search: str | None = None,
    sort_by: str = "fit_score",
    sort_dir: str = "desc",
    page: int = 1,
    limit: int = 50,
) -> JobListResponse:
    """Fetch jobs with filtering, sorting, and pagination."""
    conn = get_connection()

    conditions: list[str] = []
    params: list = []

    # Stage filter
    stage_map = {
        "discovered": "1=1",
        "pending_enrichment": "detail_scraped_at IS NULL",
        "enriched": "full_description IS NOT NULL",
        "pending_score": "full_description IS NOT NULL AND fit_score IS NULL",
        "scored": "fit_score IS NOT NULL",
        "tailored": "tailored_resume_path IS NOT NULL",
        "ready_to_apply": (
            "tailored_resume_path IS NOT NULL AND applied_at IS NULL "
            "AND application_url IS NOT NULL"
        ),
        "applied": "applied_at IS NOT NULL",
        "failed": "apply_status = 'failed'",
    }
    if stage and stage in stage_map:
        conditions.append(stage_map[stage])

    if min_score is not None:
        conditions.append("fit_score >= ?")
        params.append(min_score)
    if max_score is not None:
        conditions.append("fit_score <= ?")
        params.append(max_score)
    if site:
        conditions.append("site = ?")
        params.append(site)
    if search:
        conditions.append("(title LIKE ? OR location LIKE ? OR description LIKE ?)")
        like = f"%{search}%"
        params.extend([like, like, like])

    where = " AND ".join(conditions) if conditions else "1=1"

    # Count total
    count_row = conn.execute(f"SELECT COUNT(*) FROM jobs WHERE {where}", params).fetchone()
    total = count_row[0] if count_row else 0

    # Sorting
    valid_sorts = {
        "fit_score": "fit_score",
        "title": "title",
        "site": "site",
        "location": "location",
        "discovered_at": "discovered_at",
        "applied_at": "applied_at",
    }
    sort_col = valid_sorts.get(sort_by, "fit_score")
    order = "ASC" if sort_dir.lower() == "asc" else "DESC"

    # Pagination
    offset = (page - 1) * limit
    pages = max(1, math.ceil(total / limit))

    query = f"""
        SELECT url, title, salary, location, site, fit_score, score_reasoning,
               discovered_at, applied_at, apply_status, tailored_resume_path,
               cover_letter_path
        FROM jobs
        WHERE {where}
        ORDER BY {sort_col} {order} NULLS LAST, discovered_at DESC
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    rows = conn.execute(query, params).fetchall()

    jobs = [
        JobSummary(
            url=row["url"],
            title=row["title"],
            salary=row["salary"],
            location=row["location"],
            site=row["site"],
            fit_score=row["fit_score"],
            score_reasoning=row["score_reasoning"],
            discovered_at=row["discovered_at"],
            applied_at=row["applied_at"],
            apply_status=row["apply_status"],
            tailored_resume_path=row["tailored_resume_path"],
            cover_letter_path=row["cover_letter_path"],
        )
        for row in rows
    ]

    return JobListResponse(jobs=jobs, total=total, page=page, pages=pages)


def get_job_detail(url: str) -> JobDetail | None:
    """Fetch full job detail by URL."""
    conn = get_connection()
    row = conn.execute("SELECT * FROM jobs WHERE url = ?", (url,)).fetchone()
    if not row:
        return None

    return JobDetail(
        url=row["url"],
        title=row["title"],
        salary=row["salary"],
        location=row["location"],
        site=row["site"],
        description=row["description"],
        full_description=row["full_description"],
        application_url=row["application_url"],
        fit_score=row["fit_score"],
        score_reasoning=row["score_reasoning"],
        discovered_at=row["discovered_at"],
        detail_scraped_at=row["detail_scraped_at"],
        detail_error=row["detail_error"],
        scored_at=row["scored_at"],
        tailored_resume_path=row["tailored_resume_path"],
        tailored_at=row["tailored_at"],
        tailor_attempts=row["tailor_attempts"],
        cover_letter_path=row["cover_letter_path"],
        cover_letter_at=row["cover_letter_at"],
        cover_attempts=row["cover_attempts"],
        applied_at=row["applied_at"],
        apply_status=row["apply_status"],
        apply_error=row["apply_error"],
        apply_attempts=row["apply_attempts"],
        agent_id=row["agent_id"],
        last_attempted_at=row["last_attempted_at"],
        apply_duration_ms=row["apply_duration_ms"],
        strategy=row["strategy"],
        verification_confidence=row["verification_confidence"],
    )


def get_job_resume(url: str) -> JobResumeResponse | None:
    """Get original and tailored resume content for a job."""
    conn = get_connection()
    row = conn.execute(
        "SELECT tailored_resume_path FROM jobs WHERE url = ?", (url,)
    ).fetchone()
    if not row:
        return None

    original = ""
    tailored = ""
    pdf_url = None

    resume_path = Path.home() / ".applypilot" / "resume.txt"
    if resume_path.exists():
        original = resume_path.read_text(encoding="utf-8")

    trp = row["tailored_resume_path"]
    if trp:
        txt_path = Path(trp).with_suffix(".txt")
        if txt_path.exists():
            tailored = txt_path.read_text(encoding="utf-8")
        pdf_path = Path(trp).with_suffix(".pdf")
        if pdf_path.exists():
            pdf_url = f"/api/files/resume/{pdf_path.name}"

    return JobResumeResponse(original=original, tailored=tailored, pdf_url=pdf_url)


def get_job_cover_letter(url: str) -> JobCoverLetterResponse | None:
    """Get cover letter content for a job."""
    conn = get_connection()
    row = conn.execute(
        "SELECT cover_letter_path FROM jobs WHERE url = ?", (url,)
    ).fetchone()
    if not row or not row["cover_letter_path"]:
        return None

    cl_path = Path(row["cover_letter_path"])
    text = ""
    pdf_url = None

    txt_path = cl_path.with_suffix(".txt") if cl_path.suffix == ".pdf" else cl_path
    if txt_path.exists():
        text = txt_path.read_text(encoding="utf-8")

    pdf_path = cl_path.with_suffix(".pdf")
    if pdf_path.exists():
        pdf_url = f"/api/files/cover-letter/{pdf_path.name}"

    return JobCoverLetterResponse(text=text, pdf_url=pdf_url)


def update_job_score(url: str, score: int, reasoning: str = "") -> bool:
    """Manually override a job's score."""
    conn = get_connection()
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "UPDATE jobs SET fit_score = ?, score_reasoning = ?, scored_at = ? WHERE url = ?",
        (score, reasoning, now, url),
    )
    conn.commit()
    return True


def delete_job(url: str) -> bool:
    """Delete a job from the database."""
    conn = get_connection()
    cursor = conn.execute("DELETE FROM jobs WHERE url = ?", (url,))
    conn.commit()
    return cursor.rowcount > 0


def get_score_distribution() -> list[dict]:
    """Get score distribution for analytics."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT fit_score, COUNT(*) as cnt FROM jobs "
        "WHERE fit_score IS NOT NULL GROUP BY fit_score ORDER BY fit_score DESC"
    ).fetchall()
    return [{"score": row["fit_score"], "count": row["cnt"]} for row in rows]


def get_stats_by_site() -> list[dict]:
    """Get job stats broken down by site."""
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT site,
               COUNT(*) as total,
               SUM(CASE WHEN fit_score >= 7 THEN 1 ELSE 0 END) as high_fit,
               AVG(CASE WHEN fit_score IS NOT NULL THEN fit_score END) as avg_score
        FROM jobs GROUP BY site ORDER BY total DESC
        """
    ).fetchall()
    return [
        {
            "site": row["site"] or "Unknown",
            "total": row["total"],
            "high_fit": row["high_fit"],
            "avg_score": round(row["avg_score"], 1) if row["avg_score"] else 0,
        }
        for row in rows
    ]


def get_timeline() -> list[dict]:
    """Get discovery timeline grouped by date."""
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT DATE(discovered_at) as date,
               COUNT(*) as discovered,
               SUM(CASE WHEN scored_at IS NOT NULL THEN 1 ELSE 0 END) as scored,
               SUM(CASE WHEN applied_at IS NOT NULL THEN 1 ELSE 0 END) as applied
        FROM jobs WHERE discovered_at IS NOT NULL
        GROUP BY DATE(discovered_at) ORDER BY date
        """
    ).fetchall()
    return [
        {
            "date": row["date"],
            "discovered": row["discovered"],
            "scored": row["scored"],
            "applied": row["applied"],
        }
        for row in rows
    ]
