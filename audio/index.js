import JanuszModule from "../core/JanuszModule";
import fs from 'fs-extra';
import {janusz, rootDir} from "../index";
import * as packets from "./packets";
import uuid from "uuid/v4";
import audioRouter, {sendAll, clients} from './router';
import OscillatorInput from "./OscillatorInput";

export const SAMPLE_RATE = 48000;
export const BUFFER_SIZE = 4800;

export default class AudioModule extends JanuszModule {
	static ModuleName = "Audio".green.dim.bold;
	deviceTypes = new Map();
	devices = new Map();
	connections = new Map();
	
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
	}
	
	async stop() {
		await this.save();
		AudioModule.log("Closing " + clients.size + " clients");
		clients.forEach(client => client.close());
		this.deviceTypes.forEach(type => type.devices.forEach(dev => this.removeDevice(dev.uuid)));
		this.devices.forEach(dev => this.removeDevice(dev.uuid));
	}
	
	getAudioDevices() {
		return [OscillatorInput];
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
		janusz.setState("audioSystem", state);
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
				this.connectDevices(from, to, connection.input, connection.output, connection.uuid);
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
		
		sendAll(packets.devicesUpdatePacket({[device.uuid]: device.getState()}));
		
		return device;
	}
	
	removeDevice(uuid) {
		let device = this.devices.get(uuid);
		device.remove();
		this.devices.delete(uuid);
		
		for(let connection of device.connections.values()) {
			this.removeConnection(connection.uuid);
		}
		
		sendAll(packets.devicesUpdatePacket({[device.uuid]: null}));
	}
	
	connectDevices(from, to, output, input, id = uuid()) {
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
	}
}

