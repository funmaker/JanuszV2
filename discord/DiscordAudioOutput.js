import AudioSingletonDevice from "../audio/AudioSingletonDevice";
import {PassThrough} from "stream";
import {BUFFER_SIZE} from "../audio";

export default discordModule => class DiscordAudioOutput extends AudioSingletonDevice {
	static deviceName = "Discord Output";
	stream = null;
	outBuffer = Buffer.alloc(BUFFER_SIZE * 4);
	
	constructor(state) {
		super(1, 0, state);
		this.outBuffer.fill(0);
	}
	
	onTick() {
		const buffer = this.getInput(0);
		
		if(!buffer) {
			if(this.stream) {
				this.stream.end();
				this.stream = null;
			}
			return;
		}
		
		if(!this.stream) {
			if(discordModule.client && discordModule.client.voiceConnections.size === 0) return;
			const connection = discordModule.client.voiceConnections.first();
			if(connection.status !== 0) return;
			
			this.stream = new PassThrough();
			connection.playConvertedStream(this.stream);
		}
		
		for(let n = 0; n < buffer.length; n += 2) {
			buffer.copy(this.outBuffer, n * 2, n, n + 2);
			buffer.copy(this.outBuffer, n * 2 + 2, n, n + 2);
		}
		
		if(buffer.length < this.outBuffer.length / 2) {
			this.outBuffer.fill(0, buffer.length * 2);
		}
		
		this.stream.write(Buffer.from(this.outBuffer));
	}
}
