import AudioSingletonDevice from "../audio/AudioSingletonDevice";
import {mixDown} from "../audio/utils";

export default mumbleModule => class MumbleAudioInput extends AudioSingletonDevice {
	static deviceName = "Mumble Input";
	streams = new Map();
	
	constructor(state) {
		super(0, 1, state);
	}
	
	addStream(id, stream) {
		if(!this.streams.has(id)) this.streams.set(id, stream);
	}
	
	onTick() {
		this.outputs[0] = mixDown(this.outputBuffers[0], [...this.streams.values()]);
	}
}
