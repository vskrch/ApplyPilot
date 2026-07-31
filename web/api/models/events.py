"""Pydantic models for WebSocket events."""

from __future__ import annotations

from pydantic import BaseModel


class StageStartEvent(BaseModel):
    type: str = "stage_start"
    stage: str
    timestamp: str


class StageProgressEvent(BaseModel):
    type: str = "stage_progress"
    stage: str
    processed: int = 0
    total: int = 0
    rate: float = 0.0


class StageCompleteEvent(BaseModel):
    type: str = "stage_complete"
    stage: str
    status: str
    elapsed: float = 0.0


class JobScoredEvent(BaseModel):
    type: str = "job_scored"
    url: str
    title: str = ""
    score: int = 0


class PipelineCompleteEvent(BaseModel):
    type: str = "pipeline_complete"
    result: dict = {}


class PipelineErrorEvent(BaseModel):
    type: str = "pipeline_error"
    stage: str
    error: str


class StatsUpdateEvent(BaseModel):
    type: str = "stats_update"
    stats: dict = {}


class WorkerUpdateEvent(BaseModel):
    type: str = "workers_update"
    workers: list[dict] = []
    totals: dict = {}


class ApplyEventMessage(BaseModel):
    type: str = "event"
    timestamp: str = ""
    message: str = ""


class LogLineEvent(BaseModel):
    type: str = "log_line"
    source: str
    line: str
