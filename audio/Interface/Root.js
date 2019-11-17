import { merge } from "../sharedUtils";
import { state } from "../utils";
import Node from "./Node";

export default class Root extends Node {
  static type = "Root";
  update = null;
  nodes = new Map([[this.uuid, this]]);
  preloadedState = {};
  
  @state width;
  @state height;
  
  constructor(width = 6, height = 3) {
    super("Root", null, null, {
      width,
      height,
    });
    
    this.root = this.parent = this;
  }
  
  preloadState = node => {
    if(node.name) this.preloadedState[node.name] = node.state;
    Object.values(node.children).forEach(this.preloadState);
  };
  
  addUpdate(data) {
    this.update = merge(this.update, data);
  }
  
  getUpdate() {
    const temp = this.update;
    this.update = null;
    return temp;
  }
  
  destroy() {
    const destroyTheChild = el => {
      el.children.forEach(destroyTheChild);
      el.destroy();
    };
    
    this.children.forEach(destroyTheChild);
  }
  
  get width() { return this.state.width; }
  set width(width) { this.state.width = width; }
  
  get height() { return this.state.height; }
  set height(height) { this.state.height = height; }
}
