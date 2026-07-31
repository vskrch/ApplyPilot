"""Jobs API router."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from web.api.models.job import (
    JobActionResponse,
    JobCoverLetterResponse,
    JobDeleteResponse,
    JobDetail,
    JobListResponse,
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


@router.get("/{url:path}", response_model=JobDetail)
async def get_job(url: str) -> JobDetail:
    """Get full job details by URL."""
    job = job_service.get_job_detail(url)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/{url:path}/resume", response_model=JobResumeResponse)
async def get_job_resume(url: str) -> JobResumeResponse:
    """Get original and tailored resume for a job."""
    result = job_service.get_job_resume(url)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    return result


@router.get("/{url:path}/cover-letter", response_model=JobCoverLetterResponse)
async def get_job_cover_letter(url: str) -> JobCoverLetterResponse:
    """Get cover letter for a job."""
    result = job_service.get_job_cover_letter(url)
    if not result:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    return result


@router.put("/{url:path}/score", response_model=JobActionResponse)
async def update_score(url: str, body: ScoreOverride) -> JobActionResponse:
    """Manually override a job's score."""
    job = job_service.get_job_detail(url)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job_service.update_job_score(url, body.score, body.reasoning)
    return JobActionResponse()


@router.delete("/{url:path}", response_model=JobDeleteResponse)
async def delete_job(url: str) -> JobDeleteResponse:
    """Delete a job."""
    job = job_service.get_job_detail(url)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job_service.delete_job(url)
    return JobDeleteResponse()
