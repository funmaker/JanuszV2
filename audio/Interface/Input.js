import { state } from "../utils";
import Node from "./Node";

export default class Input extends Node {
  static type = "Input";
  
  @state("")
  get value() { return this.state.value; }
  
  set value(value) {
    this.state.value = value;
    this.emit("change", value);
  }
  
  onInteract(event) {
    this.value = event.value;
  }
}
