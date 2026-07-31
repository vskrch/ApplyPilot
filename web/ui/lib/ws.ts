import { useEffect, useRef, useCallback } from "react";

type WSEvent = Record<string, unknown>;

function getWsUrl(path: string): string {
  if (typeof window === "undefined") return "";
  if (process.env.NEXT_PUBLIC_WS_URL) return `${process.env.NEXT_PUBLIC_WS_URL}${path}`;

  const isHttps = window.location.protocol === "https:";
  const protocol = isHttps ? "wss:" : "ws:";
  const hostname = window.location.hostname;
  const port = window.location.port === "3000" ? "8000" : window.location.port;

  return `${protocol}//${hostname}${port ? `:${port}` : ""}${path}`;
}

export function useWebSocket(url: string, onEvent: (event: WSEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    try {
      const wsUrl = getWsUrl(url);
      if (!wsUrl) return;

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
