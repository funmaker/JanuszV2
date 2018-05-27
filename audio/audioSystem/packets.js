export const types = {
	INIT: 0,
	DEVICES_UPDATE: 1,
	DEVICE_MOVE: 2,
	DEVICE_CONNECT: 3,
	DEVICE_DISCONNECT: 4,
	
	CONNECTIONS_UPDATE: 5,
};

export const initPacket = (devices, connections) => JSON.stringify({
	type: types.INIT,
	devices, connections,
});

export const devicesUpdatePacket = (devices) => JSON.stringify({
	type: types.DEVICES_UPDATE,
	devices,
});

export const deviceMovePacket = (uuid, posx, posy) => JSON.stringify({
	type: types.DEVICE_MOVE,
	uuid, posx, posy,
});

export const deviceConnectPacket = (from, to, output, input) => JSON.stringify({
	type: types.DEVICE_CONNECT,
	from, to, output, input,
});

export const connectionsUpdatePacket = (connections) => JSON.stringify({
	type: types.CONNECTIONS_UPDATE,
	connections,
});
