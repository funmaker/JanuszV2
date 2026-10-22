import type { Readable } from "stream";
import AudioSingletonDevice from "../audio/AudioSingletonDevice";
import { BUFFER_SIZE } from "../audio/constants";
import type { DeviceStateData } from "../audio/packets";
import type SoundsModule from "./index";

export default (_soundsModule: SoundsModule) => class SpeakingInput extends AudioSingletonDevice {
  static deviceName = "Speaking";
  streams: Readable[] = [];
  
  constructor(state?: DeviceStateData) {
    super(0, 1, state);
  }
  
  playStream(stream: Readable) {
    this.streams.push(stream);
    stream.on("end", () => {
      const index = this.streams.indexOf(stream);
      if(index !== -1) this.streams.splice(index, 1);
    });
  }
  
  stopStreams() {
    this.streams.forEach(stream => stream.destroy()); // Otherwise ffmpeg stays blocked on a full pipe forever
    this.streams.length = 0;
  }
  
  onTick() {
    if(this.streams.length > 0) {
      this.outputs[0] = this.streams[0].read(BUFFER_SIZE * 2) as Buffer | null;
    } else {
      this.outputs[0] = null;
    }
  }
};
