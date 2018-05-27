import uuid from "uuid/v4";
import audioSystem from "./audioSystem";

export default class AudioDevice {
	static deviceName = "Generic Device";
	static devices = new Map();
	
	uuid = uuid();
	inputCount = 0;
	outputCount = 0;
	posx = 0;
	posy = 0;
	connections = new Map();
	
	constructor(inputs, outputs) {
		this.inputCount = inputs;
		this.outputCount = outputs;
		
		if(!this.constructor.hasOwnProperty("devices")) {
			this.constructor.devices = new Map();
		}
		audioSystem.devices.set(this.uuid, this);
		this.constructor.devices.set(this.uuid, this);
	}
	
	remove() {
		audioSystem.removeDevice(this);
		this.constructor.devices.delete(this.uuid);
	}
	
	getState() {
		return {
			name: this.constructor.deviceName,
			uuid: this.uuid,
			posx: this.posx,
			posy: this.posy,
			inputs: this.inputCount,
			outputs: this.outputCount,
			extra: this.getExtraState(),
		};
	}
	
	getExtraState() {
		return null;
	}
}
