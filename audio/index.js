import JanuszModule from "../core/JanuszModule";
import { janusz } from "../index";
import * as packets from "./packets";
import uuid from "uuid/v4";
import audioRouter, { sendAll } from './router';
import Oscillator from "./devices/Oscillator";
import Mixer from "./devices/Mixer";
import Delay from "./devices/Delay";
import Gain from "./devices/Gain";
import Switch from "./devices/Switch";

export const SAMPLE_RATE = 48000;
export const BUFFER_SIZE = 4800;
export const VISUAL_UPDATE_FREQ = 5;

export default class AudioModule extends JanuszModule {
	static ModuleName = "Audio".green.dim.bold;
	deviceTypes = new Map();
	devices = new Map();
	connections = new Map();
	tickInterval = null;
	visualInterval = null;
	
	async init() {
		const deviceTypes = janusz.flatMap(mod => mod.getAudioDevices);
		
		for(let Dt of deviceTypes) {
			this.deviceTypes.set(Dt.deviceName, Dt);
		}
		
		await this.load();
		
		sendAll(packets.initPacket(this));
		AudioModule.log(`Registered ${deviceTypes.length} audio devices.`);
	}
	
	async start() {
		this.tickInterval = setInterval(this.onTick, BUFFER_SIZE / SAMPLE_RATE * 1000 );
		this.visualInterval = setInterval(this.onVisualUpdate, 1000 / VISUAL_UPDATE_FREQ );
	}
	
	async stop() {
		clearInterval(this.tickInterval);
		clearInterval(this.visualInterval);
		await this.save();
		this.deviceTypes.forEach(type => type.devices.forEach(dev => this.removeDevice(dev.uuid)));
		this.devices.forEach(dev => this.removeDevice(dev.uuid));
	}
	
	getAudioDevices() {
		return [
			Oscillator, Mixer, Delay, Gain, Switch
		];
	}
	
	getRouter() {
		return audioRouter(this);
	}
	
	async onReloadOther() {
		await this.save();
		this.deviceTypes.forEach(type => type.devices.forEach(dev => this.removeDevice(dev.uuid)));
		this.devices.forEach(dev => this.removeDevice(dev.uuid));
		this.deviceTypes.clear();
		
		const deviceTypes = janusz.flatMap(mod => mod.getAudioDevices);
		
		for(let Dt of deviceTypes) {
			this.deviceTypes.set(Dt.deviceName, Dt);
		}
		
		await this.load();
	}
	
	async save() {
		const state = {
			devices: [...this.devices.values()].map(dev => dev.getState()),
			connections: [...this.connections.keys()].map(uuid => this.getConnectionState(uuid)),
		};
		await janusz.setState("audioSystem", state);
	}
	
	async load() {
		try {
			const state = janusz.getState("audioSystem") || {devices: [], connections: []};
			
			for(let device of state.devices) {
				if(!this.deviceTypes.has(device.name)) {
					AudioModule.error("Unknown device name: ", device.name);
					continue;
				}
				this.addDevice(device.name, device);
			}
			
			for(let connection of state.connections) {
				if(!this.devices.has(connection.from) || !this.devices.has(connection.to)) {
					AudioModule.error("Invalid connection: ", connection);
					continue;
				}
				const from = this.devices.get(connection.from);
				const to = this.devices.get(connection.to);
				if(!from) {
					AudioModule.error("Unknown device: ", connection.from);
					continue;
				}
				if(!to) {
					AudioModule.error("Unknown device: ", connection.to);
					continue;
				}
				this.connectDevices(from, to, connection.output, connection.input, connection.uuid);
			}
		} catch(e) {
			AudioModule.error("Failed to load state.");
			AudioModule.error(e);
		}
	}
	
	addDevice(deviceName, state) {
		let device = new (this.deviceTypes.get(deviceName))(state);
		this.devices.set(device.uuid, device);
		device.audioModule = this;
		
		device.getUpdate(); // clear updates
		sendAll(packets.devicesUpdatePacket({[device.uuid]: device.getState()}));
		
		return device;
	}
	
	removeDevice(uuid) {
		let device = this.devices.get(uuid);
		if(!device) throw new Error("Device does not exists");
		
		device.remove();
		this.devices.delete(uuid);
		
		for(let connection of device.connections.values()) {
			this.removeConnection(connection.uuid);
		}
		
		sendAll(packets.devicesUpdatePacket({[device.uuid]: null}));
		
		return device;
	}
	
	connectDevices(from, to, output, input, id = uuid()) {
		for(const con of this.connections) {
			if(con.from === from && con.to === to && con.output === output && con.input === input) throw new Error("Connection already exists");
		}
		
		let connection = {
			uuid: id, from, to, output, input,
		};
		
		this.connections.set(connection.uuid, connection);
		from.connections.set(connection.uuid, connection);
		to.connections.set(connection.uuid, connection);
		
		sendAll(packets.connectionsUpdatePacket({
			[connection.uuid]: this.getConnectionState(connection.uuid),
		}));
		
		return connection;
	}
	
	removeConnection(uuid) {
		let connection = this.connections.get(uuid);
		if(!connection) throw new Error("Connection does not exists");
		
		this.connections.delete(uuid);
		connection.from.connections.delete(uuid);
		connection.to.connections.delete(uuid);
		
		sendAll(packets.connectionsUpdatePacket({
			[uuid]: null,
		}));
		
		return connection;
	}
	
	getConnectionState(uuid) {
		let connection = this.connections.get(uuid);
		return {
			uuid: connection.uuid,
			from: connection.from.uuid,
			to: connection.to.uuid,
			output: connection.output,
			input: connection.input,
		};
	}
	
	onTick = () => {
		this.devices.forEach(device => device.refresh());
		this.devices.forEach(device => device.tick());
		
		const updates = {};
		
		for(const device of this.devices.values()) {
			const update = device.getUpdate();
			if(update) updates[device.uuid] = update;
		}
		
		if(Object.keys(updates).length > 0) {
			sendAll(packets.devicesUpdatePacket(updates));
		}
	};
	
	onVisualUpdate = () => {
		const updates = {};
		
		for(const device of this.devices.values()) {
			const update = device.getVisualUpdate();
			if(update) updates[device.uuid] = update;
		}
		
		if(Object.keys(updates).length > 0) {
			sendAll(packets.devicesUpdatePacket(updates));
		}
	};
}

