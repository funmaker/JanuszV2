import {mixDown, StereoToMonoStream} from "../audio/utils";
import AudioDevice from "../audio/AudioDevice";
import Dropdown from "../audio/Interface/Dropdown";
import Indicator from "../audio/Interface/Indicator";

export default discordModule => class DiscordAudioInput extends AudioDevice {
	static deviceName = "Discord Input";
	static deviceNameGroup = "Discord";
	
	connection = null;
	receiver = null;
	streams = new Set();
	guildSelect = this.interface.add(new Dropdown("guildSelect", 0, 0.33, { options: this.getOptions(), size: 8, selection: true, defaultText: "Select Guild" }));
	indicator = this.interface.add(new Indicator("indicator", 3.5, 1.66, { color: "disabled" }));
	
	constructor(state) {
		super(0, 1, state);
		this.interface.width = 8;
	}
	
	onRemove() {
		if(this.receiver) this.receiver.destroy();
	}
	
	addStream = (user, speaking) => {
		if(speaking) {
			const stream = this.receiver.createPCMStream(user);
			const mono = new StereoToMonoStream();
			stream.pipe(mono);
			this.streams.add(mono);
			stream.on("end", () => this.streams.delete(mono));
			stream.on("close", () => this.streams.delete(mono));
		}
	};
	
	getOptions() {
		if(!discordModule.client) return [];
		return discordModule.client.guilds.map(guild => ({ text: guild.name, value: guild.id }));
	}
	
	onTick() {
		if(this.receiver && this.receiver.voiceConnection.channel.guild.id !== this.guildSelect.value) {
			this.receiver.destroy();
			this.outputs[0] = null;
			return;
		}
		
		if(!this.receiver) {
			const guild = discordModule.client && discordModule.client.guilds.get(this.guildSelect.value);
			if(!guild || !guild.voiceConnection || !guild.voiceConnection.sockets.udp || !guild.voiceConnection.sockets.udp.socket) {
				this.outputs[0] = null;
				return
			}
			
			this.receiver = guild.voiceConnection.createReceiver();
			this.indicator.color = "inputOff";
			guild.voiceConnection.on("speaking", this.addStream);
			guild.voiceConnection.on('disconnect', () => {
				this.receiver = null;
				this.streams.forEach(stream => stream.destroy());
				this.indicator.color = "disabled";
			})
		}
		
		if(this.streams.size === 0) {
			this.outputs[0] = null;
			this.indicator.color = "inputOff";
		} else {
			this.indicator.color = "inputOn";
			this.outputs[0] = mixDown(this.outputBuffers[0], [...this.streams.values()]);
		}
	}
}
