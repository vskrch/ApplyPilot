"""Pydantic models for pipeline-related API requests and responses."""

from __future__ import annotations

from pydantic import BaseModel, Field


class PipelineConfig(BaseModel):
    stages: list[str] = Field(default=["all"])
    min_score: int = 7
    workers: int = 1
    stream: bool = False
    validation: str = "normal"
    dry_run: bool = False


class StageResult(BaseModel):
    stage: str
    status: str
    elapsed: float = 0.0


class PipelineStatus(BaseModel):
    running: bool = False
    task_id: str | None = None
    current_stage: str | None = None
    stages_completed: list[str] = []
    elapsed: float = 0.0


class PipelineHistory(BaseModel):
    task_id: str
    started_at: str
    stages: list[str]
    result: dict | None = None
    elapsed: float = 0.0


class PipelineRunResponse(BaseModel):
    task_id: str
    status: str = "started"


class PipelineCancelResponse(BaseModel):
    cancelled: bool = True
