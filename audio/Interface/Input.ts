import type { InteractEvent } from "../packets";
import Node from "./Node";

export default class Input<Value = string> extends Node {
  static type = "Input";
  static defaultValue: unknown = "";
  
  constructor(name: string, x: number | null, y: number | null, initialState?: Record<string, any>) {
    super(name, x, y, initialState);
    
    if(this.rawState.value === undefined) this.rawState.value = (this.constructor as typeof Input).defaultValue;
  }
  
  get value(): Value { return this.state.value; }
  
  set value(value: Value) {
    this.state.value = value;
    this.emit("change", value);
  }
  
  onInteract(event: InteractEvent) {
    this.value = event.value;
  }
}
