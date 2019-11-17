import path from 'path';
import PromiseRouter from "express-promise-router";
import stripAnsi from "strip-ansi";
import fs from 'fs-extra';
import AnsiToHtml from 'ansi-to-html';
import { logs, logsEmitter } from "../core/logger";
import { rootDir } from "../index";
import HTTPError from "./server/helpers/HTTPError";
import { validateReq } from "./server/helpers/requireLogin";

const ansiToHtml = new AnsiToHtml({ newline: true });

const PAGE_SIZE = 50;
const LOG_DIR = path.resolve(rootDir, "logs");

export default function webRouter(webModule) {
  const router = PromiseRouter();
  
  const logsFiles = (async () => {
    if(!await fs.pathExists(LOG_DIR)) return [];
    const dir = await fs.readdir(LOG_DIR);
    
    return await Promise.all(dir.filter(file => !file.startsWith("."))
                                .map(async file => ({
                                  filename: file,
                                  path: path.resolve(LOG_DIR, file),
                                  created: (await fs.stat(path.resolve(LOG_DIR, file))).birthtime,
                                  lines: null,
                                })));
  })().catch(err => webModule.constructor.error(err));
  
  router.get("/logs", async (req, res) => {
    let { format, start, end, file } = req.query;
    
    let lines;
    
    if(file === undefined) {
      lines = logs;
    } else {
      const logFile = (await logsFiles).find(f => f.filename === file);
      if(logFile === null) throw new HTTPError(400, `File ${file} not found.`);
      if(logFile.lines === null) logFile.lines = (await fs.readFile(logFile.path)).toString().split("\n");
      
      lines = logFile.lines;
    }
    
    const totalSize = lines.length;
    
    if(end === undefined) end = totalSize;
    else end = parseInt(end);
    if(start === undefined) start = Math.max(end - PAGE_SIZE, 0);
    else start = parseInt(start);
    if(isNaN(start) || isNaN(end)) throw new HTTPError(400, `Invalid start or end. (${start} to ${end}`);
    
    if(end > start + PAGE_SIZE) end = Math.min(start + PAGE_SIZE, totalSize);
    if(start < 0 || end > lines.length || end < start) throw new HTTPError(400, `Invalid start or end. (${start} to ${end}, limit ${totalSize})`);
    
    lines = lines.slice(start, end);
    
    switch(format) {
      case undefined:
      case "plain":
        lines = lines.map(line => stripAnsi(line));
        break;
      case "html":
        lines = lines.map(line => ansiToHtml.toHtml(line));
        break;
      case "ansi":
        break;
      default:
        throw new HTTPError(400, "Unknown format.");
    }
    
    res.json({
      start,
      end,
      totalSize,
      pageSize: PAGE_SIZE,
      logs: lines,
    });
  });
  
  router.ws("/logs", (ws, req) => {
    if(!validateReq(req)) {
      ws.close();
      return;
    }
    const { format } = req.query;
    
    const sendLog = (text, id) => {
      switch(format) {
        case undefined:
        case "plain":
          text = stripAnsi(text);
          break;
        case "html":
          text = ansiToHtml.toHtml(text);
          break;
        case "ansi":
          break;
        default:
          throw ws.close("Unknown format.");
      }
      
      ws.send(JSON.stringify({ text, id }));
    };
    
    logsEmitter.on("log", sendLog);
    ws.on('close', () => logsEmitter.off("log", sendLog));
  });
  
  router.get("/logsFiles", async (req, res) => {
    res.json((await logsFiles).map(file => ({
      filename: file.filename,
      created: file.created.getTime(),
    })));
  });
  
  router.get("/deleteLogs", async (req, res) => {
    await Promise.all((await logsFiles).map(file => fs.unlink(file.path)));
    
    res.json({});
  });
  
  return router;
}
