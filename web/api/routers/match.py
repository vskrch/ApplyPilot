"""Match pipeline API router."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from web.api.deps import get_match_service, get_task_registry
from web.api.models.match import (
    MatchJobsResponse,
    MatchJob,
    MatchRequest,
    MatchResult,
    MatchRunResponse,
)

router = APIRouter(prefix="/api/match", tags=["match"])


@router.post("/run", response_model=MatchRunResponse, status_code=202)
async def run_match(req: MatchRequest) -> MatchRunResponse:
    """Parse role description, scrape job platforms, save dated JSON. Returns task_id."""
    svc = get_match_service()
    task_id = await svc.start_match(req.role, req.location, req.username)
    return MatchRunResponse(task_id=task_id)


@router.get("/result/{task_id}", response_model=MatchResult)
async def match_result(task_id: str) -> MatchResult:
    registry = get_task_registry()
    st = registry.get_task(task_id)
    if not st:
        raise HTTPException(status_code=404, detail="task not found")
    if st.get("error"):
        raise HTTPException(status_code=500, detail=st["error"])
    res = st.get("result") or {}
    return MatchResult(
        task_id=task_id,
        count=res.get("count", 0),
        path=res.get("path", ""),
        criteria=res.get("criteria", {}),
    )


@router.get("/jobs", response_model=MatchJobsResponse)
async def today_jobs(username: str | None = None) -> MatchJobsResponse:
    """Load all matched jobs from the current day's JSON file(s)."""
    from applypilot.match.pipeline import today_jobs as load
    jobs = load(username)
    return MatchJobsResponse(
        date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        count=len(jobs),
        jobs=[MatchJob(**j) for j in jobs],
    )