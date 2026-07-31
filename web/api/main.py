"""ApplyPilot Web API — FastAPI application factory."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from applypilot.config import load_env, ensure_dirs
from applypilot.database import init_db

from web.api.deps import init_services
from web.api.routers import apply, config, doctor, files, jobs, match, pipeline, stats, ws

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB, env, and services on startup."""
    load_env()
    ensure_dirs()
    init_db()
    init_services()
    logger.info("ApplyPilot API started")
    yield
    logger.info("ApplyPilot API shutting down")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="ApplyPilot API",
        description="AI-powered job application pipeline — web control plane",
        version="0.3.0",
        lifespan=lifespan,
    )

    # CORS — restrict to local dev servers
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(stats.router)
    app.include_router(jobs.router)
    app.include_router(pipeline.router)
    app.include_router(apply.router)
    app.include_router(config.router)
    app.include_router(doctor.router)
    app.include_router(files.router)
    app.include_router(match.router)
    app.include_router(ws.router)

    @app.get("/api/health")
    async def health():
        return {"status": "ok", "service": "applypilot-api"}

    return app


app = create_app()
