import type { WebSocket } from "ws";
import type { WebsocketHandler } from "../web/websockets";
import { ClientPacket, PacketType } from "./packets";
import type AudioModule from "./index";

export const clients = new Set<WebSocket>();
export const sendAll = (msg: string) => clients.forEach(client => client.send(msg, err => err && client.close()));

export default function audioWebsocket(audioModule: AudioModule): WebsocketHandler {
  async function handleMessage(msg: ClientPacket) {
    switch(msg.type) {
      case PacketType.DEVICE_ADD: {
        if(!audioModule.deviceTypes.get(msg.deviceName)) throw Error(`Unknown device type: ${msg.deviceName}`);
        
        const device = audioModule.addDevice(msg.deviceName);
        audioModule.moveDevice(device, msg.x, msg.y);
        
        audioModule.save();
        break;
      }
      
      case PacketType.DEVICE_REMOVE: {
        if(!audioModule.devices.get(msg.uuid)) throw Error(`Unknown device: ${msg.uuid}`);
        
        audioModule.removeDevice(msg.uuid);
        
        audioModule.save();
        break;
      }
      
      case PacketType.DEVICE_MOVE: {
        const device = audioModule.devices.get(msg.uuid);
        if(!device) throw Error(`Unknown device: ${msg.uuid}`);
        
        audioModule.moveDevice(device, msg.posx, msg.posy);
        audioModule.save();
        break;
      }
      
      case PacketType.DEVICE_CONNECT: {
        const { from: fromUUID, to: toUUID, output, input } = msg;
        
        const from = audioModule.devices.get(fromUUID);
        const to = audioModule.devices.get(toUUID);
        if(!from) throw Error(`Unknown device: ${fromUUID}`);
        if(!to) throw Error(`Unknown device: ${toUUID}`);
        
        audioModule.connectDevices(from, to, output, input);
        audioModule.save();
        break;
      }
      
      case PacketType.DEVICE_DISCONNECT: {
        const { uuid } = msg;
        
        const connection = audioModule.connections.get(uuid);
        if(!connection) throw Error(`Unknown connection: ${uuid}`);
        
        audioModule.removeConnection(uuid);
        audioModule.save();
        break;
      }
      
      case PacketType.INTERFACE_INTERACT: {
        const { device: deviceUUID, node: nodeUUID, event } = msg;
        
        const device = audioModule.devices.get(deviceUUID);
        if(!device) throw Error(`Unknown device: ${deviceUUID}`);
        
        const node = device.interface.nodes.get(nodeUUID);
        if(!node) throw Error(`Unknown node: ${nodeUUID}`);
        
        await node.onInteract(event);
        audioModule.save();
        break;
      }
      
      default:
        console.error("Unknown packet: " + (msg as any).type, msg);
        break;
    }
  }
  
  return ws => {
    clients.add(ws);
    
    ws.on('error', err => {
      console.error(err);
      clients.delete(ws);
      ws.close();
    });
    ws.on('close', () => {
      clients.delete(ws);
    });
    ws.on('message', (msg: Buffer) => {
      handleMessage(JSON.parse(msg.toString()) as ClientPacket).catch(err => {
        console.error(err);
        ws.close();
      });
    });
    
    ws.send(audioModule.getInitPacket());
  };
}
