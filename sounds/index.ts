import path from 'path';
import type { Readable } from "stream";
import chokidar, { FSWatcher } from 'chokidar';
import chalk from "chalk";
import axios from "axios";
import HTTPError from "../web/server/helpers/HTTPError";
import JanuszModule from "../core/JanuszModule";
import { toPCM } from "../audio/ffmpeg";
import soundsRouter from './router';
import { TTS_URL } from "./constants";
import SoundsInput from "./SoundsInput";
import SpeakingInput from "./SpeakingInput";

const SOUNDS_DIR = path.resolve(process.env.SOUNDS_PATH || "sounds/sounds");

export interface SoundFile {
  type: "sound";
  filename: string;
  path: string;
  audioData: Buffer | null;
}

export interface SoundFolder {
  type: "folder";
  filename: string;
  path: string;
  elements: Sound[];
}

export type Sound = SoundFile | SoundFolder;

const MAX_DECODING = 8; // Avoids spawning an ffmpeg process for every sound at once on startup
let decoding = 0;
const decodeQueue: Array<() => void> = [];

export default class SoundsModule extends JanuszModule {
  static moduleName = chalk.green.bold("Sounds");
  soundsDeviceType = SoundsInput(this);
  speakingDeviceType = SpeakingInput(this);
  sounds: Sound[] = [];
  watcher: FSWatcher | null = null;
  verbose = false;
  
  constructor(reloadedModule?: SoundsModule) {
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
      this.watcher.on('add', this.onFile)
                  .on('change', this.onFile)
                  .on('addDir', this.addDir)
                  .on('unlink', this.remove)
                  .on('unlinkDir', this.remove)
                  .on('error', err => SoundsModule.error(err));
      this.verbose = true;
      return;
    }
    
    let folders = 0;
    let sounds = 0;
    const promises: Array<Promise<void>> = [];
    
    const watcher = this.watcher = chokidar.watch(SOUNDS_DIR);
    await new Promise<void>((res, rej) => {
      watcher.on('add', fullPath => {
        promises.push(this.addFile(fullPath));
        sounds++;
      })
        .on('change', this.onFile)
        .on('addDir', fullPath => {
          this.addDir(fullPath);
          folders++;
        })
        .on('unlink', this.remove)
        .on('unlinkDir', this.remove)
        .on('error', err => {
          SoundsModule.error(err);
          rej(err instanceof Error ? err : new Error(String(err)));
        })
        .once('ready', () => void Promise.all(promises).then(() => res()).catch((err: Error) => rej(err)));
    });
    
    watcher.removeAllListeners("add");
    watcher.removeAllListeners("addDir");
    watcher.removeAllListeners("error");
    watcher.on("add", this.onFile);
    watcher.on("addDir", this.addDir);
    watcher.on("error", err => SoundsModule.error(err));
    this.verbose = true;
    
    SoundsModule.log(`Loaded ${sounds} sounds found inside ${folders} folders.`);
  }
  
  async stop() {
    if(this.watcher) await this.watcher.close();
  }
  
  getRouter() {
    return soundsRouter(this);
  }
  
  getAudioDevices() {
    return [this.soundsDeviceType, this.speakingDeviceType];
  }
  
  async loadFile(soundPath: string) {
    while(decoding >= MAX_DECODING) await new Promise<void>(res => decodeQueue.push(res));
    decoding++;
    
    try {
      return await this.decodeFile(soundPath);
    } finally {
      decoding--;
      decodeQueue.shift()?.();
    }
  }
  
  async decodeFile(soundPath: string) {
    return await new Promise<Buffer | null>(res => {
      const bufs: Buffer[] = [];
      toPCM(soundPath, err => {
        SoundsModule.error(err);
        res(null);
      }).on('data', (buf: Buffer) => bufs.push(buf))
        .on('end', () => res(bufs.length > 0 ? Buffer.concat(bufs) : null)); // A failed decode ends before ffmpeg's exit code is known
    });
  }
  
  findParent(fullPath: string) {
    const paths = path.relative(SOUNDS_DIR, fullPath).split(path.sep).filter(p => p !== "");
    const filename = paths.pop();
    if(!filename || filename.startsWith(".")) return null;
    
    let sounds = this.sounds;
    for(const p of paths) {
      const dir = sounds.find(dir => dir.filename === p);
      if(dir?.type !== "folder") return null;
      sounds = dir.elements;
    }
    
    return { sounds, filename, relative: [...paths, filename].join("/") };
  }
  
  onFile = (fullPath: string) => {
    this.addFile(fullPath).catch(err => SoundsModule.error(err));
  };
  
  addFile = async (fullPath: string) => {
    if(this.verbose) SoundsModule.log("Adding file: ", fullPath);
    
    const parent = this.findParent(fullPath);
    if(!parent) return;
    
    const audioData = await this.loadFile(fullPath);
    const index = parent.sounds.findIndex(s => s.filename === parent.filename);
    if(index !== -1) parent.sounds.splice(index, 1);
    parent.sounds.push({ type: "sound", filename: parent.filename, path: parent.relative, audioData });
  };
  
  addDir = (fullPath: string) => {
    if(this.verbose) SoundsModule.log("Adding dir: ", fullPath);
    
    const parent = this.findParent(fullPath);
    if(!parent) return;
    
    const index = parent.sounds.findIndex(s => s.filename === parent.filename);
    if(index !== -1) parent.sounds.splice(index, 1);
    parent.sounds.push({ type: "folder", filename: parent.filename, path: parent.relative, elements: [] });
  };
  
  remove = (fullPath: string) => {
    if(this.verbose) SoundsModule.log("Removing: ", fullPath);
    
    const parent = this.findParent(fullPath);
    if(!parent) return;
    
    const index = parent.sounds.findIndex(sound => sound.filename === parent.filename);
    if(index !== -1) parent.sounds.splice(index, 1);
  };
  
  playPath(soundPath: string) {
    let sound: Sound | undefined = { elements: this.sounds, type: "folder", filename: "", path: "" };
    for(const p of soundPath.split("/")) {
      if(sound.type !== "folder") throw new HTTPError(404);
      
      if(p === "*") {
        const all: SoundFile[] = [];
        const crawl = (sound: Sound) => {
          if(sound.type === "sound") all.push(sound);
          else sound.elements.forEach(crawl);
        };
        crawl(sound);
        sound = all[Math.floor(Math.random() * all.length)];
      } else {
        sound = sound.elements.find(sound => sound.filename === p);
      }
      if(!sound) throw new HTTPError(404);
    }
    if(sound.type !== "sound" || !sound.audioData) throw new HTTPError(404);
    
    const { audioData } = sound;
    this.soundsDeviceType.getDevices().forEach(device => device.playSound(audioData));
  }
  
  async say(text: string, voice?: string, language?: string) {
    const { data: audio } = await axios.get<Readable>(`${TTS_URL}/tts`, { params: { voice, text, language }, responseType: 'stream' });
    
    const stream = toPCM(audio, err => SoundsModule.error(err));
    
    this.speakingDeviceType.getDevices().forEach(device => device.playStream(stream));
  }
}
