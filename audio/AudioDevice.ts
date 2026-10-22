import { mixDown } from "./utils";
import Root from "./Interface/Root";
import * as packets from "./packets";
import { sendAll } from "./router";
import { BUFFER_SIZE } from "./constants";
import type { DeviceStateData } from "./packets";
import type AudioModule from "./index";

export interface Connection {
  uuid: string;
  from: AudioDevice;
  to: AudioDevice;
  output: number;
  input: number;
}

export interface AudioDeviceType {
  new(state?: DeviceStateData): AudioDevice;
  deviceName: string;
  deviceNameGroup: string | null;
  singleton: boolean;
  devices: Map<string, AudioDevice>;
}

export default class AudioDevice {
  static deviceName = "Generic Device";
  static deviceNameGroup: string | null = null;
  static singleton = false;
  static devices = new Map<string, AudioDevice>();
  
  uuid: string = crypto.randomUUID();
  inputCount: number;
  inputBuffers: Buffer[];
  outputCount: number;
  outputBuffers: Buffer[];
  outputActivity: boolean[];
  outputLastActivity: boolean[];
  outputs: Array<Buffer | null>;
  posx = 0;
  posy = 0;
  connections = new Map<string, Connection>();
  fresh = true;
  audioModule: AudioModule | null = null;
  interface: Root;
  
  static getDevices<T extends AudioDevice>(this: { prototype: T; devices: Map<string, AudioDevice> }): T[] {
    if(!Object.hasOwn(this, "devices")) return [];
    return [...this.devices.values()] as T[];
  }
  
  constructor(inputs: number, outputs: number, state?: DeviceStateData) {
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
    
    if(!Object.hasOwn(this.deviceClass, "devices")) {
      this.deviceClass.devices = new Map();
    }
    this.deviceClass.devices.set(this.uuid, this);
  }
  
  get deviceClass() {
    return this.constructor as AudioDeviceType;
  }
  
  remove() {
    this.deviceClass.devices.delete(this.uuid);
    this.onRemove();
    this.interface.destroy();
  }
  
  getState(): DeviceStateData {
    return {
      name: this.deviceClass.deviceName,
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
  
  getExtraState(): unknown {
    return null;
  }
  
  getInput(id: number) {
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
    
    for(let i = 0; i < this.outputs.length; i++) {
      if(this.outputs[i]) {
        this.outputActivity[i] = true;
      }
    }
  }
  
  getUpdate(): packets.DeviceUpdate | null {
    const interfaceUpdate = this.interface.getUpdate();
    
    if(interfaceUpdate) return { interface: interfaceUpdate };
    else return null;
  }
  
  getVisualUpdate(): packets.DeviceUpdate | null {
    const outputActivity: Record<number, boolean> = {};
    
    for(let i = 0; i < this.outputs.length; i++) {
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
  
  changeIO(inputs: number, outputs: number) {
    this.inputCount = inputs;
    this.outputCount = outputs;
    
    const resize = <T>(arr: T[], size: number, alloc: () => T) => {
      while(arr.length < size) arr.push(alloc());
      while(arr.length > size) arr.pop();
    };
    
    resize(this.inputBuffers, this.inputCount, () => Buffer.alloc(BUFFER_SIZE * 2));
    resize(this.outputBuffers, this.outputCount, () => Buffer.alloc(BUFFER_SIZE * 2));
    resize(this.outputActivity, this.outputCount, () => false);
    resize(this.outputLastActivity, this.outputCount, () => false);
    resize(this.outputs, this.outputCount, () => null);
    
    for(const con of [...this.connections.values()]) {
      if((con.to === this && con.input >= this.inputCount) || (con.from === this && con.output >= this.outputCount)) {
        this.audioModule?.removeConnection(con.uuid);
      }
    }
    
    sendAll(packets.devicesUpdatePacket({
      [this.uuid]: {
        inputs: this.inputCount,
        inputActivity: [...new Array(this.inputCount)].map(() => false), // Calculated on client side
        outputs: this.outputCount,
        outputActivity: this.outputLastActivity,
      },
    }));
  }
  
  onCreate() {
    // Implement This
  }
  
  onRemove() {
    // Implement This
  }
  
  onTick() {
    // Implement This
  }
}
