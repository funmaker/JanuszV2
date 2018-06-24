import JanuszModule from "../core/JanuszModule";
import fs from 'fs-extra';
import "colors";
import mumble from 'mumble';
import path from "path";
import {rootDir} from "../index";
import MumbleAudioOutput from "./MumbleAudioOutput";
import MumbleAudioInput from "./MumbleAudioInput";

export default class MumbleModule extends JanuszModule {
	static ModuleName = "Mumble".gray.bold;
	
	constructor(reloadedModule) {
		super();
		if(reloadedModule) {
			if(reloadedModule.client) {
				this.client = reloadedModule.client;
				reloadedModule.client = null;
			}
		}
	}
	
	async init() {
		this.cert = await fs.readFile(path.join(rootDir, "cert.pem"));
		this.key = await fs.readFile(path.join(rootDir, "key.pem"));
		if(!this.client)
			this.client = await new Promise((res, rej) => mumble.connect("mumble://miners.pl:64000", {cert: this.cert, key: this.key}, (err, con) => err ? rej(err) : res(con)));
	}
	
	async start() {
		if(!this.client.user){
			this.client.authenticate( 'JanuszV2' );
			await new Promise(res => this.client.on('initialized', res));
		}
	}
	
	getAudioDevices() {
		return [MumbleAudioOutput(this), MumbleAudioInput(this)];
	}
	
	async stop() {
		if(this.client) this.client.disconnect();
	}
}
