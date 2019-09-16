import AudioDevice from "../../AudioDevice";

export default class Mixer extends AudioDevice {
	static deviceName = "Mixer";
	static deviceNameGroup = "Basic";
	
	constructor(state) {
		super(1, 1, state);
	}
	
	onTick() {
		this.outputs[0] = this.getInput(0);
	}
}
