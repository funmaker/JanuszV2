import uuid from "uuid/v4";
import {BUFFER_SIZE} from "./index";

export default class AudioDevice {
	static deviceName = "Generic Device";
	static devices = new Map();
	
	uuid = uuid();
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
			activity: this.getActivity(),
			extra: this.getExtraState(),
		};
	}
	
	getActivity() {
		return this.outputs.map(output => !!output);
	}
	
	getExtraState() {
		return null;
	}
	
	getOutput(id) {
		if(!this.outputs[id]) this.outputs[id] = Buffer.alloc(BUFFER_SIZE * 2);
		return this.outputs[id]
	}
	
	setOutput(id, buffer) {
		this.outputs[id] = buffer;
	}
	
	getInput(id) {
		const buffers = [];
		for(let con of this.connections.values()) {
			if(con.to === this && con.input === id) {
				con.from.tick();
				if(con.from.outputs[con.output]) {
					buffers.push(con.from.outputs[con.output]);
				}
			}
		}
		
		if(buffers.length === 0) {
			return null;
		} else if(buffers.length === 1) {
			return buffers[0];
		} else {
			const buffer = Buffer.from(buffers[0]);
			
			for(let buf of buffers.slice(1)) {
				for(let n = 0; n < BUFFER_SIZE; n++) {
					const a = buffer.readInt16LE(n * 2);
					const b = buf.readInt16LE(n * 2);
					let val = a + b - a * b * Math.sign(a) / 32767;
					if(val < -32768) val = -32768;
					if(val > 32767) val = 32767;
					buffer.writeInt16LE(val, n * 2);
				}
			}
			
			return buffer;
		}
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
