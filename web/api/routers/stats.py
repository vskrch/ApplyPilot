"""Stats API router."""

from __future__ import annotations

from fastapi import APIRouter

from applypilot.database import get_stats
from web.api.services import job_service

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("")
async def stats_overview() -> dict:
    """Return full pipeline stats."""
    return get_stats()


@router.get("/score-distribution")
async def score_distribution() -> list[dict]:
    """Return score distribution."""
    return job_service.get_score_distribution()


@router.get("/by-site")
async def stats_by_site() -> list[dict]:
    """Return stats broken down by job source."""
    return job_service.get_stats_by_site()


@router.get("/timeline")
async def stats_timeline() -> list[dict]:
    """Return discovery timeline grouped by date."""
    return job_service.get_timeline()
