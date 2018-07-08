import PromiseRouter from "express-promise-router";
import * as packets from "./packets";
import {validateReq} from "../web/server/helpers/requireLogin";

export const clients = new Set();
export const sendAll = msg => clients.forEach(client => client.send(msg, err => err && client.close()));

export default function audioRouter(audioModule) {
	const router = PromiseRouter();
	
	async function handleMessage(msg, ws) {
		switch(msg.type) {
			case packets.types.DEVICE_ADD: {
				if(!audioModule.deviceTypes.get(msg.deviceName)) throw Error(`Unknown device type: ${msg.deviceName}`);
				
				audioModule.addDevice(msg.deviceName);
				
				await audioModule.save();
				break;
			}
			case packets.types.DEVICE_REMOVE: {
				if(!audioModule.devices.get(msg.uuid)) throw Error(`Unknown device: ${msg.uuid}`);
				
				audioModule.removeDevice(msg.uuid);
				
				await audioModule.save();
				break;
			}
			
			case packets.types.DEVICE_MOVE: {
				const device = audioModule.devices.get(msg.uuid);
				if(!device) throw Error(`Unknown device: ${msg.uuid}`);
				
				device.posx = msg.posx;
				device.posy = msg.posy;
				sendAll(packets.devicesUpdatePacket({
					[msg.uuid]: {posx: msg.posx, posy: msg.posy},
				}));
				await audioModule.save();
				break;
			}
			
			case packets.types.DEVICE_CONNECT: {
				const {from: fromUUID, to: toUUID, output, input} = msg;
				
				const from = audioModule.devices.get(fromUUID);
				const to = audioModule.devices.get(toUUID);
				if(!from) throw Error(`Unknown device: ${fromUUID}`);
				if(!to) throw Error(`Unknown device: ${toUUID}`);
				
				audioModule.connectDevices(from, to, output, input);
				await audioModule.save();
				break;
			}
			
			case packets.types.DEVICE_DISCONNECT: {
				let {uuid} = msg;
				
				const connection = audioModule.connections.get(uuid);
				if(!connection) throw Error(`Unknown connection: ${uuid}`);
				
				audioModule.removeConnection(uuid);
				await audioModule.save();
				break;
			}
			
			default:
				console.error("Unknown packet: " + msg.type, msg);
				break;
		}
	}
	
	router.ws('/', (ws, req) => {
		if(!validateReq(req)) {
			ws.close();
			return;
		}
		
		clients.add(ws);
		
		ws.on('error', (err) => {
			console.error(err);
			clients.delete(ws);
			ws.close();
		});
		ws.on('close', (code, reason) => {
			clients.delete(ws);
		});
		ws.on('message', async msg => {
			try {
				await handleMessage(JSON.parse(msg), ws);
			} catch(e) {
				console.error(e);
				ws.close();
			}
		});
		
		ws.send(packets.initPacket(audioModule));
	});
	
	return router;
}

