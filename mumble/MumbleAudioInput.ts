import type { Readable } from "stream";
import AudioSingletonDevice from "../audio/AudioSingletonDevice";
import { mixDown } from "../audio/utils";
import type { DeviceStateData } from "../audio/packets";
import type MumbleModule from "./index";

export default (mumbleModule: MumbleModule) => class MumbleAudioInput extends AudioSingletonDevice {
  static deviceName = "Mumble Input";
  static deviceNameGroup = "Mumble";
  
  streams = new Map<number, Readable>();
  
  constructor(state?: DeviceStateData) {
    super(0, 1, state);
  }
  
  addStream(session: number) {
    const connection = mumbleModule.client?.connection;
    if(connection && !this.streams.has(session)) this.streams.set(session, connection.outputStream(session, true));
  }
  
  onTick() {
    this.outputs[0] = mixDown(this.outputBuffers[0], [...this.streams.values()]);
  }
};
