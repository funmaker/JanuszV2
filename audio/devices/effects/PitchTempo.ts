import AudioDevice from "../../AudioDevice";
import { Dial } from "../../Interface/NumberInput";
import Label from "../../Interface/Label";
import { BUFFER_SIZE } from "../../constants";
import type { DeviceStateData } from "../../packets";
import { SoundTouch } from "./soundtouch/soundtouch";

const parseRatio = (rat: number) => rat.toFixed(2);

export default class PitchTempo extends AudioDevice {
  static deviceName = "Pitch & Tempo";
  static deviceNameGroup = "Effects";
  
  pitch = this.interface.add(new Dial("pitch", 0, 0, { min: 0.1, max: 10, value: 1, logScale: -10, title: "Pitch ratio" }));
  pitchLabel = this.interface.add(new Label("pitchLabel", 3, 0.33, { text: parseRatio(this.pitch.value) }));
  tempo = this.interface.add(new Dial("tempo", 6, 0, { min: 0.1, max: 10, value: 1, logScale: -10, title: "Tempo ratio" }));
  tempoLabel = this.interface.add(new Label("tempoLabel", 3, 1.66, { text: parseRatio(this.tempo.value) }));
  engine: any = new (SoundTouch as any)();
  wait = false;
  
  constructor(state?: DeviceStateData) {
    super(1, 1, state);
    this.interface.width = 9;
    this.engine.pitch = this.pitch.value;
    this.engine.tempo = this.tempo.value;
    
    this.pitch.on("change", (val: number) => {
      this.pitchLabel.text = parseRatio(val);
      this.engine.pitch = val;
    });
    this.tempo.on("change", (val: number) => {
      this.tempoLabel.text = parseRatio(val);
      this.engine.tempo = val;
    });
  }
  
  onTick() {
    const speedup = this.engine.tempo > 1;
    
    const input = this.getInput(0);
    if(input) {
      const samples = new Int16Array(input.buffer, input.byteOffset, input.length / 2);
      this.engine.inputBuffer.putSamples(samples);
    }
    
    if(speedup && this.wait && !input) {
      this.wait = false;
    } else if(speedup && this.wait) {
      this.outputs[0] = null;
      return;
    }
    
    while(this.engine.outputBuffer.frameCount < BUFFER_SIZE / 2 && this.engine.process(BUFFER_SIZE / 2)) { /* empty */ }
    
    if(this.engine.outputBuffer.frameCount >= BUFFER_SIZE / 2) {
      const output = this.outputBuffers[0];
      const samples = new Int16Array(output.buffer, output.byteOffset, output.length / 2);
      this.engine.outputBuffer.receiveSamples(samples, BUFFER_SIZE / 2);
      this.outputs[0] = output;
    } else if(!input) {
      this.outputs[0] = null;
      this.engine.inputBuffer.clear();
      this.engine._intermediateBuffer.clear();
      this.engine.outputBuffer.clear();
    } else {
      this.wait = true;
      this.outputs[0] = null;
    }
  }
}
