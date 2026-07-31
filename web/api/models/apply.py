"""Pydantic models for apply-related API requests and responses."""

from __future__ import annotations

from pydantic import BaseModel


class ApplyConfig(BaseModel):
    limit: int = 1
    workers: int = 1
    min_score: int = 7
    model: str = "haiku"
    headless: bool = False
    dry_run: bool = False
    continuous: bool = False
    url: str | None = None


class WorkerInfo(BaseModel):
    worker_id: int = 0
    status: str = "idle"
    job_title: str = ""
    company: str = ""
    score: int = 0
    elapsed: str = ""
    actions: int = 0
    last_action: str = ""
    jobs_applied: int = 0
    jobs_failed: int = 0
    total_cost: float = 0.0


class ApplyTotals(BaseModel):
    applied: int = 0
    failed: int = 0
    cost: float = 0.0


class ApplyStatus(BaseModel):
    running: bool = False
    workers: list[WorkerInfo] = []
    totals: ApplyTotals = ApplyTotals()


class ApplyStartResponse(BaseModel):
    task_id: str
    status: str = "started"


class ApplyStopResponse(BaseModel):
    stopped: bool = True


class ApplyMarkRequest(BaseModel):
    url: str
    status: str = "applied"
    reason: str | None = None


class ApplyMarkResponse(BaseModel):
    marked: bool = True


class ApplyResetResponse(BaseModel):
    reset_count: int = 0


class ApplyGenPromptResponse(BaseModel):
    prompt: str = ""
    command: str = ""
