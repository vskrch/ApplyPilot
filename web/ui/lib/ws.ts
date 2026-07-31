import { useEffect, useRef, useCallback } from "react";

type WSEvent = Record<string, unknown>;

export function useWebSocket(url: string, onEvent: (event: WSEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}${url}`;
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type !== "ping") {
            onEventRef.current(data);
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      reconnectTimer.current = setTimeout(connect, 3000);
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}
