import http from 'http';
import type { Duplex } from "stream";
import { PassThrough } from 'stream';
import * as readline from 'readline';
import express from "express";
import expressCore from "express-serve-static-core";
import bodyParser from "body-parser";
import cookieParser from 'cookie-parser';
import compression from "compression";
import morgan from 'morgan';
import chalk from "chalk";
import stripAnsi from "strip-ansi";
import { WebSocketServer } from "ws";
import JanuszModule from "../core/JanuszModule";
import { janusz } from "../core/janusz";
import { ErrorResponse } from "../types/api";
import reactMiddleware from "./server/middlewares/reactMiddleware";
import HTTPError from "./server/helpers/HTTPError";
import requireLogin, { validateReq } from "./server/helpers/auth";
import { router as pagesRouter } from "./server/pages";
import webRouter, { logsWebsocket } from "./router";
import type { WebsocketHandler } from "./websockets";

export default class WebModule extends JanuszModule {
  static moduleName = chalk.cyan.bold("Web");
  server: http.Server | null = null;
  wss: WebSocketServer | null = null;
  modulesRouter = express.Router();
  websockets = new Map<string, WebsocketHandler>();
  
  constructor(reloadedModule?: WebModule) {
    super();
    if(reloadedModule) {
      this.server = reloadedModule.server;
      reloadedModule.server = null;
      this.wss = reloadedModule.wss;
      reloadedModule.wss = null;
    }
  }
  
  async init() {
    if(!this.server) {
      this.server = http.createServer();
    } else {
      this.server.removeAllListeners('request');
      this.server.removeAllListeners('upgrade');
    }
    
    if(!this.wss) {
      this.wss = new WebSocketServer({ noServer: true });
    } else {
      this.wss.clients.forEach(client => client.close(1012, "Reloading"));
    }
    
    const app = express();
    
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(cookieParser());
    app.use(compression());
    app.use('/static', express.static('static'));
    if(process.env.NODE_ENV === 'development') {
      const stream = new PassThrough();
      readline.createInterface({ input: stream }).on('line', line => WebModule.log(line));
      
      app.use(morgan('dev', { stream }));
      app.use(require('./server/middlewares/webpackMiddleware').mount((...args: unknown[]) => WebModule.log(...args)));
    } else {
      app.use('/client.js', express.static('client.js'));
      app.use('/style.css', express.static('style.css'));
    }
    
    app.use(reactMiddleware);
    
    this.regenerateModulesRouter();
    app.use((req, res, next) => this.modulesRouter(req, res, next));
    app.use('/', pagesRouter);
    
    app.use((req, res, next) => {
      next(new HTTPError(404, "Route not found"));
    });
    
    app.use((err: Partial<HTTPError>, req: expressCore.RequestEx<any, any, any>, res: expressCore.ResponseEx<ErrorResponse>, _next: expressCore.NextFunction) => {
      if(err.message !== "Route not found") WebModule.error(err);
      
      const knownError = err instanceof HTTPError;
      const headers = knownError && err.headers || {};
      const status = knownError && err.status || 500;
      const error: ErrorResponse = {
        status,
        message: knownError && err.message || http.STATUS_CODES[status] || "Something Happened",
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      };
      
      if("react" in (res as any)) res.set(headers).status(status).react({}, error);
      else res.set(headers).status(status).json(error);
    });
    
    this.server.on('request', app);
    this.server.on('upgrade', this.onUpgrade);
  }
  
  async start() {
    if(this.server && !this.server.listening) {
      const config = janusz.getConfig("web");
      
      let port = config.port || 3939;
      if(process.env.PORT) port = parseInt(process.env.PORT) || port;
      
      let host = config.host || "0.0.0.0";
      if(process.env.HOST) host = process.env.HOST;
      
      this.server.listen({ port, host });
      WebModule.log(`Listening on ${chalk.yellow.bold(`http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`)}`);
    }
  }
  
  async stop() {
    if(this.wss) {
      this.wss.clients.forEach(client => client.terminate());
      this.wss.close();
    }
    if(this.server) {
      this.server.closeAllConnections();
      await new Promise(res => this.server?.close(res));
    }
  }
  
  async onReloadOther() {
    this.regenerateModulesRouter();
  }
  
  getRouter() {
    return webRouter();
  }
  
  getWebsockets() {
    return {
      "/logs": logsWebsocket,
    };
  }
  
  onUpgrade = (req: http.IncomingMessage, socket: Duplex, head: Buffer) => {
    const { pathname } = new URL(req.url || "/", "http://localhost");
    const handler = this.websockets.get(pathname);
    
    if(!handler || !this.wss) {
      socket.end("HTTP/1.1 404 Not Found\r\n\r\n");
      return;
    }
    
    if(!validateReq(req)) {
      socket.end("HTTP/1.1 401 Unauthorized\r\n\r\n");
      return;
    }
    
    this.wss.handleUpgrade(req, socket, head, ws => handler(ws, req));
  };
  
  regenerateModulesRouter() {
    const router = express.Router();
    this.websockets.clear();
    
    for(const mod of janusz.modules) {
      const prefix = "/" + stripAnsi(mod.moduleClass.moduleName).toLowerCase();
      
      const modRouter = mod.getRouter?.();
      if(modRouter) router.use(prefix, requireLogin, modRouter);
      
      for(const [path, handler] of Object.entries(mod.getWebsockets?.() ?? {})) {
        this.websockets.set(path === "/" ? prefix : prefix + path, handler);
      }
    }
    
    this.modulesRouter = router;
    WebModule.log("Regenerating routes");
  }
}
