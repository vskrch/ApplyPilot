"""Apply API router."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from web.api.deps import get_apply_service, get_task_registry
from web.api.models.apply import (
    ApplyConfig,
    ApplyGenPromptResponse,
    ApplyMarkRequest,
    ApplyMarkResponse,
    ApplyResetResponse,
    ApplyStartResponse,
    ApplyStatus,
    ApplyStopResponse,
)
from web.api.services.apply_service import mark_job_status, reset_failed_jobs, generate_prompt

router = APIRouter(prefix="/api/apply", tags=["apply"])


@router.post("/start", response_model=ApplyStartResponse, status_code=202)
async def start_apply(config: ApplyConfig) -> ApplyStartResponse:
    """Start the apply pipeline."""
    registry = get_task_registry()
    if registry.is_apply_running():
        raise HTTPException(status_code=409, detail="Apply is already running")

    svc = get_apply_service()
    task_id = await svc.start_apply(config.model_dump())
    return ApplyStartResponse(task_id=task_id)


@router.post("/stop", response_model=ApplyStopResponse)
async def stop_apply() -> ApplyStopResponse:
    """Stop the running apply pipeline."""
    svc = get_apply_service()
    stopped = await svc.stop_apply()
    return ApplyStopResponse(stopped=stopped)


@router.get("/status", response_model=ApplyStatus)
async def apply_status() -> ApplyStatus:
    """Get current apply status."""
    svc = get_apply_service()
    status = svc.get_status()
    return ApplyStatus(
        running=status["running"],
        workers=status["workers"],
        totals=status["totals"],
    )


@router.post("/mark", response_model=ApplyMarkResponse)
async def mark_job(body: ApplyMarkRequest) -> ApplyMarkResponse:
    """Mark a job as applied or failed."""
    if body.status not in ("applied", "failed"):
        raise HTTPException(status_code=400, detail="Status must be 'applied' or 'failed'")
    mark_job_status(body.url, body.status, body.reason)
    return ApplyMarkResponse()


@router.post("/reset-failed", response_model=ApplyResetResponse)
async def reset_failed() -> ApplyResetResponse:
    """Reset all failed jobs for retry."""
    count = reset_failed_jobs()
    return ApplyResetResponse(reset_count=count)


@router.post("/gen-prompt", response_model=ApplyGenPromptResponse)
async def gen_prompt(url: str, model: str = "haiku") -> ApplyGenPromptResponse:
    """Generate an apply prompt for a specific job URL."""
    result = generate_prompt(url, model=model)
    if not result["prompt"]:
        raise HTTPException(status_code=404, detail="Job not found or no tailored resume")
    return ApplyGenPromptResponse(**result)
