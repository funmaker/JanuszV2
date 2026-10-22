import chalk from "chalk";
import JanuszModule from "../core/JanuszModule";
import { janusz } from "../core/janusz";
import * as packets from "./packets";
import audioWebsocket, { sendAll } from './router';
import { BUFFER_SIZE, SAMPLE_RATE, VISUAL_UPDATE_FREQ } from "./constants";
import AudioDevice, { AudioDeviceType, Connection } from "./AudioDevice";
import Oscillator from "./devices/basic/Oscillator";
import Mixer from "./devices/basic/Mixer";
import Delay from "./devices/basic/Delay";
import Gain from "./devices/basic/Gain";
import Switch from "./devices/basic/Switch";
import Bridge from "./devices/basic/Bridge";
import FourthDensity from "./devices/effects/FourthDensity";
import PaulStretch from "./devices/effects/PaulStretch";
import PitchTempo from "./devices/effects/PitchTempo";

interface AudioSystemState {
  devices: packets.DeviceStateData[];
  connections: packets.ConnectionStateData[];
}

export default class AudioModule extends JanuszModule {
  static moduleName = chalk.green.dim.bold("Audio");
  deviceTypes = new Map<string, AudioDeviceType>();
  devices = new Map<string, AudioDevice>();
  connections = new Map<string, Connection>();
  tickInterval: NodeJS.Timeout | null = null;
  visualInterval: NodeJS.Timeout | null = null;
  
  async init() {
    this.registerDeviceTypes();
    this.load();
    
    sendAll(this.getInitPacket());
    AudioModule.log(`Registered ${this.deviceTypes.size} audio devices.`);
  }
  
  async start() {
    this.tickInterval = setInterval(this.onTick, BUFFER_SIZE / SAMPLE_RATE * 1000);
    this.visualInterval = setInterval(this.onVisualUpdate, 1000 / VISUAL_UPDATE_FREQ);
  }
  
  async stop() {
    if(this.tickInterval) clearInterval(this.tickInterval);
    if(this.visualInterval) clearInterval(this.visualInterval);
    this.save();
    this.removeAllDevices();
  }
  
  getAudioDevices() {
    return [
      Oscillator, Mixer, Delay, Gain, Switch, FourthDensity, PaulStretch, PitchTempo, Bridge,
    ];
  }
  
  getWebsockets() {
    return {
      "/": audioWebsocket(this),
    };
  }
  
  async onReloadOther() {
    this.save();
    this.removeAllDevices();
    this.registerDeviceTypes();
    this.load();
    
    sendAll(this.getInitPacket());
  }
  
  registerDeviceTypes() {
    this.deviceTypes.clear();
    
    for(const Dt of janusz.modules.flatMap(mod => mod.getAudioDevices?.() ?? [])) {
      this.deviceTypes.set(Dt.deviceName, Dt);
    }
  }
  
  removeAllDevices() {
    for(const device of [...this.devices.values()]) this.removeDevice(device.uuid);
  }
  
  getInitPacket() {
    return packets.initPacket(
      [...this.devices.values()].map(dev => dev.getState()),
      [...this.connections.keys()].map(uuid => this.getConnectionState(uuid)),
      [...this.deviceTypes.values()].map(type => ({
        deviceName: type.deviceName,
        deviceNameGroup: type.deviceNameGroup,
        singleton: type.singleton,
      })),
    );
  }
  
  save() {
    const state: AudioSystemState = {
      devices: [...this.devices.values()].map(dev => dev.getState()),
      connections: [...this.connections.keys()].map(uuid => this.getConnectionState(uuid)),
    };
    janusz.setState("audioSystem", state);
  }
  
  load() {
    const state = janusz.getState<AudioSystemState>("audioSystem") || { devices: [], connections: [] };
    
    for(const device of state.devices) {
      if(!this.deviceTypes.has(device.name)) {
        AudioModule.error("Unknown device name: ", device.name);
        continue;
      }
      try {
        this.addDevice(device.name, device);
      } catch(e) {
        AudioModule.error(`Failed to load device ${device.name}:`, e);
      }
    }
    
    for(const connection of state.connections) {
      const from = this.devices.get(connection.from);
      const to = this.devices.get(connection.to);
      if(!from || !to) {
        AudioModule.error("Invalid connection: ", connection);
        continue;
      }
      this.connectDevices(from, to, connection.output, connection.input, connection.uuid);
    }
  }
  
  addDevice(deviceName: string, state?: packets.DeviceStateData) {
    const DeviceType = this.deviceTypes.get(deviceName);
    if(!DeviceType) throw new Error(`Unknown device type: ${deviceName}`);
    
    const device = new DeviceType(state);
    this.devices.set(device.uuid, device);
    device.audioModule = this;
    
    device.getUpdate(); // clear updates
    sendAll(packets.devicesUpdatePacket({ [device.uuid]: device.getState() }));
    device.onCreate();
    
    return device;
  }
  
  moveDevice(device: AudioDevice, posx: number, posy: number) {
    device.posx = posx;
    device.posy = posy;
    sendAll(packets.devicesUpdatePacket({
      [device.uuid]: { posx, posy },
    }));
  }
  
  removeDevice(uuid: string) {
    const device = this.devices.get(uuid);
    if(!device) throw new Error("Device does not exists");
    
    device.remove();
    this.devices.delete(uuid);
    
    for(const connection of [...device.connections.values()]) {
      this.removeConnection(connection.uuid);
    }
    
    sendAll(packets.devicesUpdatePacket({ [device.uuid]: null }));
    
    return device;
  }
  
  connectDevices(from: AudioDevice, to: AudioDevice, output: number, input: number, id: string = crypto.randomUUID()) {
    for(const con of this.connections.values()) {
      if(con.from === from && con.to === to && con.output === output && con.input === input) throw new Error("Connection already exists");
    }
    
    const connection: Connection = {
      uuid: id, from, to, output, input,
    };
    
    this.connections.set(connection.uuid, connection);
    from.connections.set(connection.uuid, connection);
    to.connections.set(connection.uuid, connection);
    
    sendAll(packets.connectionsUpdatePacket({
      [connection.uuid]: this.getConnectionState(connection.uuid),
    }));
    
    return connection;
  }
  
  removeConnection(uuid: string) {
    const connection = this.connections.get(uuid);
    if(!connection) throw new Error("Connection does not exists");
    
    this.connections.delete(uuid);
    connection.from.connections.delete(uuid);
    connection.to.connections.delete(uuid);
    
    sendAll(packets.connectionsUpdatePacket({
      [uuid]: null,
    }));
    
    return connection;
  }
  
  getConnectionState(uuid: string): packets.ConnectionStateData {
    const connection = this.connections.get(uuid);
    if(!connection) throw new Error("Connection does not exists");
    
    return {
      uuid: connection.uuid,
      from: connection.from.uuid,
      to: connection.to.uuid,
      output: connection.output,
      input: connection.input,
    };
  }
  
  onTick = () => {
    this.devices.forEach(device => device.refresh());
    this.devices.forEach(device => {
      try {
        device.tick();
      } catch(e) {
        AudioModule.error(`${device.deviceClass.deviceName} tick failed:`, e);
      }
    });
    
    const updates: Record<string, packets.DeviceUpdate> = {};
    
    for(const device of this.devices.values()) {
      const update = device.getUpdate();
      if(update) updates[device.uuid] = update;
    }
    
    if(Object.keys(updates).length > 0) {
      sendAll(packets.devicesUpdatePacket(updates));
    }
  };
  
  onVisualUpdate = () => {
    const updates: Record<string, packets.DeviceUpdate> = {};
    
    for(const device of this.devices.values()) {
      const update = device.getVisualUpdate();
      if(update) updates[device.uuid] = update;
    }
    
    if(Object.keys(updates).length > 0) {
      sendAll(packets.devicesUpdatePacket(updates));
    }
  };
}
