"""File serving API router."""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from applypilot.config import APP_DIR

router = APIRouter(prefix="/api/files", tags=["files"])

RESUME_DIR = APP_DIR / "tailored_resumes"
COVER_LETTER_DIR = APP_DIR / "cover_letters"
LOG_DIR = APP_DIR / "logs"


def _safe_resolve(base: Path, filename: str) -> Path:
    """Resolve a file path safely, preventing directory traversal."""
    resolved = (base / filename).resolve()
    if not str(resolved).startswith(str(base.resolve())):
        raise HTTPException(status_code=403, detail="Access denied")
    return resolved


def _mime_for(filename: str) -> str:
    """Get MIME type for known file types."""
    ext = os.path.splitext(filename)[1].lower()
    return {
        ".pdf": "application/pdf",
        ".txt": "text/plain",
        ".html": "text/html",
        ".json": "application/json",
        ".log": "text/plain",
    }.get(ext, "application/octet-stream")


@router.get("/resume/{filename}")
async def serve_resume(filename: str) -> FileResponse:
    """Serve a resume file (PDF or TXT)."""
    path = _safe_resolve(RESUME_DIR, filename)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type=_mime_for(filename))


@router.get("/cover-letter/{filename}")
async def serve_cover_letter(filename: str) -> FileResponse:
    """Serve a cover letter file."""
    path = _safe_resolve(COVER_LETTER_DIR, filename)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type=_mime_for(filename))


@router.get("/log/{filename}")
async def serve_log(filename: str) -> FileResponse:
    """Serve a log file."""
    path = _safe_resolve(LOG_DIR, filename)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="text/plain")
