import type { Writable } from "stream";
import AudioSingletonDevice from "../audio/AudioSingletonDevice";
import { SAMPLE_RATE } from "../audio/constants";
import type { DeviceStateData } from "../audio/packets";
import type MumbleModule from "./index";

export default (mumbleModule: MumbleModule) => class MumbleAudioOutput extends AudioSingletonDevice {
  static deviceName = "Mumble Output";
  static deviceNameGroup = "Mumble";
  
  stream: Writable | null = null;
  
  constructor(state?: DeviceStateData) {
    super(1, 0, state);
  }
  
  onRemove() {
    if(this.stream) this.stream.end();
  }
  
  onTick() {
    if(!this.stream) {
      if(!mumbleModule.client?.ready) return;
      
      const stream = this.stream = mumbleModule.client.inputStream({ sampleRate: SAMPLE_RATE });
      stream.on("close", () => {
        if(this.stream === stream) this.stream = null;
      });
    }
    
    const buffer = this.getInput(0);
    if(!buffer) return;
    
    this.stream.write(buffer);
  }
};
