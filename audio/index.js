import JanuszModule from "../core/JanuszModule";
import fs from 'fs-extra';
import {janusz, rootDir} from "../index";
import path from 'path';
import audioRouter from './router';
import audioSystem from "./audioSystem/audioSystem";
import OscilatorInput from "./audioSystem/OscilatorInput";

export default class AudioModule extends JanuszModule {
	static ModuleName = "Audio".green.bold;
	
	get allSounds() {
		let sounds = [];
		const scan = (arr) => arr.forEach(sound => {
			if(sound.type === "sound") {
				sounds.push(sound);
			} else {
				scan(sound.elements);
			}
		});
		scan(this.sounds);
		return sounds;
	}
	
	async init() {
		let files = 0;
		let folders = 0;
		const scanSounds = async (dirPath = path.join(rootDir, "sounds")) => Promise.all(
			(await fs.readdir(dirPath)).map(async file => {
				const filePath = path.join(dirPath, file);
				const stat = await fs.stat(filePath);
				if(stat.isDirectory()) {
					folders++;
					return {type: "folder", filename: file, path: filePath, elements: await scanSounds(filePath)};
				} else {
					files++;
					return {type: "sound", filename: file, path: filePath};
				}
			}),
		);
		this.sounds = await scanSounds();
		AudioModule.log(`Loaded ${files} sounds found inside ${folders + 1} folders.`);
		
		const devices = janusz.flatMap(mod => mod.getAudioDevices);
		audioSystem.registerDeviceTypes(janusz.flatMap(mod => mod.getAudioDevices));
		AudioModule.log(`Registered ${devices.length} audio devices.`);
	}
	
	async start() {
	
	}
	
	async stop() {
	
	}
	
	getRouter() {
		return audioRouter(this);
	}
	
	getAudioDevices() {
		return [OscilatorInput];
	}
}

