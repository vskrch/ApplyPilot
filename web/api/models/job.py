"""Pydantic models for job-related API requests and responses."""

from __future__ import annotations

from pydantic import BaseModel, Field


class JobFilter(BaseModel):
    stage: str | None = None
    min_score: int | None = None
    max_score: int | None = None
    site: str | None = None
    search: str | None = None
    sort_by: str = "fit_score"
    sort_dir: str = "desc"
    page: int = 1
    limit: int = 50


class JobSummary(BaseModel):
    url: str
    title: str | None = None
    salary: str | None = None
    location: str | None = None
    site: str | None = None
    fit_score: int | None = None
    score_reasoning: str | None = None
    discovered_at: str | None = None
    applied_at: str | None = None
    apply_status: str | None = None
    tailored_resume_path: str | None = None
    cover_letter_path: str | None = None


class JobDetail(JobSummary):
    description: str | None = None
    full_description: str | None = None
    application_url: str | None = None
    detail_scraped_at: str | None = None
    detail_error: str | None = None
    scored_at: str | None = None
    tailored_at: str | None = None
    tailor_attempts: int | None = None
    cover_letter_at: str | None = None
    cover_attempts: int | None = None
    apply_error: str | None = None
    apply_attempts: int | None = None
    agent_id: str | None = None
    last_attempted_at: str | None = None
    apply_duration_ms: int | None = None
    strategy: str | None = None
    verification_confidence: str | None = None


class JobListResponse(BaseModel):
    jobs: list[JobSummary]
    total: int
    page: int
    pages: int


class JobResumeResponse(BaseModel):
    original: str = ""
    tailored: str = ""
    pdf_url: str | None = None


class JobCoverLetterResponse(BaseModel):
    text: str = ""
    pdf_url: str | None = None


class ScoreOverride(BaseModel):
    score: int = Field(ge=1, le=10)
    reasoning: str = ""


class JobActionResponse(BaseModel):
    updated: bool = True


class JobDeleteResponse(BaseModel):
    deleted: bool = True
