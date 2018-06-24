import JanuszModule from "../core/JanuszModule";
import fs from 'fs-extra';
import {rootDir} from "../index";
import path from 'path';
import soundsRouter from './router';
import SoundsInput from "./SoundsInput";
import ffmpeg from 'fluent-ffmpeg';
import chokidar from 'chokidar';

export default class SoundsModule extends JanuszModule {
	static ModuleName = "Sounds".green.bold;
	soundDir = path.join(rootDir, "sounds/sounds");
	SoundsDevice = SoundsInput(this);
	router = soundsRouter(this);
	sounds = [];
	
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
	
	async loadFile(path) {
		return await new Promise((res, rej) => {
			const bufs = [];
			ffmpeg(path).audioChannels(1)
				.audioFrequency(48000)
				.noVideo()
				.format('s16le')
				.audioCodec('pcm_s16le')
				.on('error', err => SoundsModule.error(err) + res(null))
				.pipe()
				.on('data', buf => bufs.push(buf))
				.on('end', () => res(Buffer.concat(bufs)));
		});
	}
	
	addFile = async fullPath => {
		const path = fullPath.slice(this.soundDir.length + 1);
		const paths = path.split("/").filter(p => p !== "");
		if(paths.length === 0) return;
		
		let sounds = this.sounds;
		while(paths.length > 1) {
			const p = paths.shift();
			sounds = sounds.find(dir => dir.filename === p).elements;
		}
		
		const filename = paths.shift();
		if(filename.startsWith(".")) return;
		sounds.push({type: "sound", filename, path: path, audioData: await this.loadFile(fullPath)});
	};
	
	addDir = fullPath => {
		const path = fullPath.slice(this.soundDir.length + 1);
		const paths = path.split("/").filter(p => p !== "");
		if(paths.length === 0) return;
		
		let sounds = this.sounds;
		while(paths.length > 1) {
			const p = paths.shift();
			sounds = sounds.find(dir => dir.filename === p).elements;
		}
		
		const filename = paths.shift();
		if(filename.startsWith(".")) return;
		sounds.push({type: "folder", filename, path: path, elements: []});
	};
	
	remove = fullPath => {
		const path = fullPath.slice(this.soundDir.length + 1);
		const paths = path.split("/").filter(p => p !== "");
		if(paths.length === 0) return;
		
		let sounds = this.sounds;
		while(paths.length > 1) {
			const p = paths.shift();
			sounds = sounds.find(dir => dir.filename === p).elements;
		}
		
		const filename = paths.shift();
		if(filename.startsWith(".")) return;
		sounds.splice(sounds.findIndex(sound => sound.filename === filename), 1);
	};
	
	async init() {
		let folders = 0;
		let sounds = 0;
		let promises = [];
		
		await new Promise((res, rej) => {
			this.watcher = chokidar.watch(this.soundDir)
				.on('add', path => {
					let promise = this.addFile(path);
					if(promises) promises.push(promise);
					sounds++;
				})
				.on('change', this.addFile)
				.on('unlink', this.remove)
				.on('addDir', path => {
					this.addDir(path);
					folders++;
				})
				.on('unlinkDir', this.remove)
				.on('error', err => SoundsModule.error(err) + rej(err))
				.on('ready', () => Promise.all(promises).then(res).catch(rej));
		});
		
		promises = null;
		
		SoundsModule.log(`Loaded ${sounds} sounds found inside ${folders + 1} folders.`);
	}
	
	async stop() {
		this.watcher.close();
	}
	
	getRouter() {
		return this.router;
	}
	
	getAudioDevices() {
		return [this.SoundsDevice];
	}
}

