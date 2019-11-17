import AudioDevice from "../../AudioDevice";
import Label from "../../Interface/Label";
import { Dial } from "../../Interface/NumberInput";
import { BUFFER_SIZE } from "../../index";
import Button from "../../Interface/Button";
import PS from "./paulstretch/PaulStretch";
import { newBlock } from "./paulstretch/block-helpers";

const parseRatio = ratio => {
  if(ratio < 10) return Math.floor(ratio * 10) / 10 + "x";
  else return Math.floor(ratio) + "x";
};

export default class PaulStretch extends AudioDevice {
  static deviceName = "PaulStretch";
  static deviceNameGroup = "Effects";
  
  ratio = this.interface.add(new Dial("ratio", 0, 0, { min: 0.25, max: 1000, value: 10, logScale: -1, title: "Ratio" }));
  ratioLabel = this.interface.add(new Label("ratioLabel", 3, 0.33, { text: parseRatio(this.ratio.value) }));
  bufferLabel = this.interface.add(new Label("bufferLabel", 3, 1.66, { text: "0", size: 2 }));
  resetButton = this.interface.add(new Button("resetButton", 5, 1.66, { icon: "close", size: 1 }));
  engine = new PS(1, this.ratio.value);
  outputBlock = newBlock(1, BUFFER_SIZE);
  
  constructor(state) {
    super(1, 1, state);
    
    this.ratio.on("change", val => {
      this.ratioLabel.text = parseRatio(val);
      this.engine.setRatio(val);
    });
  }
  
  onTick() {
    if(this.resetButton.value) {
      this.engine.samplesIn.clear();
      this.engine.samplesOut.clear();
      this.outputs[0] = null;
    }
    
    const input = this.getInput(0);
    if(input) {
      const block = newBlock(1, BUFFER_SIZE);
      for(let i = 0; i < BUFFER_SIZE; i++) {
        block[0][i] = input.readInt16LE(i * 2) / 32768;
      }
      this.engine.write(block);
    }
    
    while(this.engine.readQueueLength() < this.outputBlock[0].length && this.engine.process()) true;
    this.bufferLabel.text = Math.ceil(this.engine.writeQueueLength() / BUFFER_SIZE);
    
    const output = this.engine.read(this.outputBlock);
    if(output) {
      const buffer = this.outputBuffers[0];
      for(let i = 0; i < BUFFER_SIZE; i++) {
        let value = Math.round(output[0][i] * 32768 / 2);
        if(value < -32768) value = -32768;
        if(value > 32767) value = 32767;
        buffer.writeInt16LE(value, i * 2);
      }
      this.outputs[0] = buffer;
    } else {
      this.engine.samplesIn.clear();
      this.engine.samplesOut.clear();
      this.outputs[0] = null;
    }
  }
}
