import Node from "./Node";

export default class Input extends Node {
  static type = "Input";
  static defaultState = { ...super.defaultState, value: "" };
  
  get value() { return this.state.value; }
  set value(value) {
    this.state.value = value;
    this.emit("change", value);
  }
}
