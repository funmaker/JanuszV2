import path from "path";
import fs from 'fs-extra';
import mumble from 'mumble';
import chalk from "chalk";
import JanuszModule from "../core/JanuszModule";
import { janusz, rootDir } from "../index";
import MumbleAudioOutput from "./MumbleAudioOutput";
import MumbleAudioInput from "./MumbleAudioInput";

export default class MumbleModule extends JanuszModule {
  static ModuleName = chalk.gray.bold("Mumble");
  OutputDevice = MumbleAudioOutput(this);
  InputDevice = MumbleAudioInput(this);
  
  constructor(reloadedModule) {
    super();
    if(reloadedModule) {
      if(reloadedModule.client) {
        this.client = reloadedModule.client;
        this.client.off('voice-start', reloadedModule.onVoiceStart);
        if(this.client.connection) this.client.connection.off('voice-start', reloadedModule.onVoiceStart);
        reloadedModule.client = null;
      }
    }
  }
  
  async init() {
    const config = janusz.getConfig("mumble");
    if(!config) return void MumbleModule.error("No mumble config, skipping...");
    
    this.cert = await fs.readFile(path.join(rootDir, config.cert));
    this.key = await fs.readFile(path.join(rootDir, config.key));
    if(!this.client) {
      this.client = await new Promise((res, rej) => mumble.connect(config.url, { cert: this.cert, key: this.key }, (err, con) => err ? rej(err) : res(con)));
    }
    this.client.on('voice-start', this.onVoiceStart);
    this.client.on('error', err => MumbleModule.error(err));
  }
  
  async start() {
    const config = janusz.getConfig("mumble");
    if(!config) return void MumbleModule.error("No mumble config, skipping...");
    
    if(this.client && !this.client.user) {
      this.client.authenticate(config.name);
      await new Promise(res => this.client.on('initialized', res));
    }
  }
  
  getAudioDevices() {
    return [this.OutputDevice, this.InputDevice];
  }
  
  async stop() {
    if(this.client) this.client.disconnect();
  }
  
  onVoiceStart = user => {
    this.InputDevice.devices.forEach(device => device.addStream(user.session));
  };
}
