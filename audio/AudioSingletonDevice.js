import AudioDevice from "./AudioDevice";

export default class AudioSingletonDevice extends AudioDevice {
	static singleton = true;
	
	constructor(inputs, outputs, state) {
		super(inputs, outputs, state);
		if(this.constructor.hasOwnProperty("devices") && this.constructor.devices.size > 1) {
			this.remove();
			throw new Error("Singleton already initialized.");
		}
	}
}
