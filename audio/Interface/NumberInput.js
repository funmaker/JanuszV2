import Input from "./Input";

export default class NumberInput extends Input {
  static type = "NumberInput";
  static defaultState = { ...super.defaultState, value: 0, step: 0, title: "value" };
  
  get min() { return this.state.min; }
  set min(min) { this.state.min = min; }
  
  get max() { return this.state.max; }
  set max(max) { this.state.max = max; }
  
  get step() { return this.state.step; }
  set step(step) { this.state.step = step; }
  
  get value() { return this.state.value; }
  set value(value) {
    if(typeof value !== "number") throw new TypeError("Value should be a number.");
    
    if(this.step !== 0) value = Math.round(value / this.step) * this.step;
    if(this.min !== undefined && value < this.min) throw new RangeError("Value out of range.");
    if(this.min !== undefined && value > this.max) throw new RangeError("Value out of range.");
    
    super.value = value;
  }
  
  onInteract(event) {
    this.value = event.value;
  }
}

export class Dial extends NumberInput {
  static type = "Dial";
  static defaultState = { ...super.defaultState, min: 0, max: 1, logScale: 0 };
  
  get logScale() { return this.state.logScale; }
  set logScale(logScale) { this.state.logScale = logScale; }
}

export class Slider extends NumberInput {
  static type = "Gauge";
  static defaultState = { ...super.defaultState, min: 0, max: 1, logScale: 0 };
  
  get logScale() { return this.state.logScale; }
  set logScale(logScale) { this.state.logScale = logScale; }
}

