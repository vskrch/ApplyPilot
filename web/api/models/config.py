"""Pydantic models for config-related API requests and responses."""

from __future__ import annotations

from pydantic import BaseModel


class EnvConfig(BaseModel):
    gemini_key_set: bool = False
    openai_key_set: bool = False
    llm_url: str | None = None
    llm_model: str | None = None
    capsolver_key_set: bool = False


class EnvUpdate(BaseModel):
    gemini_api_key: str | None = None
    openai_api_key: str | None = None
    llm_url: str | None = None
    llm_model: str | None = None
    capsolver_api_key: str | None = None


class EnvUpdateResponse(BaseModel):
    saved: bool = True
    tier: int = 1


class DoctorCheck(BaseModel):
    name: str
    status: str = "ok"
    note: str = ""


class DoctorResponse(BaseModel):
    tier: int = 1
    tier_label: str = "Discovery"
    checks: list[DoctorCheck] = []


class ResumeResponse(BaseModel):
    text: str = ""
    has_pdf: bool = False


class ConfigSaveResponse(BaseModel):
    saved: bool = True
