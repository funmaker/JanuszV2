import 'source-map-support/register';
import colors from 'colors'; colors.enabled = true;
import {logPrefix} from "./core/JanuszModule";
import JanuszCore from "./core";
import DiscordModule from "./discord";
import AudioModule from "./audio";
import WebModule from "./web";

export const rootDir = __dirname;

const modules = [
	new DiscordModule(),
	new AudioModule(),
	new WebModule(),
];

export const findModule = (type) => modules.find(mod => mod instanceof type);

export const janusz = new JanuszCore(modules);

(async () => {
	await janusz.init();
	await janusz.start();
	
	console.log(`${logPrefix("Janusz".yellow.bold)} All modules have been started. ${"Janusz".yellow.bold} is ready for action.`);
})().catch(console.error);
