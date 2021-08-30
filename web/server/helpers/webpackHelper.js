import webpack from "webpack";
import webpackHotMiddleware from "webpack-hot-middleware";
import webpackDevMiddleware from "webpack-dev-middleware";
import express from "express";
import chalk from "chalk";
import webpackClientDevConfig from "../../../webpack/client.dev.babel";

let cachedRouter = null; // Cache for Server Side Hot Module Replacement

export const mount = webModule => {
  if(cachedRouter) return cachedRouter;
  
  const router = cachedRouter = express.Router();
  const compiler = webpack(webpackClientDevConfig);
  
  router.use(webpackDevMiddleware(compiler, {
    publicPath: webpackClientDevConfig.output.publicPath,
  }));
  
  router.use(webpackHotMiddleware(compiler, {
    log: (...logs) => webModule.constructor.log(...logs),
    path: '/__webpack_hmr',
    heartbeat: 10 * 1000,
  }));
  
  webModule.constructor.log(`Webpack Hot Middleware has been ${chalk.cyan.bold("enabled")}!`);
  
  return router;
};

