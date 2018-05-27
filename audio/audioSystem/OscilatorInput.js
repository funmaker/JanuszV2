import AudioDevice from "./AudioDevice";

export default class OscilatorInput extends AudioDevice {
	static deviceName = "Oscilator";
	
	constructor() {
		super(0, 1);
	}
	
}
