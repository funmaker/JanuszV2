import 'source-map-support/register';
import 'colors';
import {logPrefix} from "./core/JanuszModule";
import JanuszCore from "./core";

export const rootDir = __dirname;

const requireModules = () => [
	require("./web").default,
	require("./audio").default,
	require("./sounds").default,
	require("./discord").default,
	require("./mumble").default,
	require("./youtube").default,
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

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

if(module.hot) {
	module.hot.accept(["./web", "./audio", "./sounds", "./discord", "./mumble", "./youtube"], () => (async () => {
		const newModules = requireModules();
		let changed = [];
		
		for(let n = 0; n < newModules.length; n++) {
			if(!(janusz.modules[n] instanceof newModules[n])) {
				changed.push(n);
			}
		}
		
		console.log(`${prefix} Reloading modules: ` + changed.map(n => newModules[n].ModuleName).join(", "));
		
		let reloadModules = changed.map(id => ({
			oldMod: janusz.modules[id],
			newMod: new newModules[id](janusz.modules[id]),
			id,
		}));
		await Promise.all(reloadModules.map(async ({oldMod}) => await oldMod.stop()));
		reloadModules.forEach(({id, newMod}) => janusz.modules[id] = newMod);
		await Promise.all(reloadModules.map(async ({newMod}) => await newMod.init()));
		await Promise.all(reloadModules.map(async ({newMod}) => await newMod.start()));
		
		await Promise.all(Object.keys(janusz.modules).filter(id => !changed.includes(parseInt(id)))
																								 .map(id => janusz.modules[id].onReloadOther()));
		
		console.log(`${prefix} Reload complete`);
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
	
	module.hot.accept(["./core/JanuszModule"], () => {});
}
