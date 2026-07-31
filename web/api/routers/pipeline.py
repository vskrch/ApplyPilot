"""Pipeline API router."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from web.api.deps import get_pipeline_service, get_task_registry
from web.api.models.pipeline import (
    PipelineCancelResponse,
    PipelineConfig,
    PipelineRunResponse,
    PipelineStatus,
)

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])


@router.post("/run", response_model=PipelineRunResponse, status_code=202)
async def run_pipeline(config: PipelineConfig) -> PipelineRunResponse:
    """Start a pipeline run."""
    svc = get_pipeline_service()
    registry = get_task_registry()

    if registry.is_pipeline_running():
        raise HTTPException(status_code=409, detail="Pipeline is already running")

    task_id = await svc.start_pipeline(config)
    return PipelineRunResponse(task_id=task_id)


@router.get("/status", response_model=PipelineStatus)
async def pipeline_status() -> PipelineStatus:
    """Get current pipeline status."""
    svc = get_pipeline_service()
    status = svc.get_status()
    return PipelineStatus(**status)


@router.post("/cancel", response_model=PipelineCancelResponse)
async def cancel_pipeline() -> PipelineCancelResponse:
    """Cancel the running pipeline."""
    svc = get_pipeline_service()
    cancelled = await svc.cancel_pipeline()
    return PipelineCancelResponse(cancelled=cancelled)
