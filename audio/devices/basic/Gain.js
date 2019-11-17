import AudioDevice from "../../AudioDevice";
import Label from "../../Interface/Label";
import { Dial } from "../../Interface/NumberInput";

function parseDB(val) {
  if(Math.abs(val) < 10) return Math.floor(val * 10) / 10 + "dB";
  else return Math.floor(val) + "dB";
}

export default class Gain extends AudioDevice {
  static deviceName = `Gain`;
  static deviceNameGroup = "Basic";
  
  dB = this.interface.add(new Dial("dB", 0, 0, { min: -100, max: 100, value: 5, logScale: -1, title: "Gain Level (dBs)" }));
  label = this.interface.add(new Label("dBLabel", 3, 1, { text: parseDB(this.dB.value) }));
  
  constructor(state) {
    super(1, 1, state);
    
    this.dB.on("change", val => this.label.text = parseDB(val));
  }
  
  onTick() {
    const input = this.getInput(0);
    if(!input) {
      this.outputs[0] = null;
      return;
    }
    
    const ampRatio = 10 ** (this.dB.value / 20);
    const buffer = this.outputBuffers[0];
    
    for(let n = 0; n < input.length; n += 2) {
      let v = input.readInt16LE(n) * ampRatio;
      if(v > 32767) v = 32767;
      if(v < -32768) v = -32768;
      buffer.writeInt16LE(v, n);
    }
    
    this.outputs[0] = buffer;
  }
}
