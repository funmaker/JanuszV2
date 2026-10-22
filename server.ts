import 'source-map-support/register';
import fs from 'fs';
import path from 'path';
import chalk from "chalk";
import { logs, logsEmitter } from './core/logger';
import { logPrefix, ModuleClass } from "./core/JanuszModule";
import JanuszCore from "./core";
import { janusz, setJanusz } from "./core/janusz";

const prefix = () => logPrefix(chalk.yellow.bold("Janusz"));
const requireModules = (): ModuleClass[] => [
  require("./web").default,
  require("./audio").default,
  require("./sounds").default,
  require("./discord").default,
  require("./mumble").default,
  require("./youtube").default,
];


process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

process.on('uncaughtException', err => {
  logsEmitter.removeAllListeners();
  console.log(prefix(), "Uncaught Exception:", err);
  
  const logsDir = path.resolve("logs");
  if(!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }
  const filename = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + ".log";
  const logPath = path.resolve(logsDir, filename);
  
  console.log(prefix(), "Saving crash log to:", logPath);
  
  fs.writeFileSync(logPath, logs.join("\n"));
  
  process.exit(-1);
});

let exiting = false;
process.on('SIGINT', () => {
  if(exiting) return;
  exiting = true;
  console.log(prefix(), "Received SIGINT, exiting...");
  
  (async () => {
    await janusz.stop();
    janusz.saveState();
    
    console.log(`${prefix()} All modules have been stopped. Bye bye.`);
    process.exit(0);
  })().catch(err => {
    console.error(err);
    process.exit(-1);
  });
});


(async () => {
  const modules = requireModules().map(moduleClass => new moduleClass());
  setJanusz(new JanuszCore(modules));
  
  await janusz.init();
  await janusz.start();
  
  console.log(`${prefix()} All modules have been started. ${chalk.yellow.bold("Janusz")} is ready for action.`);
  console.log(`Environment: ${chalk.yellow.bold("" + process.env.NODE_ENV)}.`);
})().catch(console.error);


if(import.meta.webpackHot) {
  import.meta.webpackHot.accept(["./web", "./audio", "./sounds", "./discord", "./mumble", "./youtube"], () => void (async () => {
    const newModules = requireModules();
    const changed: number[] = [];
    
    for(let n = 0; n < newModules.length; n++) {
      if(!(janusz.modules[n] instanceof newModules[n])) {
        changed.push(n);
      }
    }
    
    console.log(`${prefix()} Reloading modules: ` + changed.map(n => newModules[n].moduleName).join(", "));
    
    const reloadModules = changed.map(id => ({
      oldMod: janusz.modules[id],
      newMod: new newModules[id](janusz.modules[id]),
      id,
    }));
    await Promise.all(reloadModules.map(async ({ oldMod }) => await oldMod.stop()));
    reloadModules.forEach(({ id, newMod }) => janusz.modules[id] = newMod);
    await Promise.all(reloadModules.map(async ({ newMod }) => await newMod.init()));
    await Promise.all(reloadModules.map(async ({ newMod }) => await newMod.start()));
    
    await Promise.all(janusz.modules.filter((mod, id) => !changed.includes(id))
                                    .map(mod => mod.onReloadOther()));
    
    console.log(`${prefix()} Reload complete`);
  })().catch(console.error));
  
  import.meta.webpackHot.accept(["./core"], () => void (async () => {
    const NewJanuszCore: typeof JanuszCore = require("./core").default;
    console.log(`${prefix()} Reloading ${NewJanuszCore.moduleName}...`);
    
    await janusz.stop();
    
    const modules = requireModules().map(moduleClass => new moduleClass());
    setJanusz(new NewJanuszCore(modules));
    
    await janusz.init();
    await janusz.start();
    
    console.log(`${prefix()} All modules have been started. ${chalk.yellow.bold("Janusz")} is ready for action.`);
  })().catch(console.error));
  
  import.meta.webpackHot.accept(["./core/JanuszModule", "./core/logger"], () => {});
}
