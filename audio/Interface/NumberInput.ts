import { state } from "../utils";
import Input from "./Input";

export default class NumberInput extends Input<number> {
  static type = "NumberInput";
  static defaultValue = 0;
  
  @state accessor min: number | undefined = undefined;
  @state accessor max: number | undefined = undefined;
  @state accessor step = 0;
  @state accessor title = "value";
  
  get value() { return super.value; }
  
  set value(value: number) {
    if(typeof value !== "number") throw new TypeError("Value should be a number.");
    
    if(this.step !== 0) value = Math.round(value / this.step) * this.step;
    if(this.min !== undefined && value < this.min) throw new RangeError("Value out of range.");
    if(this.max !== undefined && value > this.max) throw new RangeError("Value out of range.");
    
    super.value = value;
  }
}

export class Dial extends NumberInput {
  static type = "Dial";
  
  @state accessor min: number | undefined = 0;
  @state accessor max: number | undefined = 1;
  @state accessor logScale = 0;
}

export class Slider extends NumberInput {
  static type = "Slider";
  
  @state accessor min: number | undefined = 0;
  @state accessor max: number | undefined = 1;
  @state accessor logScale = 0;
  @state accessor vertical = false;
  @state accessor length = 1;
  @state accessor size = 1;
}
