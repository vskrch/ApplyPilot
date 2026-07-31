"""Match service — runs the match pipeline in a thread, tracks the task."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from web.api.services.event_bus import EventBus
from web.api.services.task_registry import TaskRegistry

logger = logging.getLogger(__name__)


class MatchService:
    def __init__(self, event_bus: EventBus, task_registry: TaskRegistry) -> None:
        self.event_bus = event_bus
        self.task_registry = task_registry
        self._last_result: dict[str, Any] = {}

    async def start_match(self, role: str, location: str, username: str) -> str:
        task_id = self.task_registry.create_task("match")
        task = asyncio.create_task(self._run_match(task_id, role, location, username))
        self.task_registry.register(task_id, task)
        return task_id

    async def _run_match(self, task_id: str, role: str, location: str, username: str) -> None:
        from applypilot.match.pipeline import run_match

        await self.event_bus.publish("match", {"type": "match_start", "task_id": task_id})
        try:
            result = await asyncio.to_thread(run_match, role, location, username)
            self._last_result = result
            await self.event_bus.publish("match", {
                "type": "match_complete",
                "task_id": task_id,
                "count": result["count"],
                "path": result["path"],
            })
            self.task_registry.complete(task_id, result=result)
        except asyncio.CancelledError:
            self.task_registry.complete(task_id, error="cancelled")
            raise
        except Exception as e:
            logger.exception("Match task %s failed", task_id)
            await self.event_bus.publish("match", {"type": "match_error", "task_id": task_id, "error": str(e)})
            self.task_registry.complete(task_id, error=str(e))

    def get_last_result(self) -> dict[str, Any]:
        return self._last_result