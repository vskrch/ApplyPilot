"""Apply service — bridge between API and applypilot apply module."""

from __future__ import annotations

import asyncio
import logging
from typing import Any


from web.api.services.event_bus import EventBus
from web.api.services.task_registry import TaskRegistry

logger = logging.getLogger(__name__)


class ApplyService:
    """Service for managing the apply pipeline via the web UI."""

    def __init__(self, event_bus: EventBus, task_registry: TaskRegistry) -> None:
        self.event_bus = event_bus
        self.task_registry = task_registry
        self._apply_config: dict[str, Any] = {}

    async def start_apply(self, config: dict[str, Any]) -> str:
        """Start the apply pipeline as a background task."""
        task_id = self.task_registry.create_task("apply")
        self._apply_config = config
        task = asyncio.create_task(self._run_apply(task_id, config))
        self.task_registry.register(task_id, task)
        return task_id

    async def _run_apply(self, task_id: str, config: dict[str, Any]) -> None:
        """Run the apply pipeline in a thread and emit events via WS polling."""
        from applypilot.apply.dashboard import get_totals

        try:
            from applypilot.config import check_tier
            check_tier(3, "auto-apply")

            # Run apply in thread with ui=True to skip signal handlers and Rich Live
            apply_task = asyncio.to_thread(
                self._apply_main_wrapper,
                **config,
            )

            # Start a polling task that reads dashboard state and emits WS events
            poll_task = asyncio.create_task(self._poll_apply_status())

            # Wait for apply to finish
            await apply_task

            # Stop polling
            poll_task.cancel()
            try:
                await poll_task
            except asyncio.CancelledError:
                pass

            totals = get_totals()
            await self.event_bus.publish("apply", {
                "type": "apply_complete",
                "totals": totals,
            })
            self.task_registry.complete(task_id, result=totals)

        except asyncio.CancelledError:
            self.task_registry.complete(task_id, error="cancelled")
            raise
        except Exception as e:
            logger.exception("Apply task %s failed", task_id)
            self.task_registry.complete(task_id, error=str(e))

    def _apply_main_wrapper(self, **kwargs: Any) -> None:
        """Wrapper to run apply.main() with ui=True."""
        from applypilot.config import ensure_dirs, load_env
        from applypilot.database import init_db
        from applypilot.apply.launcher import main as apply_main

        load_env()
        ensure_dirs()
        init_db()

        apply_main(**kwargs)

    async def _poll_apply_status(self) -> None:
        """Poll dashboard module state and emit to WS."""
        from applypilot.apply.dashboard import get_totals

        while True:
            try:
                workers = []
                from applypilot.apply.dashboard import _lock as dash_lock
                import time as _time

                with dash_lock:
                    from applypilot.apply.dashboard import _worker_states as states
                    for wid in sorted(states.keys()):
                        s = states[wid]
                        elapsed = ""
                        if s.start_time and s.status == "applying":
                            elapsed = f"{int(_time.time() - s.start_time)}s"
                        workers.append({
                            "worker_id": s.worker_id,
                            "status": s.status,
                            "job_title": s.job_title,
                            "company": s.company,
                            "score": s.score,
                            "elapsed": elapsed,
                            "actions": s.actions,
                            "last_action": s.last_action,
                            "jobs_applied": s.jobs_applied,
                            "jobs_failed": s.jobs_failed,
                            "total_cost": s.total_cost,
                        })

                totals = get_totals()

                await self.event_bus.publish("apply", {
                    "type": "workers_update",
                    "workers": workers,
                    "totals": totals,
                })

            except Exception:
                logger.debug("Apply poll error", exc_info=True)

            await asyncio.sleep(1.0)

    async def stop_apply(self) -> bool:
        """Stop the active apply run."""
        task_id = self.task_registry.get_apply_status()
        if task_id:
            # Signal stop to the apply launcher
            try:
                from applypilot.apply.launcher import _stop_event, kill_all_chrome
                _stop_event.set()
                kill_all_chrome()
            except Exception:
                logger.exception("Error stopping apply")
            return self.task_registry.cancel(task_id)
        return False

    def get_status(self) -> dict[str, Any]:
        """Get current apply status including dashboard state."""
        task_id = self.task_registry.get_apply_status()
        running = task_id is not None

        try:
            from applypilot.apply.dashboard import _worker_states, _lock as dash_lock, _events as events
            import time as _time

            workers = []
            with dash_lock:
                for wid in sorted(_worker_states.keys()):
                    s = _worker_states[wid]
                    elapsed = ""
                    if s.start_time and s.status == "applying":
                        elapsed = f"{int(_time.time() - s.start_time)}s"
                    workers.append({
                        "worker_id": s.worker_id,
                        "status": s.status,
                        "job_title": s.job_title,
                        "company": s.company,
                        "score": s.score,
                        "elapsed": elapsed,
                        "actions": s.actions,
                        "last_action": s.last_action,
                        "jobs_applied": s.jobs_applied,
                        "jobs_failed": s.jobs_failed,
                        "total_cost": s.total_cost,
                    })

                event_list = [
                    {"message": e} for e in list(events)
                ]
        except Exception:
            workers = []
            event_list = []

        try:
            from applypilot.apply.dashboard import get_totals
            totals = get_totals()
        except Exception:
            totals = {"applied": 0, "failed": 0, "cost": 0.0}

        return {
            "running": running,
            "workers": workers,
            "totals": totals,
            "events": event_list,
        }


def mark_job_status(url: str, status: str, reason: str | None = None) -> bool:
    """Mark a job's apply status."""
    from applypilot.apply.launcher import mark_job
    mark_job(url, status, reason=reason)
    return True


def reset_failed_jobs() -> int:
    """Reset all failed jobs for retry."""
    from applypilot.apply.launcher import reset_failed
    return reset_failed()


def generate_prompt(url: str, model: str = "haiku") -> dict:
    """Generate an apply prompt for a specific URL."""
    from applypilot.apply.launcher import gen_prompt
    from applypilot.config import APP_DIR

    prompt_file = gen_prompt(url, model=model)
    if not prompt_file:
        return {"prompt": "", "command": ""}

    prompt_text = prompt_file.read_text(encoding="utf-8") if prompt_file.exists() else ""
    mcp_path = APP_DIR / ".mcp-apply-0.json"
    command = (
        f"claude --model {model} -p "
        f"--mcp-config {mcp_path} "
        f"--permission-mode bypassPermissions < {prompt_file}"
    )

    return {"prompt": prompt_text, "command": command}
