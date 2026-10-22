import type http from "http";
import type { WebSocket } from "ws";

export type WebsocketHandler = (ws: WebSocket, req: http.IncomingMessage) => void;
