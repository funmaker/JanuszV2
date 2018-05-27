export const logPrefix = (name = JanuszModule.ModuleName) => ":: ".white.bold + new Date().toLocaleString().white.dim + " :: ".white.bold + name + " ::".white.bold;

export default class JanuszModule {
	static ModuleName = "Unknown".bold;
	
	static log(...args) {
		console.log(logPrefix(this.ModuleName), ...args);
	}
	
	async init() {
	
	}
	
	async start() {
	
	}
}
