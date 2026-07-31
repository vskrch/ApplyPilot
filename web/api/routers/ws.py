"""WebSocket API router."""

from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from web.api.deps import get_event_bus

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])


@router.websocket("/ws/pipeline")
async def ws_pipeline(websocket: WebSocket) -> None:
    """WebSocket endpoint for pipeline events."""
    await websocket.accept()
    event_bus = get_event_bus()
    queue = await event_bus.subscribe("pipeline")

    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30)
                await websocket.send_json(event)
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.debug("Pipeline WS disconnected", exc_info=True)
    finally:
        await event_bus.unsubscribe("pipeline", queue)


@router.websocket("/ws/apply")
async def ws_apply(websocket: WebSocket) -> None:
    """WebSocket endpoint for apply events."""
    await websocket.accept()
    event_bus = get_event_bus()
    queue = await event_bus.subscribe("apply")

    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30)
                await websocket.send_json(event)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.debug("Apply WS disconnected", exc_info=True)
    finally:
        await event_bus.unsubscribe("apply", queue)


@router.websocket("/ws/logs")
async def ws_logs(websocket: WebSocket) -> None:
    """WebSocket endpoint for log streaming."""
    await websocket.accept()
    event_bus = get_event_bus()
    queue = await event_bus.subscribe("logs")

    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30)
                await websocket.send_json(event)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.debug("Logs WS disconnected", exc_info=True)
    finally:
        await event_bus.unsubscribe("logs", queue)
