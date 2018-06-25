import AudioSingletonDevice from "../audio/AudioSingletonDevice";
import {PassThrough} from "stream";

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
		if(this.tracks.size === 0) {
			this.setOutput(0, null);
			return
		}
		
		const output = this.getOutput(0);
		output.fill(0);
		
		for(let track of this.tracks.values()) {
			const buffer = track.read(output.length);
			if(buffer === null) continue;
			
			for(let n = 0; n < buffer.length; n += 2) {
				const a = buffer.readInt16LE(n);
				const b = output.readInt16LE(n);
				let val = a + b - a * b * Math.sign(a) / 32767;
				if(val < -32768) val = -32768;
				if(val > 32767) val = 32767;
				output.writeInt16LE(val, n);
			}
		}
	}
}
