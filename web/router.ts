import fs from 'fs';
import path from 'path';
import express from "express";
import stripAnsi from "strip-ansi";
import AnsiToHtml from 'ansi-to-html';
import { logs, logsEmitter } from "../core/logger";
import { LogsFile, LogsFormat, LogsMessage, LogsRequest, LogsResponse } from "../types/api";
import HTTPError from "./server/helpers/HTTPError";
import type { WebsocketHandler } from "./websockets";

const ansiToHtml = new AnsiToHtml({ newline: true });

const PAGE_SIZE = 50;
const LOG_DIR = path.resolve("logs");

const fileLinesCache = new Map<string, string[]>();

async function getLogsFiles() {
  let dir: string[];
  try {
    dir = await fs.promises.readdir(LOG_DIR);
  } catch(e: any) {
    if(e.code === "ENOENT") return [];
    throw e;
  }
  
  return await Promise.all(dir.filter(file => !file.startsWith("."))
                              .map(async file => ({
                                filename: file,
                                path: path.resolve(LOG_DIR, file),
                                created: (await fs.promises.stat(path.resolve(LOG_DIR, file))).birthtime,
                              })));
}

function formatLine(line: string, format: LogsFormat | undefined) {
  switch(format) {
    case undefined:
    case "plain":
      return stripAnsi(line);
    case "html":
      return ansiToHtml.toHtml(line);
    case "ansi":
      return line;
    default:
      throw new HTTPError(400, "Unknown format.");
  }
}

export const logsWebsocket: WebsocketHandler = (ws, req) => {
  const format = new URL(req.url || "/", "http://localhost").searchParams.get("format") as LogsFormat | null || undefined;
  
  const sendLog = (line: string, id: number) => {
    let text;
    try {
      text = formatLine(line, format);
    } catch(e) {
      void e;
      ws.close(1003, "Unknown format.");
      return;
    }
    
    ws.send(JSON.stringify({ text, id } satisfies LogsMessage));
  };
  
  logsEmitter.on("log", sendLog);
  ws.on('close', () => logsEmitter.off("log", sendLog));
};

export default function webRouter() {
  const router = express.Router();
  
  router.get<never, LogsResponse>("/logs", async (req, res) => {
    const { format, start: startQuery, end: endQuery, file } = req.query as Record<keyof LogsRequest, string | undefined>;
    
    let lines;
    
    if(file === undefined) {
      lines = logs;
    } else {
      const logFile = (await getLogsFiles()).find(f => f.filename === file);
      if(!logFile) throw new HTTPError(400, `File ${file} not found.`);
      
      lines = fileLinesCache.get(logFile.path);
      if(!lines) {
        lines = (await fs.promises.readFile(logFile.path)).toString().split("\n");
        fileLinesCache.set(logFile.path, lines);
      }
    }
    
    const totalSize = lines.length;
    
    let end = endQuery === undefined ? totalSize : parseInt(endQuery);
    const start = startQuery === undefined ? Math.max(end - PAGE_SIZE, 0) : parseInt(startQuery);
    if(isNaN(start) || isNaN(end)) throw new HTTPError(400, `Invalid start or end. (${start} to ${end}`);
    
    if(end > start + PAGE_SIZE) end = Math.min(start + PAGE_SIZE, totalSize);
    if(start < 0 || end > lines.length || end < start) throw new HTTPError(400, `Invalid start or end. (${start} to ${end}, limit ${totalSize})`);
    
    res.json({
      start,
      end,
      totalSize,
      pageSize: PAGE_SIZE,
      logs: lines.slice(start, end).map(line => formatLine(line, format as LogsFormat | undefined)),
    });
  });
  
  router.get<never, LogsFile[]>("/logsFiles", async (req, res) => {
    res.json((await getLogsFiles()).map(file => ({
      filename: file.filename,
      created: file.created.getTime(),
    })));
  });
  
  router.post<never, Empty>("/deleteLogs", async (req, res) => {
    await Promise.all((await getLogsFiles()).map(file => fs.promises.unlink(file.path)));
    fileLinesCache.clear();
    
    res.json({});
  });
  
  return router;
}
