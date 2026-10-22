import fs from 'fs';
import chalk from "chalk";
import JanuszModule from "./JanuszModule";

export interface Configs {
  discord?: {
    token: string;
  } | null;
  mumble?: {
    name: string;
    url: string;
    cert: string;
    key: string;
  } | null;
  web: {
    port?: number;
    host?: string;
    secret: string;
    password: string;
    cookieLifespan: number;
  };
}

export default class JanuszCore extends JanuszModule {
  static moduleName = chalk.yellow.bold("Core");
  configs: Configs = { web: { secret: "", password: "", cookieLifespan: 0 } };
  states: Record<string, unknown> = {};
  configsFile = process.env.CONFIGS_PATH || "./configs.json";
  statesFile = process.env.STATES_PATH || "./states.json";
  statesFileNew = `${this.statesFile}.new`;
  modules: JanuszModule[];
  
  constructor(modules: JanuszModule[] = []) {
    super();
    this.modules = modules;
  }
  
  async init() {
    JanuszCore.log(`Initializing file system storage...`);
    this.configs = JSON.parse(await fs.promises.readFile(this.configsFile, "utf8"));
    try {
      this.states = JSON.parse(await fs.promises.readFile(this.statesFile, "utf8"));
    } catch(e: any) {
      if(e.code !== 'ENOENT') JanuszCore.error(e);
      JanuszCore.log("Regenerating states.json");
      this.states = {};
    }
    
    JanuszCore.log(`Initializing ${this.modules.length} modules...`);
    let count = 0;
    await Promise.all(this.modules.map(async module => {
      try {
        await module.init();
        JanuszCore.log(`${module.moduleClass.moduleName} Initialized. ${++count}/${this.modules.length}`);
      } catch(e) {
        JanuszCore.error(e);
        JanuszCore.error(`${module.moduleClass.moduleName} Failed to Init. ${++count}/${this.modules.length}`);
        module.failed = true;
      }
    }));
  }
  
  async start() {
    JanuszCore.log(`Starting ${this.modules.length} modules...`);
    let count = 0;
    await Promise.all(this.modules.map(async module => {
      if(module.failed) {
        JanuszCore.log(`Skipping ${module.moduleClass.moduleName}. ${++count}/${this.modules.length}`);
        return;
      }
      try {
        await module.start();
        JanuszCore.log(`${module.moduleClass.moduleName} Started. ${++count}/${this.modules.length}`);
      } catch(e) {
        JanuszCore.error(e);
        JanuszCore.error(`${module.moduleClass.moduleName} Failed to Start. ${++count}/${this.modules.length}`);
        module.failed = true;
      }
    }));
  }
  
  async stop() {
    JanuszCore.log(`Stopping ${this.modules.length} modules...`);
    let count = 0;
    await Promise.all(this.modules.map(async module => {
      try {
        await module.stop();
        JanuszCore.log(`${module.moduleClass.moduleName} Stopped. ${++count}/${this.modules.length}`);
      } catch(e) {
        JanuszCore.error(e);
        JanuszCore.error(`${module.moduleClass.moduleName} Failed to Stop. ${++count}/${this.modules.length}`);
      }
    }));
  }
  
  getModule<Mod extends JanuszModule>(type: abstract new (...args: any[]) => Mod): Mod | undefined {
    return this.modules.find((module): module is Mod => module instanceof type);
  }
  
  getConfig<K extends keyof Configs>(name: K): Configs[K] {
    return this.configs[name];
  }
  
  getState<T>(name: string): T | undefined {
    return this.states[name] as T | undefined;
  }
  
  setState(name: string, value: unknown) {
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
