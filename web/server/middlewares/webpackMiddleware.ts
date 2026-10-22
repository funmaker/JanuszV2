import webpack from "webpack";
import webpackHotMiddleware from "webpack-hot-middleware";
import webpackDevMiddleware from "webpack-dev-middleware";
import express from "express";
import chalk from 'chalk';
import webpackClientDevConfig from "../../../webpack/client.dev";

let cachedRouter: express.Router | null = null; // Cache for Server Side Hot Module Replacement

export const mount = (log: (...args: unknown[]) => void) => {
  if(cachedRouter) return cachedRouter;
  
  const router = cachedRouter = express.Router();
  
  log(`Webpack Hot Middleware has been ${chalk.bold.yellow("enabled")}!`);
  const compiler = webpack(webpackClientDevConfig);
  
  router.use(webpackDevMiddleware(compiler, {
    publicPath: webpackClientDevConfig.output?.publicPath as string | undefined,
  }));
  
  router.use(webpackHotMiddleware(compiler, {
    log,
    path: '/__webpack_hmr',
    heartbeat: 10 * 1000,
  }));
  
  return router;
};
