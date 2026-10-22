import AudioDevice from "./AudioDevice";
import type { DeviceStateData } from "./packets";

export default class AudioSingletonDevice extends AudioDevice {
  static singleton = true;
  
  constructor(inputs: number, outputs: number, state?: DeviceStateData) {
    super(inputs, outputs, state);
    if(this.deviceClass.devices.size > 1) {
      this.remove();
      throw new Error("Singleton already initialized.");
    }
  }
}
