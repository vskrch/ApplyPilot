"""Dependencies for API routers."""

from __future__ import annotations

from web.api.services.apply_service import ApplyService
from web.api.services.event_bus import EventBus
from web.api.services.pipeline_service import PipelineService
from web.api.services.task_registry import TaskRegistry

# Module-level singletons (initialized in lifespan)
event_bus: EventBus | None = None
task_registry: TaskRegistry | None = None
pipeline_service: PipelineService | None = None
apply_service: ApplyService | None = None


def init_services() -> None:
    """Initialize service singletons."""
    global event_bus, task_registry, pipeline_service, apply_service

    event_bus = EventBus()
    task_registry = TaskRegistry()
    pipeline_service = PipelineService(event_bus, task_registry)
    apply_service = ApplyService(event_bus, task_registry)


def get_event_bus() -> EventBus:
    assert event_bus is not None
    return event_bus


def get_pipeline_service() -> PipelineService:
    assert pipeline_service is not None
    return pipeline_service


def get_apply_service() -> ApplyService:
    assert apply_service is not None
    return apply_service


def get_task_registry() -> TaskRegistry:
    assert task_registry is not None
    return task_registry
