import {modules} from "../index";
import colors from "colors/lib/index";
import JanuszModule from "./JanuszModule";

colors.enabled = true;

export default class JanuszCore extends JanuszModule {
	static ModuleName = "Core".yellow.bold;
	
	constructor(modules) {
		super();
		this.modules = modules || [];
	}
	
	async init() {
		JanuszCore.log(`Initializing ${this.modules.length} modules...`);
		let count = 0;
		await Promise.all(this.modules.map(async module => {
			await module.init();
			JanuszCore.log(`${module.constructor.ModuleName} Initialized. ${++count}/${this.modules.length}`);
		}));
	}
	
	async start() {
		JanuszCore.log(`Starting ${this.modules.length} modules...`);
		let count = 0;
		await Promise.all(this.modules.map(async module => {
			await module.start();
			JanuszCore.log(`${module.constructor.ModuleName} Started. ${++count}/${this.modules.length}`);
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
	
	async afterReload() {
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
		for(let module of this.modules) {
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
}
