import EventEmitter from "events";
import uuid from "uuid/v4";
import { merge } from "../sharedUtils";


export default class Node extends EventEmitter {
  static type = "Node";
  static defaultState = { x: 0, y: 0 };
  uuid = uuid();
  name;
  mounted = false;
  parent = null;
  root = null;
  _state;
  get state() { return this._state; }
  children = new Set();
  
  constructor(name, x, y, initialState) {
    super();
    
    this.name = name;
    this._state = new Proxy({
      ...this.constructor.defaultState,
      x, y,
      ...initialState,
    }, {
      set: (self, key, value) => {
        self[key] = merge(self[key], value);
        this.addUpdate({ state: { [key]: value } });
        return true;
      },
    });
  }
  
  addUpdate(data) {
    if(this.parent) this.parent.addUpdate({ children: { [this.uuid]: data } });
  }
  
  add(node, overrideState) {
    if(this.root.preloadedState[node.name]) {
      for(const [k, v] of Object.entries(this.root.preloadedState[node.name])) {
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
  
  remove(node) {
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
  
  getState() {
    return {
      type: this.constructor.type,
      uuid: this.uuid,
      name: this.name,
      state: this.state,
      children: [...this.children.values()].reduce((acc, val) => ({ ...acc, [val.uuid]: val.getState() }), {}),
    }
  }
  
  onInteract(_event) {
    throw new Error(`Noninteractive node. (${this.type})`);
  }
}
