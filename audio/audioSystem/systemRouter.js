import audioSystem from "./audioSystem";
import PromiseRouter from "express-promise-router";
import * as packets from "./packets";

const clients = new Set();
const sendAll = msg => clients.forEach(client => client.send(msg));

function handleMessage(msg, ws) {
	switch(msg.type) {
		case packets.types.DEVICE_MOVE:
			const device = audioSystem.devices.get(msg.uuid);
			if(!device) {
				console.error("Unknown device: ", msg.uuid)
				return
			}
			device.posx = msg.posx;
			device.posy = msg.posy;
			sendAll(packets.devicesUpdatePacket({
				[msg.uuid]: {posx: msg.posx, posy: msg.posy},
			}));
			break;
		
		case packets.types.DEVICE_CONNECT:
			let {from, to, output, input} = msg;
			
			from = audioSystem.devices.get(from);
			to = audioSystem.devices.get(to);
			
			let connection = audioSystem.connectDevices(from, to, output, input);
			
			sendAll(packets.connectionsUpdatePacket({
				[connection.uuid]: audioSystem.getConnectionState(connection.uuid),
			}));
			break;
		
		default:
			console.error("Unknown packet: " + msg.type, msg);
			break;
	}
}

export default function systemRouter(audioModule) {
	const router = PromiseRouter();
	
	router.ws('/', (ws, req) => {
		clients.add(ws);
		
		ws.on('close', (code, reason) => {
			clients.delete(ws);
		});
		ws.on('message', msg => {
			handleMessage(JSON.parse(msg), ws);
		});
		
		const devices = {};
		for(let device of audioSystem.devices.values()) {
			devices[device.uuid] = device.getState();
		}
		
		const connections = {};
		for(let uuid of audioSystem.connections.keys()) {
			connections[uuid] = audioSystem.getConnectionState(uuid);
		}
		
		ws.send(packets.initPacket(devices, connections));
	});
	
	return router;
}

