import JanuszModule from "../core/JanuszModule";
import Discord from 'discord.js';
import "colors";
import {janusz} from "../index";
import AudioModule from "../audio";
import discordRouter from "./router";
import DiscordAudioOutput from "./DiscordAudioOutput";
import DiscordAudioInput from "./DiscordAudioInput";

export default class DiscordModule extends JanuszModule {
	static ModuleName = "Discord".blue.bold;
	
	constructor(reloadedModule) {
		super();
		if(reloadedModule) {
			this.client = reloadedModule.client;
			reloadedModule.client = null;
		}
	}
	
	async init() {
		if(!this.client) this.client = new Discord.Client();
		else {
			this.client.removeAllListeners();
		}
		
		this.client.on('ready', () => {
		
		});
		
		this.client.on('message', async message => {
			const cmd = message.content.split(" ");
			switch(cmd[0]) {
				case "!join":
					let channel = message.guild.channels.find(channel => channel.name.toLowerCase().includes(cmd[1].toLowerCase()));
					if(!channel) break;
					await channel.join();
					break;
				case "!sounds":
					let sounds = janusz.getModule(AudioModule).allSounds.map(sound => sound.filename).join("\n");
					for(let chunk of Discord.splitMessage(sounds)) {
						message.reply(chunk);
					}
					break;
				case "!play":
					let sound = janusz.getModule(AudioModule).allSounds.find(sound => sound.type === "sound" && sound.filename.toLowerCase().includes(cmd[1].toLowerCase()));
					if(sound) {
						this.playSound(sound)
					} else {
						message.reply("Co?")
					}
					break;
			}
		});
	}
	
	async start() {
		if(!this.client.uptime) {
			await this.client.login(janusz.getConfig("discord").token);
		}
	}
	
	async stop() {
		if(this.client) await this.client.destroy();
	}
	
	getRouter() {
		return discordRouter(this);
	}
	
	getAudioDevices() {
		return [DiscordAudioOutput(this), DiscordAudioInput(this)];
	}
	
	playSound(sound) {
		for(let connection of this.client.voiceConnections.values()) {
			connection.playFile(sound.path);
		}
		DiscordModule.log(`Playing ${sound.filename}`);
	}
}
