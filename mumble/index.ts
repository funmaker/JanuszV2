import fs from 'fs';
import type { Readable, Writable } from "stream";
import mumble from 'mumble';
import chalk from "chalk";
import JanuszModule from "../core/JanuszModule";
import { janusz } from "../core/janusz";
import MumbleAudioOutput from "./MumbleAudioOutput";
import MumbleAudioInput from "./MumbleAudioInput";

export interface MumbleUser {
  session: number;
}

export interface MumbleClient {
  ready: boolean;
  user: MumbleUser | null;
  connection: {
    outputStream(session: number, noEmptyFrames?: boolean): Readable;
  } | null;
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  once(event: string, listener: (...args: any[]) => void): void;
  authenticate(name: string): void;
  inputStream(options: { sampleRate: number }): Writable;
  disconnect(): void;
}

export default class MumbleModule extends JanuszModule {
  static moduleName = chalk.gray.bold("Mumble");
  client: MumbleClient | null = null;
  outputDeviceType = MumbleAudioOutput(this);
  inputDeviceType = MumbleAudioInput(this);
  
  constructor(reloadedModule?: MumbleModule) {
    super();
    if(reloadedModule?.client) {
      this.client = reloadedModule.client;
      this.client.off('voice-start', reloadedModule.onVoiceStart);
      this.client.off('error', reloadedModule.onError);
      reloadedModule.client = null;
    }
  }
  
  async init() {
    const config = janusz.getConfig("mumble");
    if(!config) return void MumbleModule.log("No mumble config, skipping...");
    
    if(!this.client) {
      const cert = await fs.promises.readFile(config.cert);
      const key = await fs.promises.readFile(config.key);
      this.client = await new Promise<MumbleClient>((res, rej) => mumble.connect(config.url, { cert, key }, (err: Error | null, con: MumbleClient) => err ? rej(err) : res(con)));
    }
    this.client.on('voice-start', this.onVoiceStart);
    this.client.on('error', this.onError);
  }
  
  async start() {
    const config = janusz.getConfig("mumble");
    if(!config) return;
    
    const client = this.client;
    if(client && !client.user) {
      client.authenticate(config.name);
      await new Promise(res => client.once('initialized', res));
    }
  }
  
  getAudioDevices() {
    return [this.outputDeviceType, this.inputDeviceType];
  }
  
  async stop() {
    if(this.client) this.client.disconnect();
  }
  
  onVoiceStart = (user: MumbleUser) => {
    this.inputDeviceType.getDevices().forEach(device => device.addStream(user.session));
  };
  
  onError = (err: Error) => MumbleModule.error(err);
}
