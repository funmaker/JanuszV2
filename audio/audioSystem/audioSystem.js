import EventEmitter from 'events';
import uuid from 'uuid/v4';

export default new class AudioSystem extends EventEmitter {
	deviceTypes = new Set();
	devices = new Map();
	connections = new Map();
	
	registerDeviceTypes(deviceTypes) {
		this.deviceTypes = new Set(deviceTypes);
		this.devices.clear();
		for(let deviceType of deviceTypes) {
			new deviceType(0, 0);
		}
	}
	
	removeDevice(device) {
		this.devices.delete(device.uuid);
		for(let connection of device.connections.values()) {
			this.connections.delete(connection.uuid);
			connection.from.connections.delete(connection.uuid);
			connection.to.connections.delete(connection.uuid);
		}
	}
	
	connectDevices(from, to, output, input) {
		let connection = {
			uuid: uuid(),
			from, to, output, input,
		};
		this.connections.set(connection.uuid, connection);
		from.connections.set(connection.uuid, connection);
		to.connections.set(connection.uuid, connection);
		
		return connection;
	}
	
	disconnectDevices(uuid) {
		let connection = this.connections.get(uuid);
		this.connections.delete(uuid);
		connection.from.connections.delete(uuid);
		connection.to.connections.delete(uuid);
		
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
};

