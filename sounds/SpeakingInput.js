import AudioSingletonDevice from "../audio/AudioSingletonDevice";
import {BUFFER_SIZE} from "../audio";

export default soundsModule => class SpeakingInput extends AudioSingletonDevice {
	static deviceName = "Speaking";
	streams = [];
	
	constructor(state) {
		super(0, 1, state);
	}
	
	playStream(stream) {
		this.streams.push(stream);
		stream.on("end", () => this.streams.splice(this.streams.indexOf(stream), 1));
	}
	
	stopStreams() {
		this.streams.length = 0;
	}
	
	onTick() {
		if(this.streams.length > 0) {
			this.outputs[0] = this.streams[0].read(BUFFER_SIZE * 2);
		} else {
			this.outputs[0] = null;
		}
	}
}
