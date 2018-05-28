import 'source-map-support/register';
import 'colors';
import {logPrefix} from "./core/JanuszModule";
import JanuszCore from "./core";

export const rootDir = __dirname;

const requireModules = () => [
	require("./discord").default,
	require("./audio").default,
	require("./web").default,
];
const prefix = logPrefix("Janusz".yellow.bold);

export let janusz;

export const findModule = Type => janusz.modules.find(mod => mod instanceof Type);

(async () => {
	const modules = requireModules().map(Mod => new Mod());
	janusz = new JanuszCore(modules);
	
	await janusz.init();
	await janusz.start();
	
	console.log(`${prefix} All modules have been started. ${"Janusz".yellow.bold} is ready for action.`);
})().catch(console.error);

if(module.hot) {
	module.hot.accept(["./discord", "./audio", "./web"], () => (async () => {
		const newModules = requireModules();
		console.log(`${prefix} Reloading ${newModules.filter((Mod, n) => !(janusz.modules[n] instanceof Mod)).length} modules...`);
		
		for(let n = 0; n < newModules.length; n++) {
			if(!(janusz.modules[n] instanceof newModules[n])) {
				const oldModule = janusz.modules[n];
				const newModule = new newModules[n](oldModule);
				await oldModule.stop();
				janusz.modules[n] = newModule;
				await newModule.init();
				await newModule.start();
				console.log(`${prefix} ${newModules[n].ModuleName} Reloaded.`);
			}
		}
	})().catch(console.error));
	
	module.hot.accept(["./core"], () => (async () => {
		const NewJanuszCore = require("./core").default;
		console.log(`${prefix} Reloading ${NewJanuszCore.ModuleName}...`);
		
		const modules = requireModules().map(Mod => new Mod());
		const newJanusz = new NewJanuszCore(modules, janusz);
		
		await janusz.stop();
		janusz = newJanusz;
		
		await janusz.init();
		await janusz.start();
		
		console.log(`${prefix} All modules have been started. ${"Janusz".yellow.bold} is ready for action.`);
	})().catch(console.error));
}

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
