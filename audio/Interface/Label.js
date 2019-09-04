import Node from "./Node";

export default class Label extends Node {
  static type = "Label";
  static defaultState = { ...super.defaultState, size: 3, text: "Label" };
  
  get text() { return this.state.text; }
  set text(text) { this.state.text = text; }
}
