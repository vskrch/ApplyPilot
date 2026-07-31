"""Jobs API router — query-param based for reliable URL routing."""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from web.api.models.job import (
    JobActionResponse,
    JobCoverLetterResponse,
    JobDeleteResponse,
    JobDetail,
    JobListResponse,
    JobMarkRequest,
    JobResumeResponse,
    ScoreOverride,
)
from web.api.services import job_service

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("", response_model=JobListResponse)
async def list_jobs(
    stage: Optional[str] = Query(None),
    min_score: Optional[int] = Query(None),
    max_score: Optional[int] = Query(None),
    site: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("fit_score"),
    sort_dir: str = Query("desc"),
    page: int = Query(1),
    limit: int = Query(50),
) -> JobListResponse:
    """List jobs with filtering, sorting, and pagination."""
    return job_service.get_job_list(
        stage=stage,
        min_score=min_score,
        max_score=max_score,
        site=site,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        limit=limit,
    )


@router.get("/detail", response_model=JobDetail)
async def get_job_by_query(url: str = Query(...)) -> JobDetail:
    """Get full job details by URL query parameter."""
    job = job_service.get_job_detail(url)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/resume", response_model=JobResumeResponse)
async def get_job_resume_by_query(url: str = Query(...)) -> JobResumeResponse:
    """Get original and tailored resume for a job by URL query parameter."""
    result = job_service.get_job_resume(url)
    if not result:
        raise HTTPException(status_code=404, detail="Job or resume not found")
    return result


@router.get("/cover-letter", response_model=JobCoverLetterResponse)
async def get_job_cover_letter_by_query(url: str = Query(...)) -> JobCoverLetterResponse:
    """Get cover letter for a job by URL query parameter."""
    result = job_service.get_job_cover_letter(url)
    if not result:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    return result


@router.put("/score", response_model=JobActionResponse)
async def update_score(body: ScoreOverride, url: Optional[str] = Query(None)) -> JobActionResponse:
    """Manually override a job's score."""
    target_url = url or body.url
    if not target_url:
        raise HTTPException(status_code=400, detail="Missing job URL")
    job = job_service.get_job_detail(target_url)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job_service.update_job_score(target_url, body.score, body.reasoning)
    return JobActionResponse()


@router.post("/mark", response_model=JobActionResponse)
async def mark_job_status(body: JobMarkRequest) -> JobActionResponse:
    """Mark job apply status (e.g. applied, failed)."""
    job = job_service.get_job_detail(body.url)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    from web.api.services.apply_service import mark_job_status as apply_mark
    apply_mark(body.url, body.status, body.reason)
    return JobActionResponse()


@router.delete("/detail", response_model=JobDeleteResponse)
async def delete_job_by_query(url: str = Query(...)) -> JobDeleteResponse:
    """Delete a job by URL query parameter."""
    job = job_service.get_job_detail(url)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job_service.delete_job(url)
    return JobDeleteResponse()
