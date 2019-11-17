import uuid from "uuid/v4";
import { mixDown } from "./utils";
import Root from "./Interface/Root";
import { BUFFER_SIZE } from "./index";

export default class AudioDevice {
  static deviceName = "Generic Device";
  static deviceNameGroup = null;
  static devices = new Map();
  
  uuid = uuid();
  inputCount = 0;
  inputBuffers = [];
  outputCount = 0;
  outputBuffers = [];
  outputActivity = [];
  outputLastActivity = [];
  outputs = [];
  posx = 0;
  posy = 0;
  connections = new Map();
  fresh = true;
  audioModule = null;
  interface = null;
  
  constructor(inputs, outputs, state) {
    this.inputCount = inputs;
    this.outputCount = outputs;
    this.inputBuffers = [...new Array(this.inputCount)].map(() => Buffer.alloc(BUFFER_SIZE * 2));
    this.outputBuffers = [...new Array(this.outputCount)].map(() => Buffer.alloc(BUFFER_SIZE * 2));
    this.outputActivity = [...new Array(this.outputCount)].map(() => false);
    this.outputLastActivity = [...new Array(this.outputCount)].map(() => false);
    this.outputs = [...new Array(this.outputCount)].map(() => null);
    this.interface = new Root(6, Math.max(inputs, outputs) * 2 + 1);
    
    if(state) {
      this.uuid = state.uuid;
      this.posx = state.posx;
      this.posy = state.posy;
      this.interface.preloadState(state.interface);
    }
    
    if(!this.constructor.hasOwnProperty("devices")) {
      this.constructor.devices = new Map();
    }
    this.constructor.devices.set(this.uuid, this);
  }
  
  remove() {
    this.constructor.devices.delete(this.uuid);
    this.onRemove();
    this.interface.destroy();
    this.interface = null;
  }
  
  getState() {
    return {
      name: this.constructor.deviceName,
      uuid: this.uuid,
      posx: this.posx,
      posy: this.posy,
      inputs: this.inputCount,
      inputActivity: [...new Array(this.inputCount)].map(() => false), // Calculated on client side
      outputs: this.outputCount,
      outputActivity: this.outputLastActivity,
      interface: this.interface.getState(),
      extra: this.getExtraState(),
    };
  }
  
  getExtraState() {
    return null;
  }
  
  getInput(id) {
    const buffers = [];
    for(const con of this.connections.values()) {
      if(con.to === this && con.input === id) {
        con.from.tick();
        buffers.push(con.from.outputs[con.output]);
      }
    }
    
    return mixDown(this.inputBuffers[id], buffers);
  }
  
  refresh() {
    this.fresh = true;
  }
  
  tick() {
    if(!this.fresh) return;
    this.fresh = false;
    this.onTick();
    
    for(const i in this.outputs) {
      if(!this.outputs.hasOwnProperty(i)) continue;
      if(this.outputs[i]) {
        this.outputActivity[i] = true;
      }
    }
  }
  
  getUpdate() {
    const interfaceUpdate = this.interface.getUpdate();
    
    if(interfaceUpdate) return { interface: interfaceUpdate };
    else return null;
  }
  
  getVisualUpdate() {
    const outputActivity = {};
    
    for(const i in this.outputs) {
      if(!this.outputs.hasOwnProperty(i)) continue;
      if(this.outputActivity[i] && !this.outputLastActivity[i]) outputActivity[i] = true;
      else if(!this.outputActivity[i] && this.outputLastActivity[i]) outputActivity[i] = false;
    }
    
    this.outputLastActivity = this.outputActivity;
    this.outputActivity = this.outputActivity.map(() => false);
    
    if(Object.entries(outputActivity).length > 0) {
      return { outputActivity };
    } else {
      return null;
    }
  }
  
  onRemove() {
    // Implement This
  }
  
  onTick() {
    // Implement This
  }
}
