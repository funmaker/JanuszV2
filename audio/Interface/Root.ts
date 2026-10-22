import { merge } from "../sharedUtils";
import { state } from "../utils";
import type { NodeStateData } from "../packets";
import Node from "./Node";

export default class Root extends Node {
  static type = "Root";
  update: DeepPartial<NodeStateData> | null = null;
  nodes = new Map<string, Node>([[this.uuid, this]]);
  preloadedState: Record<string, Record<string, any>> = {};
  
  @state accessor width = 6;
  @state accessor height = 3;
  
  constructor(width = 6, height = 3) {
    super("Root", null, null, {
      width,
      height,
    });
    
    this.root = this;
    this.parent = this;
  }
  
  preloadState = (node: NodeStateData | null | undefined) => {
    if(!node) return;
    if(node.name) this.preloadedState[node.name] = node.state;
    Object.values(node.children).forEach(this.preloadState);
  };
  
  addUpdate(data: DeepPartial<NodeStateData>) {
    this.update = merge(this.update, data);
  }
  
  getUpdate() {
    const temp = this.update;
    this.update = null;
    return temp;
  }
  
  destroy() {
    const destroyTheChild = (el: Node) => {
      el.children.forEach(destroyTheChild);
      el.destroy();
    };
    
    this.children.forEach(destroyTheChild);
  }
}
