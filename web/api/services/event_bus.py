"""Central event bus for broadcasting to WebSocket clients."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

logger = logging.getLogger(__name__)


class EventBus:
    """Central event bus for broadcasting to WebSocket clients."""

    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue[dict[str, Any]]]] = {
            "pipeline": set(),
            "apply": set(),
            "logs": set(),
        }
        self._lock = asyncio.Lock()

    async def subscribe(self, channel: str) -> asyncio.Queue[dict[str, Any]]:
        """Subscribe to a channel, returning an event queue."""
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=200)
        async with self._lock:
            if channel not in self._subscribers:
                self._subscribers[channel] = set()
            self._subscribers[channel].add(queue)
        logger.info("New subscriber to %s channel (%d total)", channel, len(self._subscribers[channel]))
        return queue

    async def unsubscribe(self, channel: str, queue: asyncio.Queue[dict[str, Any]]) -> None:
        """Remove a subscriber."""
        async with self._lock:
            self._subscribers.get(channel, set()).discard(queue)

    async def publish(self, channel: str, event: dict[str, Any]) -> None:
        """Publish an event to all subscribers of a channel."""
        async with self._lock:
            subscribers = set(self._subscribers.get(channel, set()))

        dead: list[asyncio.Queue[dict[str, Any]]] = []
        for queue in subscribers:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                dead.append(queue)
                logger.warning("Dropping subscriber on %s: queue full", channel)

        if dead:
            async with self._lock:
                for q in dead:
                    self._subscribers.get(channel, set()).discard(q)

    def subscriber_count(self, channel: str) -> int:
        """Get the number of active subscribers on a channel."""
        return len(self._subscribers.get(channel, set()))


# Module-level singleton
event_bus = EventBus()
