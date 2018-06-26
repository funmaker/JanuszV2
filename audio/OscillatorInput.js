import AudioDevice from "../audio/AudioDevice";

export default class OscillatorInput extends AudioDevice {
	static deviceName = "Oscillator";
	
	counter = 0;
	
	constructor(state) {
		super(0, 1, state);
	}
	
	onTick() {
		const buffer = this.outputBuffers[0];
		
		for(let n = 0; n < buffer.length / 2; n++) {
			buffer.writeInt16LE(Math.cos(this.counter * Math.PI / 48000 * 120) * 16000, n * 2);
			this.counter++;
		}
		
		this.outputs[0] = buffer;
	}
}
