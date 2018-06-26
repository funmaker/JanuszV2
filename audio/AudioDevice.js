import uuid from "uuid/v4";
import {BUFFER_SIZE} from "./index";
import {mixDown} from "./utils";

export default class AudioDevice {
	static deviceName = "Generic Device";
	static devices = new Map();
	
	uuid = uuid();
	inputBuffers = [];
	outputBuffers = [];
	outputs = [];
	inputCount = 0;
	outputCount = 0;
 	posx = 0;
	posy = 0;
	connections = new Map();
	fresh = true;
	audioModule = null;
	
	constructor(inputs, outputs, state) {
		this.inputCount = inputs;
		this.outputCount = outputs;
		this.inputBuffers = [...new Array(this.inputBuffers)].map(() => Buffer.alloc(BUFFER_SIZE * 2));
		this.outputBuffers = [...new Array(this.outputCount)].map(() => Buffer.alloc(BUFFER_SIZE * 2));
		this.outputs = [...new Array(this.outputCount)].map(() => null);
		
		if(state) {
			this.uuid = state.uuid;
			this.posx = state.posx;
			this.posy = state.posy;
		}
		
		if(!this.constructor.hasOwnProperty("devices")) {
			this.constructor.devices = new Map();
		}
		this.constructor.devices.set(this.uuid, this);
	}
	
	remove() {
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
			activity: this.outputs.map(output => !!output),
			extra: this.getExtraState(),
		};
	}
	
	getExtraState() {
		return null;
	}
	
	getInput(id) {
		const buffers = [];
		for(let con of this.connections.values()) {
			if(con.to === this && con.input === id) {
				con.from.tick();
				buffers.push(con.from.outputs[con.output]);
			}
		}
		
		return mixDown(this.inputBuffers[id], buffers);
	}
	
	refresh() {
		this.fresh = true;
	}
	
	tick() {
		if(!this.fresh) return;
		this.fresh = false;
		this.onTick();
	}
	
	onTick() {
		// Implement This
	}
}
