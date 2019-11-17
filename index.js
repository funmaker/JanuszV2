import 'source-map-support/register';
import fs from 'fs';
import path from 'path';
import chalk from "chalk";
import { logs, logsEmitter } from './core/logger';
import { logPrefix } from "./core/JanuszModule";
import JanuszCore from "./core";

export const rootDir = __dirname;
export let janusz;
export const findModule = Type => janusz.modules.find(mod => mod instanceof Type);

const prefix = logPrefix(chalk.yellow.bold("Janusz"));
const requireModules = () => [
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

process.on('uncaughtException', (err) => {
  logsEmitter.removeAllListeners();
  console.log(prefix, "Uncaught Exception:", err);
  
  const logsDir = path.resolve(rootDir, "logs");
  if(!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }
  const filename = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + ".log";
  const logPath = path.resolve(logsDir, filename);
  
  console.log(prefix, "Saving crash log to:", logPath);
  
  fs.writeFileSync(logPath, logs.join("\n"));
  
  process.exit(-1);
});

let exiting = false;
process.on('SIGINT', async () => {
  if(exiting) return;
  exiting = true;
  console.log(prefix, "Received SIGINT, exiting...");
  
  await janusz.stop();
  await janusz.saveState();
  
  console.log(`${prefix} All modules have been stoppped. Bye bye.`);
  process.exit(0);
});


(async () => {
  const modules = requireModules().map(Mod => new Mod());
  janusz = new JanuszCore(modules);
  
  await janusz.init();
  await janusz.start();
  
  console.log(`${prefix} All modules have been started. ${chalk.yellow.bold("Janusz")} is ready for action.`);
})().catch(console.error);


if(module.hot) {
  module.hot.accept(["./web", "./audio", "./sounds", "./discord", "./mumble", "./youtube"], () => (async () => {
    const newModules = requireModules();
    const changed = [];
    
    for(let n = 0; n < newModules.length; n++) {
      if(!(janusz.modules[n] instanceof newModules[n])) {
        changed.push(n);
      }
    }
    
    console.log(`${prefix} Reloading modules: ` + changed.map(n => newModules[n].ModuleName).join(", "));
    
    const reloadModules = changed.map(id => ({
      oldMod: janusz.modules[id],
      newMod: new newModules[id](janusz.modules[id]),
      id,
    }));
    await Promise.all(reloadModules.map(async ({ oldMod }) => await oldMod.stop()));
    reloadModules.forEach(({ id, newMod }) => janusz.modules[id] = newMod);
    await Promise.all(reloadModules.map(async ({ newMod }) => await newMod.init()));
    await Promise.all(reloadModules.map(async ({ newMod }) => await newMod.start()));
    
    await Promise.all(Object.keys(janusz.modules).filter(id => !changed.includes(parseInt(id)))
                                                 .map(id => janusz.modules[id].onReloadOther()));
    
    console.log(`${prefix} Reload complete`);
  })().catch(console.error));
  
  module.hot.accept(["./core"], () => (async () => {
    const NewJanuszCore = require("./core").default;
    console.log(`${prefix} Reloading ${NewJanuszCore.ModuleName}...`);
    
    await janusz.stop();
    
    const modules = requireModules().map(Mod => new Mod());
    // eslint-disable-next-line require-atomic-updates
    janusz = new NewJanuszCore(modules, janusz);
    
    await janusz.init();
    await janusz.start();
    
    console.log(`${prefix} All modules have been started. ${chalk.yellow.bold("Janusz")} is ready for action.`);
  })().catch(console.error));
  
  module.hot.accept(["./core/JanuszModule"], () => {});
}
