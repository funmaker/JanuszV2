import { BUFFER_SIZE, SAMPLE_RATE } from "../../index";
import AudioDevice from "../../AudioDevice";
import Label from "../../Interface/Label";
import { Dial } from "../../Interface/NumberInput";

function timeText(time) {
	if(time < 1) return Math.floor(time * 1000) + "ms";
	if(time < 10) return Math.floor(time * 100) / 100 + "s";
	if(time < 60) return Math.floor(time) + "s";
	if(time < 600) return Math.floor(time / 6) / 10 + "min";
	else return Math.floor(time / 60) + "min";
}

const time = 1000;

export default class Delay extends AudioDevice {
	static deviceName = `Delay`;
	static deviceNameGroup = "Basic";
	
	time = this.interface.add(new Dial("time", 0, 0, {
		min: BUFFER_SIZE / SAMPLE_RATE,
		max: 60 * 30,
		step: BUFFER_SIZE / SAMPLE_RATE,
		value: 5,
		logScale: -3,
		title: "Delay (secs)"
	}));
	label = this.interface.add(new Label("timeLabel", 3, 1, { text: timeText(this.time.value) }));
	
	bufferCount = Math.ceil(this.time.value * SAMPLE_RATE / BUFFER_SIZE);
	bufferPool = [...new Array(this.bufferCount)].map(() => Buffer.alloc(BUFFER_SIZE * 2));
	buffers = this.bufferPool.map(() => null);
	
	constructor(state) {
		super(1, 1, state);
		
		this.time.on("change", val => {
			this.label.text = timeText(val);
			
			const bufferCount = Math.ceil(this.time.value * SAMPLE_RATE / BUFFER_SIZE);
			if(bufferCount > this.bufferCount) {
				const diff = bufferCount - this.bufferCount;
				this.bufferPool.push(...[...new Array(diff)].map(() => Buffer.alloc(BUFFER_SIZE * 2)));
				this.buffers.push(...[...new Array(diff)].map(() => null));
			} else if(bufferCount < this.bufferCount) {
				for(let i = bufferCount; i < this.bufferCount; i++) {
					const buf = this.buffers.pop();
					if(!buf) this.bufferPool.pop();
				}
			}
			
			this.bufferCount = bufferCount;
		});
	}
	
	onTick() {
		this.outputs[0] = this.buffers.shift();
		if(this.outputs[0]) this.bufferPool.push(this.outputs[0]);
		
		const input = this.getInput(0);
		if(input) {
			const buffer = this.bufferPool.pop();
			input.copy(buffer);
			this.buffers.push(buffer);
		} else this.buffers.push(null);
	}
}
