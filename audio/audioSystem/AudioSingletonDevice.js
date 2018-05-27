import AudioDevice from "./AudioDevice";

export default class AudioSingletonDevice extends AudioDevice {
	constructor(inputs, outputs) {
		super(inputs, outputs);
		if(this.constructor.hasOwnProperty("devices") && this.constructor.devices.size > 1) {
			this.remove();
			throw new Error("Singleton already initialized.");
		}
	}
}
