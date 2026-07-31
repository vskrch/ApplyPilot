"""Config API router."""

from __future__ import annotations

from fastapi import APIRouter, Form
from typing import Optional

from web.api.models.config import (
    ConfigSaveResponse,
    EnvConfig,
    EnvUpdate,
    EnvUpdateResponse,
    ResumeResponse,
)
from web.api.services import config_service

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("/profile")
async def get_profile() -> dict:
    """Get user profile."""
    return config_service.get_profile()


@router.put("/profile")
async def save_profile(data: dict) -> ConfigSaveResponse:
    """Save user profile."""
    config_service.save_profile(data)
    return ConfigSaveResponse()


@router.get("/searches")
async def get_searches() -> dict:
    """Get search configuration."""
    return config_service.get_searches()


@router.put("/searches")
async def save_searches(data: dict) -> ConfigSaveResponse:
    """Save search configuration."""
    config_service.save_searches(data)
    return ConfigSaveResponse()


@router.get("/env", response_model=EnvConfig)
async def get_env() -> EnvConfig:
    """Get environment configuration status (no raw keys exposed)."""
    return EnvConfig(**config_service.get_env_config())


@router.put("/env", response_model=EnvUpdateResponse)
async def save_env(data: EnvUpdate) -> EnvUpdateResponse:
    """Update environment configuration."""
    result = config_service.save_env_config(
        {k: v for k, v in data.model_dump().items() if v is not None}
    )
    return EnvUpdateResponse(saved=result["saved"], tier=result["tier"])


@router.get("/resume", response_model=ResumeResponse)
async def get_resume() -> ResumeResponse:
    """Get resume content."""
    data = config_service.get_resume_content()
    return ResumeResponse(text=data["text"], has_pdf=data["has_pdf"])


@router.put("/resume")
async def save_resume(
    txt_content: Optional[str] = Form(None),
) -> ConfigSaveResponse:
    """Save resume content."""
    return config_service.save_resume(txt_content)


@router.get("/employers")
async def get_employers() -> dict:
    """Get employers configuration."""
    return config_service.get_employers_config()


@router.get("/sites")
async def get_sites() -> dict:
    """Get sites configuration."""
    return config_service.get_sites_config()
