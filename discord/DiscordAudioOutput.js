import AudioSingletonDevice from "../audio/AudioSingletonDevice";
import {PassThrough} from "stream";

export default discordModule => class DiscordAudioOutput extends AudioSingletonDevice {
	static deviceName = "Discord Output";
	stream = null;
	
	constructor(state) {
		super(1, 0, state);
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
			
			this.stream = new PassThrough();
			connection.playConvertedStream(this.stream);
		}
		
		const converted = Buffer.alloc(buffer.length * 2);
		for(let n = 0; n < buffer.length; n += 2) {
			buffer.copy(converted, n * 2, n, n + 2);
			buffer.copy(converted, n * 2 + 2, n, n + 2);
		}
		this.stream.write(converted);
	}
}
