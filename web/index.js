import http from 'http';
import { PassThrough } from 'stream';
import * as readline from 'readline';
import path from "path";
import bodyParser from "body-parser";
import cookieParser from 'cookie-parser';
import express from "express";
import ExpressWS from 'express-ws';
import morgan from 'morgan';
import chalk from "chalk";
import stripAnsi from "strip-ansi";
import JanuszModule from "../core/JanuszModule";
import { janusz } from "../index";
import { reactMiddleware } from "./server/helpers/reactHelper";
import HTTPError from "./server/helpers/HTTPError";
import { coreRouter } from "./server/routes";
import requireLogin from "./server/helpers/requireLogin";
import webRouter from "./router";

const STATIC_DIR = path.join(__dirname, "static");

export default class WebModule extends JanuszModule {
  static ModuleName = chalk.cyan.bold("Web");
  
  constructor(reloadedModule) {
    super();
    if(reloadedModule) {
      this.server = reloadedModule.server;
      reloadedModule.server = null;
      this.ews = reloadedModule.ews;
      reloadedModule.ews = null;
    }
  }
  
  async init() {
    const app = this.app = express();
    if(!this.server) {
      this.server = http.createServer();
      this.ews = ExpressWS(app, this.server);
    } else {
      this.ews.getWss().close();
      this.server.removeAllListeners('request');
      this.ews = ExpressWS(app, this.server);
    }
    
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(cookieParser());
    app.use('/static', express.static(STATIC_DIR));
    if(process.env.NODE_ENV === 'development') {
      const stream = new PassThrough();
      readline.createInterface({ input: stream }).on('line', line => WebModule.log(line));
      
      app.use(morgan('dev', { stream }));
      app.use(require('./server/helpers/webpackHelper').mount(this));
    } else {
      app.use('/client.js', express.static('client.js'));
      app.use('/style.css', express.static('style.css'));
    }
    
    app.use(reactMiddleware);
    
    this.regenerateModulesRouter();
    app.use((res, rej, next) => this.modulesRouter(res, rej, next));
    app.use('/', coreRouter);
    
    app.use((req, res, next) => {
      next(new HTTPError(404));
    });
    
    // noinspection JSUnusedLocalSymbols
    app.use((err, req, res, next) => {
      if(err.HTTPcode !== 404) console.error(err);
      
      const code = err.HTTPcode || 500;
      const result = {};
      result.error = {
        code,
        message: err.publicMessage || http.STATUS_CODES[code],
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      };
      res.status(code).react(result);
    });
    
    this.server.on('request', app);
  }
  
  async start() {
    if(!this.server.listening) {
      let port = janusz.getConfig("web").port || 3939;
      if(process.env.PORT) port = parseInt(process.env.PORT) || port;
      
      let host = janusz.getConfig("web").port.host || "0.0.0.0";
      if(process.env.HOST) host = process.env.HOST;
      
      this.server.listen({ port, host });
      WebModule.log(`Listening on ${chalk.yellow.bold(`http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`)}`);
    }
  }
  
  async stop() {
    if(this.server) await new Promise(res => this.server.close(res));
  }
  
  async onReloadOther() {
    this.regenerateModulesRouter();
  }
  
  getRouter() {
    return webRouter(this);
  }
  
  regenerateModulesRouter() {
    this.modulesRouter = express.Router();
    
    for(const mod of janusz.modules) {
      if(mod.getRouter) {
        this.modulesRouter.use("/" + stripAnsi(mod.constructor.ModuleName).toLowerCase(), requireLogin, mod.getRouter());
      }
    }
    
    WebModule.log("Regenerating routes");
  }
}
