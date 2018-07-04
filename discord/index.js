import JanuszModule from "../core/JanuszModule";
import Discord from 'discord.js';
import "colors";
import {janusz} from "../index";
import discordRouter from "./router";
import DiscordAudioOutput from "./DiscordAudioOutput";
import DiscordAudioInput from "./DiscordAudioInput";

export default class DiscordModule extends JanuszModule {
	static ModuleName = "Discord".blue.bold;
	OutputDevice = DiscordAudioOutput(this);
	InputDevice = DiscordAudioInput(this);
	
	constructor(reloadedModule) {
		super();
		if(reloadedModule) {
			this.client = reloadedModule.client;
			this.client.off('message', reloadedModule.handleMessage);
			this.client.off('error', reloadedModule.handleError);
			reloadedModule.client = null;
		}
	}
	
	async init() {
		if(!this.client) this.client = new Discord.Client();
		
		this.client.on('message', this.handleMessage);
		this.client.on('error', this.handleError);
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
		return [this.OutputDevice, this.InputDevice];
	}
	
	handleMessage = async message => {
	
	};
	
	handleError = error => DiscordModule.error(error);
}
