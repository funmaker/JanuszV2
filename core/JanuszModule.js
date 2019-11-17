import chalk from "chalk";

export const logPrefix = (name = JanuszModule.ModuleName) =>
  chalk.white.bold(":: ") +
  chalk.white.dim(new Date().toLocaleString()) +
  chalk.white.bold(" :: ") +
  name +
  chalk.white.bold(" ::");

export default class JanuszModule {
  static ModuleName = chalk.bold("Unknown");
  
  static log(...args) {
    console.log(logPrefix(this.ModuleName), ...args);
  }
  
  static error(...args) {
    console.error(`${logPrefix(this.ModuleName)} ${chalk.red("ERROR")} ::`, ...args);
  }
  
  async init() {
    
  }
  
  async start() {
    
  }
  
  async stop() {
    
  }
  
  async onReloadOther() {
    
  }
}
