import AudioSingletonDevice from "../audio/AudioSingletonDevice";
import {mixDown, StereoToMonoStream} from "../audio/utils";

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
			const mono = new StereoToMonoStream();
			stream.pipe(mono);
			this.streams.set(user.uuid, mono);
		} else {
			this.streams.delete(user.uuid);
		}
	};
	
	onRemove() {
		if(this.receiver) this.receiver.destroy();
	}
	
	onTick() {
		if(!this.receiver) {
			if(!discordModule.client || discordModule.client.voiceConnections.size === 0) {
				this.outputs[0] = null;
				return
			}
			
			const connection = discordModule.client.voiceConnections.first();
			if(!connection.sockets.udp || !connection.sockets.udp.socket) {
				this.outputs[0] = null;
				return
			}
			this.receiver = connection.createReceiver();
			connection.on("speaking", this.addStream);
			connection.on('disconnect', () => {
				this.receiver = null;
			})
		}
		
		if(this.streams.size === 0) {
			this.outputs[0] = null;
			return
		}
		
		this.outputs[0] = mixDown(this.outputBuffers[0], [...this.streams.values()]);
	}
}
