import AudioDevice from "../../AudioDevice";
import type { DeviceStateData } from "../../packets";

export default class Mixer extends AudioDevice {
  static deviceName = "Mixer";
  static deviceNameGroup = "Basic";
  
  constructor(state?: DeviceStateData) {
    super(1, 1, state);
  }
  
  onTick() {
    this.outputs[0] = this.getInput(0);
  }
}
