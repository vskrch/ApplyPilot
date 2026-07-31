"""Pydantic models for the match pipeline API."""

from __future__ import annotations

from pydantic import BaseModel, Field


class MatchRequest(BaseModel):
    role: str = Field(..., description="Free-text 'describe your ideal role'")
    location: str = Field(
        default="Canada (Toronto, Vancouver, Ottawa, Montreal, Calgary), USA (remote)",
        description="Location filter; pre-filled default.",
    )
    username: str = Field(default="anonymous", description="Submitting user's username")


class MatchJob(BaseModel):
    title: str | None = None
    company: str | None = None
    location: str | None = None
    description: str | None = None
    url: str
    posting_date: str | None = None
    username: str | None = None


class MatchRunResponse(BaseModel):
    task_id: str
    status: str = "started"


class MatchResult(BaseModel):
    task_id: str
    count: int
    path: str
    criteria: dict


class MatchJobsResponse(BaseModel):
    date: str
    count: int
    jobs: list[MatchJob]