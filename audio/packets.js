
export const types = {
	INIT: 0,
	DEVICES_UPDATE: 1,
	DEVICES_ACTIVITY_UPDATE: 8,
	DEVICE_ADD: 2,
	DEVICE_REMOVE: 3,
	DEVICE_MOVE: 4,
	DEVICE_CONNECT: 5,
	DEVICE_DISCONNECT: 6,
	
	CONNECTIONS_UPDATE: 7,
};

const typeids = Object.values(types);
if(new Set(typeids).size !== typeids.length) throw Error("Duplicate Packet IDs detected! Check packets.js");

const reduceToObject = arr => arr.reduce((acc, obj) => ({...acc, [obj.uuid]: obj}), {});

////////////
// SERVER //
////////////

export const initPacket = (audioSystem) => JSON.stringify({
	type: types.INIT,
	devices: reduceToObject([...audioSystem.devices.values()].map(dev => dev.getState())),
	connections: reduceToObject([...audioSystem.connections.keys()].map(uuid => audioSystem.getConnectionState(uuid))),
	types: [...audioSystem.deviceTypes.values()].map(type => ({
		deviceName: type.deviceName,
		singleton: !!type.singleton,
	})),
});

export const devicesUpdatePacket = (devices) => JSON.stringify({
	type: types.DEVICES_UPDATE,
	devices,
});

export const connectionsUpdatePacket = (connections) => JSON.stringify({
	type: types.CONNECTIONS_UPDATE,
	connections,
});

export const devicesActivityUpdatePacket = (devices) => JSON.stringify({
	type: types.DEVICES_ACTIVITY_UPDATE,
	devices,
});

////////////
// CLIENT //
////////////

export const deviceAddPacket = (deviceName) => JSON.stringify({
	type: types.DEVICE_ADD,
	deviceName,
});

export const deviceRemovePacket = (uuid) => JSON.stringify({
	type: types.DEVICE_REMOVE,
	uuid,
});

export const deviceMovePacket = (uuid, posx, posy) => JSON.stringify({
	type: types.DEVICE_MOVE,
	uuid, posx, posy,
});

export const deviceConnectPacket = (from, to, output, input) => JSON.stringify({
	type: types.DEVICE_CONNECT,
	from, to, output, input,
});

export const deviceDisconnectPacket = (uuid) => JSON.stringify({
	type: types.DEVICE_DISCONNECT,
	uuid,
});
