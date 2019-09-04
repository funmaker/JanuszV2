import AudioSingletonDevice from "../audio/AudioSingletonDevice";
import {PassThrough} from "stream";
import {BUFFER_SIZE} from "../audio";

export default discordModule => class DiscordAudioOutput extends AudioSingletonDevice {
	static deviceName = "Discord Output";
	static deviceNameGroup = "Discord";
	
	dispatcher = null;
	outBuffer = Buffer.alloc(BUFFER_SIZE * 4);
	
	constructor(state) {
		super(1, 0, state);
		this.outBuffer.fill(0);
	}
	
	onRemove() {
		if(this.dispatcher) {
			this.dispatcher.end();
			this.dispatcher = null;
		}
	}
	
	onTick() {
		if(!this.dispatcher || this.dispatcher.destroyed) {
			if(discordModule.client && discordModule.client.voiceConnections.size === 0) return;
			const connection = discordModule.client.voiceConnections.first();
			if(connection.status !== 0) return;
			
			this.dispatcher = connection.playConvertedStream(new PassThrough());
			this.dispatcher.on("end", () => {
				this.dispatcher = null;
			});
			this.dispatcher.on("error", err => discordModule.constructor.error(err));
			this.dispatcher.on("debug", err => discordModule.constructor.log(err));
		}
		
		const buffer = this.getInput(0);
		
		if(!buffer) {
			if(!this.dispatcher.paused && this.dispatcher.stream.readableLength === 0) this.dispatcher.pause();
			return;
		}
		if(this.dispatcher.paused) this.dispatcher.resume();
		
		for(let n = 0; n < buffer.length; n += 2) {
			buffer.copy(this.outBuffer, n * 2, n, n + 2);
			buffer.copy(this.outBuffer, n * 2 + 2, n, n + 2);
		}
		
		if(buffer.length < this.outBuffer.length / 2) {
			this.outBuffer.fill(0, buffer.length * 2);
		}
		
		this.dispatcher.stream.write(Buffer.from(this.outBuffer));
	}
}
