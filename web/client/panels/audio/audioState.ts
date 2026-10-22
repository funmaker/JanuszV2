import { ConnectionStateData, DeviceStateData, DeviceTypeData, PacketType, ServerPacket } from "../../../../audio/packets";
import { merge } from "../../../../audio/sharedUtils";

export const GRID = 16;

export interface AudioState {
  loading: boolean;
  devices: Record<string, DeviceStateData>;
  connections: Record<string, ConnectionStateData>;
  types: DeviceTypeData[];
}

export type AudioAction
  = | { type: "reset" }
  | { type: "packet"; packet: ServerPacket }
  | { type: "move"; uuid: string; posx: number; posy: number };

export const initialAudioState: AudioState = {
  loading: true,
  devices: {},
  connections: {},
  types: [],
};

export const snap = (value: number) => GRID * Math.round(value / GRID);

export const deviceWidth = (device: DeviceStateData) => Math.max(8, device.interface.state.width + 2) * GRID;
export const deviceHeight = (device: DeviceStateData) => Math.max(4, device.interface.state.height + 1) * GRID;
export const portOffset = (port: number) => port * 32 + 40;

function calculateInputActivity(device: DeviceStateData, devices: Record<string, DeviceStateData>, connections: Record<string, ConnectionStateData>) {
  const inputActivity = [...new Array(device.inputs)].map(() => false);
  
  for(const con of Object.values(connections)) {
    if(con.to === device.uuid && devices[con.from]?.outputActivity[con.output]) inputActivity[con.input] = true;
  }
  
  return inputActivity;
}

function updateInputActivity(devices: Record<string, DeviceStateData>, connections: Record<string, ConnectionStateData>, dirty: Iterable<string>) {
  const result = { ...devices };
  
  for(const uuid of dirty) {
    const device = result[uuid];
    if(device) result[uuid] = { ...device, inputActivity: calculateInputActivity(device, result, connections) };
  }
  
  return result;
}

function handlePacket(state: AudioState, packet: ServerPacket): AudioState {
  switch(packet.type) {
    case PacketType.INIT:
      return {
        loading: false,
        devices: updateInputActivity(packet.devices, packet.connections, Object.keys(packet.devices)),
        connections: packet.connections,
        types: packet.types,
      };
    
    case PacketType.DEVICES_UPDATE: {
      const devices: Record<string, DeviceStateData | null> = { ...merge<Record<string, DeviceStateData | null>>(state.devices, packet.devices) };
      for(const key of Object.keys(devices)) if(devices[key] === null) delete devices[key];
      
      const dirty = new Set<string>();
      for(const [uuid, update] of Object.entries(packet.devices)) {
        if(update?.inputs !== undefined) dirty.add(uuid);
        if(update?.outputActivity === undefined) continue;
        for(const con of Object.values(state.connections)) {
          if(con.from === uuid) dirty.add(con.to);
        }
      }
      
      return { ...state, devices: updateInputActivity(devices as Record<string, DeviceStateData>, state.connections, dirty) };
    }
    
    case PacketType.CONNECTIONS_UPDATE: {
      const connections = { ...state.connections };
      const dirty = new Set<string>();
      
      for(const [uuid, connection] of Object.entries(packet.connections)) {
        if(connection === null) {
          if(connections[uuid]) dirty.add(connections[uuid].to);
          delete connections[uuid];
        } else {
          dirty.add(connection.to);
          connections[uuid] = connection;
        }
      }
      
      return { ...state, connections, devices: updateInputActivity(state.devices, connections, dirty) };
    }
    
    default:
      console.error("Unknown packet: ", packet);
      return state;
  }
}

export function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch(action.type) {
    case "reset":
      return initialAudioState;
    
    case "packet":
      return handlePacket(state, action.packet);
    
    case "move": {
      const device = state.devices[action.uuid];
      if(!device) return state;
      return { ...state, devices: { ...state.devices, [action.uuid]: { ...device, posx: action.posx, posy: action.posy } } };
    }
    
    default:
      return state;
  }
}
