import { PassThrough } from "stream";
import AudioSingletonDevice from "../audio/AudioSingletonDevice";
import { mixDown } from "../audio/utils";
import type { DeviceStateData } from "../audio/packets";
import type SoundsModule from "./index";

export default (_soundsModule: SoundsModule) => class SoundsInput extends AudioSingletonDevice {
  static deviceName = "Sounds";
  tracks = new Set<PassThrough>();
  
  constructor(state?: DeviceStateData) {
    super(0, 1, state);
  }
  
  playSound(buffer: Buffer) {
    const stream = new PassThrough();
    this.tracks.add(stream);
    stream.end(buffer);
    stream.on('end', () => this.tracks.delete(stream));
  }
  
  stopSounds() {
    this.tracks.clear();
  }
  
  onTick() {
    this.outputs[0] = mixDown(this.outputBuffers[0], [...this.tracks.values()]);
  }
};
