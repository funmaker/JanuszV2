
export enum PacketType {
  INIT = 0,
  DEVICES_UPDATE = 1,
  DEVICE_ADD = 2,
  DEVICE_REMOVE = 3,
  DEVICE_MOVE = 4,
  DEVICE_CONNECT = 5,
  DEVICE_DISCONNECT = 6,
  CONNECTIONS_UPDATE = 7,
  INTERFACE_INTERACT = 8,
}

/////////////////////////
//       States        //
/////////////////////////

export interface NodeStateData {
  type: string;
  uuid: string;
  name: string;
  state: Record<string, any>;
  children: Record<string, NodeStateData | null>;
}

export interface DeviceStateData {
  name: string;
  uuid: string;
  posx: number;
  posy: number;
  inputs: number;
  inputActivity: boolean[];
  outputs: number;
  outputActivity: boolean[];
  interface: NodeStateData;
  extra: unknown;
}

export interface ConnectionStateData {
  uuid: string;
  from: string;
  to: string;
  output: number;
  input: number;
}

export interface DeviceTypeData {
  deviceName: string;
  deviceNameGroup: string | null;
  singleton: boolean;
}

export interface InteractEvent {
  value: any;
}

export type DeviceUpdate = DeepPartial<DeviceStateData>;

/////////////////////////
//       Server        //
/////////////////////////

export interface InitPacket {
  type: PacketType.INIT;
  devices: Record<string, DeviceStateData>;
  connections: Record<string, ConnectionStateData>;
  types: DeviceTypeData[];
}

export interface DevicesUpdatePacket {
  type: PacketType.DEVICES_UPDATE;
  devices: Record<string, DeviceUpdate | null>;
}

export interface ConnectionsUpdatePacket {
  type: PacketType.CONNECTIONS_UPDATE;
  connections: Record<string, ConnectionStateData | null>;
}

export type ServerPacket = InitPacket | DevicesUpdatePacket | ConnectionsUpdatePacket;

export const initPacket = (devices: DeviceStateData[], connections: ConnectionStateData[], types: DeviceTypeData[]) => serialize<InitPacket>({
  type: PacketType.INIT,
  devices: reduceToObject(devices),
  connections: reduceToObject(connections),
  types,
});

export const devicesUpdatePacket = (devices: Record<string, DeviceUpdate | null>) => serialize<DevicesUpdatePacket>({
  type: PacketType.DEVICES_UPDATE,
  devices,
});

export const connectionsUpdatePacket = (connections: Record<string, ConnectionStateData | null>) => serialize<ConnectionsUpdatePacket>({
  type: PacketType.CONNECTIONS_UPDATE,
  connections,
});

/////////////////////////
//       Client        //
/////////////////////////

export interface DeviceAddPacket {
  type: PacketType.DEVICE_ADD;
  deviceName: string;
  x: number;
  y: number;
}

export interface DeviceRemovePacket {
  type: PacketType.DEVICE_REMOVE;
  uuid: string;
}

export interface DeviceMovePacket {
  type: PacketType.DEVICE_MOVE;
  uuid: string;
  posx: number;
  posy: number;
}

export interface DeviceConnectPacket {
  type: PacketType.DEVICE_CONNECT;
  from: string;
  to: string;
  output: number;
  input: number;
}

export interface DeviceDisconnectPacket {
  type: PacketType.DEVICE_DISCONNECT;
  uuid: string;
}

export interface InterfaceInteractPacket {
  type: PacketType.INTERFACE_INTERACT;
  device: string;
  node: string;
  event: InteractEvent;
}

export type ClientPacket = DeviceAddPacket | DeviceRemovePacket | DeviceMovePacket | DeviceConnectPacket | DeviceDisconnectPacket | InterfaceInteractPacket;

export const deviceAddPacket = (deviceName: string, x: number, y: number) => serialize<DeviceAddPacket>({
  type: PacketType.DEVICE_ADD,
  deviceName, x, y,
});

export const deviceRemovePacket = (uuid: string) => serialize<DeviceRemovePacket>({
  type: PacketType.DEVICE_REMOVE,
  uuid,
});

export const deviceMovePacket = (uuid: string, posx: number, posy: number) => serialize<DeviceMovePacket>({
  type: PacketType.DEVICE_MOVE,
  uuid, posx, posy,
});

export const deviceConnectPacket = (from: string, to: string, output: number, input: number) => serialize<DeviceConnectPacket>({
  type: PacketType.DEVICE_CONNECT,
  from, to, output, input,
});

export const deviceDisconnectPacket = (uuid: string) => serialize<DeviceDisconnectPacket>({
  type: PacketType.DEVICE_DISCONNECT,
  uuid,
});

export const interfaceInteractPacket = (device: string, node: string, event: InteractEvent) => serialize<InterfaceInteractPacket>({
  type: PacketType.INTERFACE_INTERACT,
  device, node, event,
});

/////////////////////////
//       Helpers       //
/////////////////////////

function serialize<P extends ServerPacket | ClientPacket>(packet: P) {
  return JSON.stringify(packet);
}

function reduceToObject<T extends { uuid: string }>(arr: T[]) {
  return arr.reduce<Record<string, T>>((acc, obj) => ({ ...acc, [obj.uuid]: obj }), {});
}
