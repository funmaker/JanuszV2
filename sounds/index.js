import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import chokidar from 'chokidar';
import chalk from "chalk";
import * as axios from "axios";
import iso639 from 'iso-639-3';
import franc from 'franc-min';
import HTTPError from "../web/server/helpers/HTTPError";
import JanuszModule from "../core/JanuszModule";
import soundsRouter from './router';
import SoundsInput from "./SoundsInput";
import SpeakingInput from "./SpeakingInput";

const shortLang = {};
for(const { iso6391, iso6393 } of iso639) shortLang[iso6393] = iso6391;

const SOUNDS_DIR = path.join(__dirname, "sounds");

export default class SoundsModule extends JanuszModule {
  static ModuleName = chalk.green.bold("Sounds");
  SoundsDevice = SoundsInput(this);
  SpeakingDevice = SpeakingInput(this);
  sounds = [];
  watcher = null;
  verbose = false;
  
  constructor(reloadedModule) {
    super();
    if(reloadedModule) {
      this.sounds = reloadedModule.sounds;
      this.watcher = reloadedModule.watcher;
      reloadedModule.watcher = null;
    }
  }
  
  async init() {
    if(this.watcher) {
      this.watcher.removeAllListeners();
      this.watcher.on('add', this.addFile)
                  .on('change', this.addFile)
                  .on('addDir', this.addDir)
                  .on('unlink', this.remove)
                  .on('unlinkDir', this.remove)
                  .on('error', err => SoundsModule.error(err));
      this.verbose = true;
      return;
    }
    
    const folders = 0;
    let sounds = 0;
    let promises = [];
    
    await new Promise((res, rej) => {
      this.watcher = chokidar.watch(SOUNDS_DIR)
        .on('add', (...args) => {
          const promise = this.addFile(...args);
          if(promises) promises.push(promise);
          sounds++;
        })
        .on('change', this.addFile)
        .on('addDir', this.addDir)
        .on('unlink', this.remove)
        .on('unlinkDir', this.remove)
        .on('error', err => {
          SoundsModule.error(err);
          rej(err);
        })
        .once('ready', () => Promise.all(promises).then(res).catch(rej));
    });
    
    promises = null;
    this.watcher.removeAllListeners("add");
    this.watcher.on("add", this.addFile);
    this.watcher.removeAllListeners("error");
    this.watcher.on("error", err => SoundsModule.error(err));
    this.verbose = true;
    
    SoundsModule.log(`Loaded ${sounds} sounds found inside ${folders + 1} folders.`);
  }
  
  async stop() {
    if(this.watcher) this.watcher.close();
  }
  
  getRouter() {
    return soundsRouter(this);
  }
  
  getAudioDevices() {
    return [this.SoundsDevice, this.SpeakingDevice];
  }
  
  get allSounds() {
    const sounds = [];
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
  
  async loadFile(soundPath) {
    return await new Promise((res, rej) => {
      const bufs = [];
      ffmpeg(soundPath).audioChannels(1)
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
    if(this.verbose) {
      SoundsModule.log("Adding file: ", fullPath);
    }
    
    const relative = path.relative(SOUNDS_DIR, fullPath);
    const paths = relative.split("/").filter(p => p !== "");
    if(paths.length === 0) return;
    
    let sounds = this.sounds;
    while(paths.length > 1) {
      const p = paths.shift();
      sounds = sounds.find(dir => dir.filename === p).elements;
    }
    
    const filename = paths.shift();
    if(filename.startsWith(".")) return;
    const index = sounds.findIndex(s => s.filename === filename);
    if(index !== -1) sounds.splice(index, 1);
    sounds.push({ type: "sound", filename, path: relative, audioData: await this.loadFile(fullPath) });
  };
  
  addDir = fullPath => {
    if(this.verbose) {
      SoundsModule.log("Adding dir: ", fullPath);
    }
    
    const relative = path.relative(SOUNDS_DIR, fullPath);
    const paths = relative.split("/").filter(p => p !== "");
    if(paths.length === 0) return;
    
    let sounds = this.sounds;
    while(paths.length > 1) {
      const p = paths.shift();
      sounds = sounds.find(dir => dir.filename === p).elements;
    }
    
    const filename = paths.shift();
    if(filename.startsWith(".")) return;
    const index = sounds.findIndex(s => s.filename === filename);
    if(index !== -1) sounds.splice(index, 1);
    sounds.push({ type: "folder", filename, path: relative, elements: [] });
  };
  
  remove = fullPath => {
    if(this.verbose) {
      SoundsModule.log("Removing: ", fullPath);
    }
    
    const relative = path.relative(SOUNDS_DIR, fullPath);
    const paths = relative.split("/").filter(p => p !== "");
    if(paths.length === 0) return;
    
    let sounds = this.sounds;
    while(paths.length > 1) {
      const p = paths.shift();
      const dir = sounds.find(dir => dir.filename === p);
      if(dir === undefined) return;
      sounds = dir.elements;
    }
    
    const filename = paths.shift();
    if(filename.startsWith(".")) return;
    const index = sounds.findIndex(sound => sound.filename === filename);
    if(index === -1) return;
    sounds.splice(index, 1);
  };
  
  
  playPath(soundPath) {
    soundPath = soundPath.split("/");
    
    let sounds = { elements: this.sounds, type: "folder" };
    for(const p of soundPath) {
      if(sounds.type !== "folder") throw new HTTPError(404);
      
      if(p === "*") {
        const all = [];
        const crawl = sounds => {
          if(sounds.type === "sound") all.push(sounds);
          else sounds.elements.forEach(crawl);
        };
        crawl(sounds);
        sounds = all[Math.floor(Math.random() * all.length)];
      } else {
        sounds = sounds.elements.find(sound => sound.filename === p);
        if(!sounds) throw new HTTPError(404);
      }
    }
    if(!sounds) throw new HTTPError(404);
    
    this.SoundsDevice.devices.forEach(device => device.playSound(sounds.audioData));
  }
  
  async say(text, voice, lang) {
    const { data: { voices } } = await axios.get("http://ivona.miners.pl/voices");
    
    if(!voice) {
      if(!lang) {
        lang = shortLang[franc(text, { minLength: 1 })];
        if(!voices.some(v => v.lang.startsWith(lang))) lang = 'pl';
      }
      if(lang === 'pl') voice = "Jacek";
      else {
        voice = voices.find(v => v.lang.startsWith(lang)).name;
        if(voice === null) voice = "Jacek";
      }
    } else {
      if(!voices.some(v => v.name === voice)) throw new HTTPError(400, "Voice not found.");
    }
    
    const { data: audio } = await axios.get("http://ivona.miners.pl/say", { params: { voice, text }, responseType: 'stream' });
    
    const stream = ffmpeg(audio).audioChannels(1)
      .audioFrequency(48000)
      .noVideo()
      .format('s16le')
      .audioCodec('pcm_s16le')
      .on('error', err => SoundsModule.error(err))
      .pipe()
      .on("error", err => SoundsModule.error(err));
    
    this.SpeakingDevice.devices.forEach(device => device.playStream(stream));
  }
}

