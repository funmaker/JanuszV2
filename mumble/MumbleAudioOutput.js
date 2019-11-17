import AudioSingletonDevice from "../audio/AudioSingletonDevice";
import { SAMPLE_RATE } from "../audio";

export default mumbleModule => class MumbleAudioOutput extends AudioSingletonDevice {
  static deviceName = "Mumble Output";
  static deviceNameGroup = "Mumble";
  
  stream = null;
  
  constructor(state) {
    super(1, 0, state);
  }
  
  onRemove() {
    if(this.stream) this.stream.end();
  }
  
  onTick() {
    if(!this.stream) {
      if(!mumbleModule.client.ready) {
        return;
      }
      this.stream = mumbleModule.client.inputStream({ sampleRate: SAMPLE_RATE });
      this.stream.on("close", () => this.stream = null);
    }
    
    const buffer = this.getInput(0);
    if(!buffer) return;
    
    this.stream.write(buffer);
  }
};
