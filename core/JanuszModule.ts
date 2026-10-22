import chalk from "chalk";
import type { Router } from "express";
import type { AudioDeviceType } from "../audio/AudioDevice";
import type { WebsocketHandler } from "../web/websockets";

export const logPrefix = (name = JanuszModule.moduleName) =>
  chalk.white.bold(":: ")
  + chalk.white.dim(new Date().toLocaleString())
  + chalk.white.bold(" :: ")
  + name
  + chalk.white.bold(" ::");

export interface ModuleClass<Mod extends JanuszModule = JanuszModule> {
  new(reloadedModule?: Mod): Mod;
  moduleName: string;
}

export default abstract class JanuszModule {
  static moduleName = chalk.bold("Unknown");
  failed = false;
  
  static log(...args: unknown[]) {
    console.log(logPrefix(this.moduleName), ...args);
  }
  
  static error(...args: unknown[]) {
    console.error(`${logPrefix(this.moduleName)} ${chalk.red("ERROR")} ::`, ...args);
  }
  
  get moduleClass() {
    return this.constructor as typeof JanuszModule;
  }
  
  async init() {}
  
  async start() {}
  
  async stop() {}
  
  async onReloadOther() {}
  
  getRouter?(): Router;
  
  getWebsockets?(): Record<string, WebsocketHandler>;
  
  getAudioDevices?(): AudioDeviceType[];
}
