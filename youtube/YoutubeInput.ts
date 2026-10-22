import type { Readable } from "stream";
import AudioSingletonDevice from "../audio/AudioSingletonDevice";
import { BUFFER_SIZE } from "../audio/constants";
import type { DeviceStateData } from "../audio/packets";
import type YoutubeModule from "./index";

export default (_youtubeModule: YoutubeModule) => class YoutubeInput extends AudioSingletonDevice {
  static deviceName = "YouTube";
  stream: Readable | null = null;
  
  constructor(state?: DeviceStateData) {
    super(0, 1, state);
  }
  
  playStream(stream: Readable) {
    this.stream?.destroy();
    this.stream = stream;
    stream.on("end", () => {
      if(this.stream === stream) this.stream = null;
    });
  }
  
  stopStream() {
    this.stream?.destroy();
    this.stream = null;
  }
  
  onTick() {
    if(this.stream) {
      this.outputs[0] = this.stream.read(BUFFER_SIZE * 2) as Buffer | null;
    } else {
      this.outputs[0] = null;
    }
  }
};
