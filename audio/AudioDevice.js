import uuid from "uuid/v4";
import {BUFFER_SIZE} from "./index";
import {mixDown} from "./utils";

export default class AudioDevice {
	static deviceName = "Generic Device";
	static devices = new Map();
	
	uuid = uuid();
	inputCount = 0;
	inputBuffers = [];
	outputCount = 0;
	outputBuffers = [];
	outputActivity = [];
	outputLastActivity = [];
	outputs = [];
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
		this.outputActivity = [...new Array(this.outputCount)].map(() => false);
		this.outputLastActivity = [...new Array(this.outputCount)].map(() => false);
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
		this.onRemove();
	}
	
	getState() {
		return {
			name: this.constructor.deviceName,
			uuid: this.uuid,
			posx: this.posx,
			posy: this.posy,
			inputs: this.inputCount,
			inputActivity: [...new Array(this.inputCount)].map(() => false), // Calculated on client side
			outputs: this.outputCount,
			outputActivity: this.outputLastActivity,
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
		for(let i in this.outputs) {
			if(!this.outputs.hasOwnProperty(i)) continue;
			this.outputs[i] = null;
		}
		
		this.fresh = true;
	}
	
	tick() {
		if(!this.fresh) return;
		this.fresh = false;
		this.onTick();
		
		for(let i in this.outputs) {
			if(!this.outputs.hasOwnProperty(i)) continue;
			if(this.outputs[i]) {
				this.outputActivity[i] = true;
			}
		}
	}
	
	updateVisuals() {
		const update = this.outputActivity.map(() => null);
		
		for(let i in this.outputs) {
			if(this.outputActivity[i] && !this.outputLastActivity[i]) update[i] = true;
			else if(!this.outputActivity[i] && this.outputLastActivity[i]) update[i] = false;
		}
		
		this.outputLastActivity = this.outputActivity;
		this.outputActivity = this.outputActivity.map(() => false);
		
		if(update.some(out => out !== null)) {
			return update;
		} else {
			return null;
		}
	};
	
	onRemove() {
		// Implement This
	}
	
	onTick() {
		// Implement This
	}
}
