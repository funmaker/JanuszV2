import EventEmitter from "events";
import { merge } from "../sharedUtils";
import { state } from "../utils";
import type { InteractEvent, NodeStateData } from "../packets";
import type Root from "./Root";

export default class Node extends EventEmitter {
  static type = "Node";
  uuid = crypto.randomUUID();
  name: string;
  mounted = false;
  parent: Node | null = null;
  root: Root | null = null;
  children = new Set<Node>();
  readonly rawState: Record<string, any> = {};
  readonly state: Record<string, any> = new Proxy(this.rawState, {
    set: (self, key: string, value) => {
      const merged = merge(self[key], value);
      if(self[key] !== merged) {
        self[key] = merged;
        this.addUpdate({ state: { [key]: value } });
      }
      return true;
    },
  });
  
  @state accessor x: number | null = 0;
  @state accessor y: number | null = 0;
  
  constructor(name: string, x: number | null, y: number | null, initialState?: Record<string, any>) {
    super();
    
    this.name = name;
    Object.assign(this.rawState, { x, y }, initialState);
  }
  
  get nodeClass() {
    return this.constructor as typeof Node;
  }
  
  addUpdate(data: DeepPartial<NodeStateData>) {
    if(this.parent) this.parent.addUpdate({ children: { [this.uuid]: data } });
  }
  
  add<N extends Node>(node: N, overrideState?: Record<string, any>): N {
    if(!this.root) throw new Error("Cannot add children to an unmounted node.");
    
    const preloaded = this.root.preloadedState[node.name];
    if(preloaded) {
      for(const [k, v] of Object.entries(preloaded)) {
        node.state[k] = v;
      }
    }
    if(overrideState) {
      for(const [k, v] of Object.entries(overrideState)) {
        node.state[k] = v;
      }
    }
    node.parent = this;
    node.root = this.root;
    node.root.nodes.set(node.uuid, node);
    node.mounted = true;
    this.children.add(node);
    this.addUpdate({ children: { [node.uuid]: node.getState() } });
    
    return node;
  }
  
  remove(node: Node) {
    this.children.delete(node);
    node.parent = null;
    if(node.root) node.root.nodes.delete(node.uuid);
    node.root = null;
    node.mounted = false;
    this.addUpdate({ children: { [node.uuid]: null } });
  }
  
  destroy() {
    if(this.parent) this.parent.remove(this);
  }
  
  getState(): NodeStateData {
    return {
      type: this.nodeClass.type,
      uuid: this.uuid,
      name: this.name,
      state: this.state,
      children: [...this.children.values()].reduce((acc, val) => ({ ...acc, [val.uuid]: val.getState() }), {}),
    };
  }
  
  onInteract(_event: InteractEvent): void | Promise<void> {
    throw new Error(`Noninteractive node. (${this.nodeClass.type})`);
  }
}
