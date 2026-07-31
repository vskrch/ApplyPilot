"""Doctor API router."""

from __future__ import annotations

from fastapi import APIRouter

from web.api.models.config import DoctorResponse
from web.api.services.config_service import get_doctor_results

router = APIRouter(prefix="/api/doctor", tags=["doctor"])


@router.get("", response_model=DoctorResponse)
async def doctor() -> DoctorResponse:
    """Run all health checks and return results."""
    result = get_doctor_results()
    return DoctorResponse(
        tier=result["tier"],
        tier_label=result["tier_label"],
        checks=result["checks"],
    )
