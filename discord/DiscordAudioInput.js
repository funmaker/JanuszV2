import AudioSingletonDevice from "../audio/AudioSingletonDevice";

export default discordModule => class DiscordAudioInput extends AudioSingletonDevice {
	static deviceName = "Discord Input";
	connection = null;
	receiver = null;
	streams = new Map();
	
	constructor(state) {
		super(0, 1, state);
	}
	
	addStream = (user, speaking) => {
		if(speaking) {
			const stream = this.receiver.createPCMStream(user);
			this.streams.set(user.uuid, stream);
		} else {
			this.streams.delete(user.uuid);
		}
	};
	
	onTick() {
		if(!this.receiver) {
			if(!discordModule.client || discordModule.client.voiceConnections.size === 0) {
				this.setOutput(0, null);
				return
			}
			
			this.connection = discordModule.client.voiceConnections.first();
			if(!this.connection.sockets.udp || !this.connection.sockets.udp.socket) {
				this.setOutput(0, null);
				return
			}
			this.receiver = this.connection.createReceiver();
			this.connection.on("speaking", this.addStream);
			this.connection.on('disconnect', () => {
				this.connection = null;
				this.receiver = null;
			})
		}
		
		if(this.streams.size === 0) {
			this.setOutput(0, null);
			return
		}
		
		const output = this.getOutput(0);
		output.fill(0);
		
		for(let stream of this.streams.values()) {
			const buffer = stream.read(output.length * 2);
			if(buffer === null) continue;
			
			for(let n = 0; n < buffer.length / 2; n += 2) {
				const a = buffer.readInt16LE(n * 2);
				const b = output.readInt16LE(n);
				let val = a + b - a * b * Math.sign(a) / 32767;
				if(val < -32768) val = -32768;
				if(val > 32767) val = 32767;
				output.writeInt16LE(val, n);
			}
		}
	}
}
