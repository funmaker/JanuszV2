import { state } from "../utils";
import Input from "./Input";

export default class NumberInput extends Input {
  static type = "NumberInput";
  
  @state min;
  @state max;
  @state step = 0;
  @state title = "value";
  
  @state(0)
  get value() { return super.value; }
  
  set value(value) {
    if(typeof value !== "number") throw new TypeError("Value should be a number.");
    
    if(this.step !== 0) value = Math.round(value / this.step) * this.step;
    if(this.min !== undefined && value < this.min) throw new RangeError("Value out of range.");
    if(this.min !== undefined && value > this.max) throw new RangeError("Value out of range.");
    
    super.value = value;
  }
}

export class Dial extends NumberInput {
  static type = "Dial";
  
  @state min = 0;
  @state max = 1;
  @state logScale = 0;
}

export class Slider extends NumberInput {
  static type = "Slider";
  
  @state min = 0;
  @state max = 1;
  @state logScale = 0;
  @state vertical = false;
  @state length = 1;
  @state size = 1;
}

