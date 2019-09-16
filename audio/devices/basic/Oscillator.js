import AudioDevice from "../../AudioDevice";
import Label from "../../Interface/Label";
import { Dial } from "../../Interface/NumberInput";
import { BUFFER_SIZE, SAMPLE_RATE } from "../../index";

const parseHz = hz => {
	if(hz < 1000) return Math.floor(hz) + "Hz";
	if(hz < 10000) return Math.floor(hz / 100) / 10 + "kHz";
	else return Math.floor(hz / 1000) + "kHz";
};

export default class Oscillator extends AudioDevice {
	static deviceName = "Oscillator";
	static deviceNameGroup = "Basic";
	
	freq = this.interface.add(new Dial("freq", 0, 0, { min: 0, max: 20000, value: 261.63, logScale: -1, title: "Frequency (Hz)" }));
	label = this.interface.add(new Label("freqLabel", 3, 1, { text: parseHz(this.freq.value) }));
	offset = 0;
	
	constructor(state) {
		super(0, 1, state);
		
		this.freq.on("change", val => this.label.text = parseHz(val));
	}
	
	onTick() {
		const buffer = this.outputBuffers[0];
		
		for(let n = 0; n < BUFFER_SIZE; n++) {
			buffer.writeInt16LE(Math.cos(this.offset + (n + 1) * Math.PI * 2 / SAMPLE_RATE * this.freq.value) * 32767, n * 2);
		}
		this.offset = this.offset + (BUFFER_SIZE / SAMPLE_RATE) * Math.PI * 2 * this.freq.value;
		
		this.outputs[0] = buffer;
	}
}
