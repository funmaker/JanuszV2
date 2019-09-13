import AudioDevice from "../AudioDevice";
import Button from "../Interface/Button";

export default class Switch extends AudioDevice {
  static deviceName = "Switch";
  static deviceNameGroup = "Basic";
  
  toggle = this.interface.add(new Button("dB", 1.5, 1, { toggle: true, size: 3, icon: "shuffle" }));
  
  constructor(state) {
    super(2, 2, state);
  }
  
  onTick() {
    if(this.toggle.value) {
      this.outputs[0] = this.getInput(1);
      this.outputs[1] = this.getInput(0);
    } else {
      this.outputs[0] = this.getInput(0);
      this.outputs[1] = this.getInput(1);
    }
  }
}
