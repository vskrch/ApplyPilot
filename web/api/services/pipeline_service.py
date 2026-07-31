"""Pipeline service — bridge between API and applypilot pipeline module."""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from applypilot.database import get_stats

from web.api.models.pipeline import PipelineConfig
from web.api.services.event_bus import EventBus
from web.api.services.task_registry import TaskRegistry

logger = logging.getLogger(__name__)


class PipelineService:
    """Service layer for running and monitoring the pipeline."""

    def __init__(self, event_bus: EventBus, task_registry: TaskRegistry) -> None:
        self.event_bus = event_bus
        self.task_registry = task_registry
        self._stage_progress: dict[str, dict[str, Any]] = {}

    async def start_pipeline(self, config: PipelineConfig) -> str:
        """Start a pipeline run as a background task. Returns task_id."""
        task_id = self.task_registry.create_task("pipeline")
        task = asyncio.create_task(self._run_pipeline(task_id, config))
        self.task_registry.register(task_id, task)
        return task_id

    async def _run_pipeline(self, task_id: str, config: PipelineConfig) -> None:
        """Run the pipeline in a thread pool and emit events."""
        from applypilot.pipeline import run_pipeline

        try:
            for stage in config.stages:
                if stage != "all":
                    await self.event_bus.publish("pipeline", {
                        "type": "stage_start",
                        "stage": stage,
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    })

            # Run pipeline in a thread
            result = await asyncio.to_thread(
                run_pipeline,
                stages=config.stages if config.stages else ["all"],
                min_score=config.min_score,
                dry_run=config.dry_run,
                stream=config.stream,
                workers=config.workers,
                validation_mode=config.validation,
            )

            # Emit stage completion events from results
            if isinstance(result, dict):
                for stage_result in result.get("stages", []):
                    await self.event_bus.publish("pipeline", {
                        "type": "stage_complete",
                        "stage": stage_result.get("stage", ""),
                        "status": stage_result.get("status", "unknown"),
                        "elapsed": stage_result.get("elapsed", 0),
                    })

            post_stats = get_stats()

            await self.event_bus.publish("pipeline", {
                "type": "pipeline_complete",
                "task_id": task_id,
                "result": result if isinstance(result, dict) else {},
            })

            await self.event_bus.publish("pipeline", {
                "type": "stats_update",
                "stats": post_stats,
            })

            self.task_registry.complete(task_id, result=result)

        except asyncio.CancelledError:
            self.task_registry.complete(task_id, error="cancelled")
            raise
        except Exception as e:
            logger.exception("Pipeline task %s failed", task_id)
            await self.event_bus.publish("pipeline", {
                "type": "pipeline_error",
                "stage": "pipeline",
                "error": str(e),
            })
            self.task_registry.complete(task_id, error=str(e))

    async def cancel_pipeline(self) -> bool:
        """Cancel the active pipeline run."""
        task_id = self.task_registry.get_pipeline_status().get("task_id")
        if task_id:
            return self.task_registry.cancel(task_id)
        return False

    def get_status(self) -> dict[str, Any]:
        """Get current pipeline status."""
        return self.task_registry.get_pipeline_status()
