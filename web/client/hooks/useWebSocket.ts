import { useCallback, useEffect, useEffectEvent, useRef } from "react";

const RECONNECT_DELAY = 1000;

interface WebSocketHandlers {
  onMessage: (ev: MessageEvent<string>) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export default function useWebSocket(path: string | null, { onMessage, onOpen, onClose }: WebSocketHandlers) {
  const wsRef = useRef<WebSocket | null>(null);
  const handleMessage = useEffectEvent(onMessage);
  const handleOpen = useEffectEvent(() => onOpen?.());
  const handleClose = useEffectEvent(() => onClose?.());
  
  useEffect(() => {
    if(!path) return;
    
    let closed = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    const connect = () => {
      const ws = wsRef.current = new WebSocket(`${location.protocol === 'https:' ? "wss:" : "ws:"}//${location.host}${path}`);
      ws.addEventListener("open", () => handleOpen());
      ws.addEventListener("message", ev => handleMessage(ev as MessageEvent<string>));
      ws.addEventListener("error", err => {
        if(!closed) console.error("Connection error: ", err);
      });
      ws.addEventListener("close", () => {
        if(wsRef.current === ws) wsRef.current = null;
        if(closed) return;
        handleClose();
        timeout = setTimeout(connect, RECONNECT_DELAY);
      });
    };
    connect();
    
    return () => {
      closed = true;
      if(timeout) clearTimeout(timeout);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [path]);
  
  return useCallback((msg: string) => {
    if(wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(msg);
  }, []);
}
