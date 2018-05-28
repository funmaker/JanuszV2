import JanuszModule from "../core/JanuszModule";
import bodyParser from "body-parser";
import cookieParser from 'cookie-parser';
import compression from 'compression';
import express from "express";
import http from 'http';
import ExpressWS from 'express-ws';
import morgan from 'morgan';
import {PassThrough} from 'stream';
import * as readline from 'readline';
import {janusz} from "../index";
import {reactMiddleware} from "./server/helpers/reactHelper";
import HTTPError from "./server/helpers/HTTPError";
import {router} from "./server/routes";
import configs from './server/helpers/configs'

export default class WebModule extends JanuszModule {
	static ModuleName = "Web".cyan.bold;
	
	constructor(reloadedModule) {
		super();
		if(reloadedModule) {
			this.server = reloadedModule.server;
			reloadedModule.server = null;
		}
	}
	
	async init() {
		const app = this.app = express();
		ExpressWS(app, this.server);
		
		app.use(bodyParser.urlencoded({extended: false}));
		app.use(bodyParser.json());
		app.use(cookieParser());
		app.use(compression());
		app.use('/static', express.static('web/static'));
		if(process.env.NODE_ENV === 'development') {
			const stream = new PassThrough();
			readline.createInterface({input: stream}).on('line', line => WebModule.log(line));
			
			app.use(morgan('dev', {stream}));
			app.use(require('./server/helpers/webpackHelper').mount(this));
		} else {
			app.use('/client.js', express.static('client.js'));
			app.use('/style.css', express.static('style.css'));
		}
		
		app.use(reactMiddleware);
		
		for(let mod of janusz.modules) {
			if(mod.getRouter) {
				app.use("/" + mod.constructor.ModuleName.strip.toLowerCase(), mod.getRouter());
			}
		}
		
		app.use('/', router);
		
		app.use((req, res, next) => {
			next(new HTTPError(404));
		});

		// noinspection JSUnusedLocalSymbols
		app.use((err, req, res, next) => {
			console.error(err);
			
			const code = err.HTTPcode || 500;
			const result = {};
			result.error = {
				code: code,
				message: err.publicMessage || http.STATUS_CODES[code],
				stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
			};
			res.status(code).react(result);
		});
		
		if(!this.server) {
			this.server = http.createServer(app);
		} else {
			this.server.removeAllListeners('request');
			this.server.on('request', app);
		}
	}
	
	async start() {
		if(!this.server.listening) {
			let port = configs.port || 3000;
			if(process.env.DOCKERIZED) port = 80;
			
			this.server.listen(port);
			WebModule.log(`Listening on port ${port.toString().cyan.bold}`);
		}
	}
	
	async stop() {
		if(this.server) await new Promise(res => this.server.close(res));
	}
}
