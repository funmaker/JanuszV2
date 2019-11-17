import AudioDevice from "../../AudioDevice";
import Label from "../../Interface/Label";
import { Dial } from "../../Interface/NumberInput";
import { BUFFER_SIZE, SAMPLE_RATE } from "../../index";

const parseHz = hz => {
  if(hz < 10) return Math.floor(hz * 10) / 10 + "Hz";
  else if(hz < 1000) return Math.floor(hz) + "Hz";
  else if(hz < 10000) return Math.floor(hz / 100) / 10 + "kHz";
  else return Math.floor(hz / 1000) + "kHz";
};

function parseDepth(depth) {
  if(depth < 1) return Math.floor(depth * 100) / 100 + "ms";
  else if(depth < 10) return Math.floor(depth * 10) / 10 + "ms";
  else return Math.floor(depth) + "ms";
}

const getHermite = (lastBuf, curBuf, frac, pos) => {
  const at = p => p >= 0 ? curBuf.readInt16LE(p * 2) : (lastBuf ? lastBuf.readInt16LE((p + BUFFER_SIZE) * 2) : 0);
  
  const y0 = at(pos + 0);
  const y1 = at(pos + 1);
  const y2 = at(pos + 2);
  const y3 = at(pos + 3);
  
  const c0 = y1;
  const c1 = (1.0 / 2.0) * (y2 - y0);
  const c2 = (y0 - (5.0 / 2.0) * y1) + (2.0 * y2 - (1.0 / 2.0) * y3);
  const c3 = (1.0 / 2.0) * (y3 - y0) + (3.0 / 2.0) * (y1 - y2);
  return ((c3 * frac + c2) * frac + c1) * frac + c0;
};

export default class FourthDensity extends AudioDevice {
  static deviceName = "Fourth Density";
  static deviceNameGroup = "Effects";
  
  freq = this.interface.add(new Dial("freq", 0, 0, { min: 0, max: 100, value: 6, logScale: -1, title: "Frequency (Hz)" }));
  freqLabel = this.interface.add(new Label("freqLabel", 3, 0.33, { text: parseHz(this.freq.value) }));
  depth = this.interface.add(new Dial("depth", 6, 0, { min: 0, max: BUFFER_SIZE / SAMPLE_RATE * 1000 - 4, value: 8, logScale: -1, title: "Depth (ms)" }));
  depthLabel = this.interface.add(new Label("depthLabel", 3, 1.66, { text: parseDepth(this.depth.value) }));
  offset = 0;
  
  constructor(state) {
    super(1, 1, state);
    
    this.interface.width = 9;
    this.freq.on("change", val => this.freqLabel.text = parseHz(val));
    this.depth.on("change", val => this.depthLabel.text = parseDepth(val));
  }
  
  onTick() {
    const input = this.getInput(0);
    if(input === null) return this.outputs[0] = null;
    
    const buffer = this.outputBuffers[0];
    const depth = this.depth.value / 1000 * SAMPLE_RATE;
    
    for(let n = 0; n < BUFFER_SIZE; n++) {
      const lfo = Math.cos(this.offset + (n + 1) * Math.PI * 2 / SAMPLE_RATE * this.freq.value) / 2 + 0.5;
      const delay = lfo * depth + 4;
      let value = getHermite(this.outputs[0], input, delay - Math.floor(delay), Math.floor(n - delay));
      if(value < -32768) value = -32768;
      if(value > 32767) value = 32767;
      
      buffer.writeInt16LE(value, n * 2);
    }
    this.offset = this.offset + (BUFFER_SIZE / SAMPLE_RATE) * Math.PI * 2 * this.freq.value;
    
    this.outputs[0] = buffer;
  }
}
