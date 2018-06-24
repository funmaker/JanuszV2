import AudioSingletonDevice from "../audio/AudioSingletonDevice";

export default mumbleModule => class MumbleAudioInput extends AudioSingletonDevice {
	static deviceName = "Mumble Input";
	stream = null;
	
	constructor(state) {
		super(0, 1, state);
	}
	
	onTick() {
		if(!this.stream) {
			if(!mumbleModule.client.ready) {
				this.setOutput(0, null);
				return;
			}
			this.stream = mumbleModule.client.connection.outputStream(true);
			this.stream.on("close", () => this.stream = null);
		}
		
		const output = this.getOutput(0);
		const buffer = this.stream.read(output.length);
		if(!buffer) {
			this.setOutput(0, null);
			return;
		}
		
		buffer.copy(output);
		if(buffer.length < output.length) {
			output.fill(0, output.length);
		}
	}
}
