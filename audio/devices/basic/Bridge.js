import AudioDevice from "../../AudioDevice";
import { Slider } from "../../Interface/NumberInput";
import { mixDown } from "../../utils";

export default class Bridge extends AudioDevice {
  static deviceName = "Bridge";
  static deviceNameGroup = "Basic";
  
  size = this.interface.add(new Slider("size", 1, 1, {
    min: 2,
    max: 3,
    step: 1,
    value: 2,
    vertical: true,
    length: 1.5,
    size: 2,
    title: "Size",
  }));
  
  constructor(state) {
    super(2, 2, state);
    
    this.interface.height = this.size.value * 2 + 1;
    this.interface.width = 4;
    
    this.size.on("change", val => {
      val = Math.floor(val);
      this.size.max = val + 1;
      this.size.length = val - 0.5;
      this.interface.height = val * 2 + 1;
      if(this.inputCount !== val) {
        this.changeIO(val, val);
      }
    });
  }
  
  onCreate() {
    this.changeIO(this.size.value, this.size.value);
  }
  
  onTick() {
    const inputs = [];
    for(let i = 0; i < this.inputCount; i++) inputs[i] = this.getInput(i);
    for(let i = 0; i < this.outputCount; i++) this.outputs[i] = mixDown(this.outputBuffers[i], inputs.filter((input, id) => id !== i));
  }
}
