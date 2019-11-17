import AudioSingletonDevice from "../audio/AudioSingletonDevice";
import { BUFFER_SIZE } from "../audio";

export default youtubeModule => class YoutubeInput extends AudioSingletonDevice {
  static deviceName = "YouTube";
  stream = null;
  
  constructor(state) {
    super(0, 1, state);
  }
  
  playStream(stream) {
    this.stream = stream;
    this.stream.on("end", () => this.stream = null);
  }
  
  stopStream() {
    this.stream = null;
  }
  
  onTick() {
    if(this.stream) {
      this.outputs[0] = this.stream.read(BUFFER_SIZE * 2);
    } else {
      this.outputs[0] = null;
    }
  }
};
