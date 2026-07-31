"""Background task tracking and management."""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Any
from uuid import uuid4

logger = logging.getLogger(__name__)


@dataclass
class TaskInfo:
    """Tracks a background task."""
    task_id: str
    task: asyncio.Task[Any] | None = None
    status: str = "pending"
    started_at: float = field(default_factory=time.time)
    completed_at: float | None = None
    result: Any = None
    error: str | None = None


class TaskRegistry:
    """Registry for tracking background pipeline and apply tasks."""

    def __init__(self) -> None:
        self._tasks: dict[str, TaskInfo] = {}
        self._active_pipeline: str | None = None
        self._active_apply: str | None = None

    def create_task(self, kind: str = "pipeline") -> str:
        """Create a new tracked task and return its ID."""
        task_id = str(uuid4())
        self._tasks[task_id] = TaskInfo(task_id=task_id)

        if kind == "pipeline":
            self._active_pipeline = task_id
        elif kind == "apply":
            self._active_apply = task_id

        return task_id

    def register(self, task_id: str, async_task: asyncio.Task[Any]) -> None:
        """Register an asyncio task with a previously created task_id."""
        if task_id in self._tasks:
            self._tasks[task_id].task = async_task
            self._tasks[task_id].status = "running"

    def complete(self, task_id: str, result: Any = None, error: str | None = None) -> None:
        """Mark a task as completed."""
        if task_id in self._tasks:
            info = self._tasks[task_id]
            info.status = "error" if error else "completed"
            info.completed_at = time.time()
            info.result = result
            info.error = error

        if self._active_pipeline == task_id:
            self._active_pipeline = None
        if self._active_apply == task_id:
            self._active_apply = None

    def cancel(self, task_id: str) -> bool:
        """Cancel a running task."""
        info = self._tasks.get(task_id)
        if info and info.task and not info.task.done():
            info.task.cancel()
            info.status = "cancelled"
            if self._active_pipeline == task_id:
                self._active_pipeline = None
            if self._active_apply == task_id:
                self._active_apply = None
            return True
        return False

    def get_pipeline_status(self) -> dict[str, Any]:
        """Get current pipeline status."""
        if not self._active_pipeline:
            return {"running": False, "task_id": None}

        info = self._tasks.get(self._active_pipeline)
        if not info:
            return {"running": False, "task_id": None}

        elapsed = time.time() - info.started_at
        return {
            "running": info.status == "running",
            "task_id": info.task_id,
            "elapsed": elapsed,
        }

    def get_apply_status(self) -> str | None:
        """Get active apply task_id or None."""
        return self._active_apply

    def is_pipeline_running(self) -> bool:
        return self._active_pipeline is not None

    def is_apply_running(self) -> bool:
        return self._active_apply is not None

    def cleanup(self) -> None:
        """Remove completed tasks older than 1 hour."""
        cutoff = time.time() - 3600
        to_remove = [
            tid for tid, info in self._tasks.items()
            if info.completed_at and info.completed_at < cutoff
        ]
        for tid in to_remove:
            del self._tasks[tid]


# Module-level singleton
task_registry = TaskRegistry()
