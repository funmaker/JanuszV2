import path from "path";
import fs from 'fs';
import chalk from "chalk";
import { rootDir } from "../index";
import JanuszModule from "./JanuszModule";

export default class JanuszCore extends JanuszModule {
  static ModuleName = chalk.yellow.bold("Core");
  configs = {};
  states = {};
  configsFile = path.join(rootDir, "./configs.json");
  statesFile = path.join(rootDir, "./states.json");
  statesFileNew = path.join(rootDir, "./states.json.new");
  
  constructor(modules) {
    super();
    this.modules = modules || [];
  }
  
  async init() {
    JanuszCore.log(`Initializing file system storage...`);
    this.configs = JSON.parse(await fs.promises.readFile(this.configsFile, "utf8"));
    try {
      this.states = JSON.parse(await fs.promises.readFile(this.statesFile, "utf8"));
    } catch(e) {
      if(e.code !== 'ENOENT') JanuszCore.error(e);
      JanuszCore.log("Regenerating states.json");
      this.states = {};
    }
    
    JanuszCore.log(`Initializing ${this.modules.length} modules...`);
    let count = 0;
    await Promise.all(this.modules.map(async module => {
      try {
        await module.init();
        JanuszCore.log(`${module.constructor.ModuleName} Initialized. ${++count}/${this.modules.length}`);
      } catch(e) {
        JanuszCore.error(e);
        JanuszCore.error(`${module.constructor.ModuleName} Failed to Init. ${++count}/${this.modules.length}`);
        // eslint-disable-next-line require-atomic-updates
        module.failed = true;
      }
    }));
  }
  
  async start() {
    JanuszCore.log(`Starting ${this.modules.length} modules...`);
    let count = 0;
    await Promise.all(this.modules.map(async module => {
      if(module.failed) {
        JanuszCore.log(`Skipping ${module.constructor.ModuleName}. ${++count}/${this.modules.length}`);
        return;
      }
      try {
        await module.start();
        JanuszCore.log(`${module.constructor.ModuleName} Started. ${++count}/${this.modules.length}`);
      } catch(e) {
        JanuszCore.error(e);
        JanuszCore.error(`${module.constructor.ModuleName} Failed to Start. ${++count}/${this.modules.length}`);
        // eslint-disable-next-line require-atomic-updates
        module.failed = true;
      }
    }));
  }
  
  async stop() {
    JanuszCore.log(`Stopping ${this.modules.length} modules...`);
    let count = 0;
    await Promise.all(this.modules.map(async module => {
      await module.stop();
      JanuszCore.log(`${module.constructor.ModuleName} Stopped. ${++count}/${this.modules.length}`);
    }));
  }
  
  getModule(type) {
    return this.modules.find(module => module instanceof type);
  }
  
  flatMap(fun) {
    let res = [];
    for(const module of this.modules) {
      let ret = fun(module);
      if(typeof ret === "function") ret = ret.call(module);
      if(typeof ret === "undefined") continue;
      if(ret === null) continue;
      if(Array.isArray(ret)) {
        res = [...res, ...ret];
      } else {
        res = [...res, ret];
      }
    }
    return res;
  }
  
  getConfig(name) {
    return this.configs[name];
  }
  
  getState(name) {
    return this.states[name];
  }
  
  setState(name, value) {
    this.states[name] = value;
    this.saveState();
  }
  
  saveState() {
    try {
      fs.writeFileSync(this.statesFileNew, JSON.stringify(this.states, null, 4));
      fs.copyFileSync(this.statesFileNew, this.statesFile);
    } catch(e) {
      JanuszCore.error(e);
    }
  }
}

