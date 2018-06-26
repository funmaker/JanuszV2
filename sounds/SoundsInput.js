import AudioSingletonDevice from "../audio/AudioSingletonDevice";
import {PassThrough} from "stream";
import {mixDown} from "../audio/utils";

export default soundsModule => class SoundsInput extends AudioSingletonDevice {
	static deviceName = "Sounds";
	tracks = new Set();
	
	constructor(state) {
		super(0, 1, state);
	}
	
	playSound(buffer) {
		const stream = new PassThrough();
		this.tracks.add(stream);
		stream.end(buffer);
		stream.on('end', () => this.tracks.delete(stream));
	}
	
	stopSounds() {
		this.tracks.clear();
	}
	
	onTick() {
		this.outputs[0] = mixDown(this.outputBuffers[0], [...this.tracks.values()]);
	}
}
