import React from 'react';
import {Dimmer, Loader} from "semantic-ui-react";
import isNode from 'detect-node';
import * as packets from "./packets";
import Cabbles from "./Cabbles";
import Device from "./Device";

const nullImage = isNode ? {} : document.createElement('IMG');
nullImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export class Panel extends React.Component {
	handleClose = (code, reason) => {
		console.log(code, reason);
		this.setState({
			loading: true,
		});
		this.reconnectWS();
	};
	handleMessage = msg => {
		msg = JSON.parse(msg.data);
		
		switch(msg.type) {
			case packets.types.INIT:
				this.setState({
					loading: false,
					devices: msg.devices,
					connections: msg.connections,
				});
				break;
			
			case packets.types.DEVICES_UPDATE:
				for(let uuid of Object.keys(msg.devices)) {
					if(msg.devices[uuid] === null) {
						msg.devices[uuid] = undefined;
					} else {
						msg.devices[uuid] = {
							...this.state.devices[uuid],
							...msg.devices[uuid],
						};
					}
				}
				
				this.setState({
					devices: {
						...this.state.devices,
						...msg.devices,
					},
				});
				break;
			
			case packets.types.CONNECTIONS_UPDATE:
				for(let uuid of Object.keys(msg.connections)) {
					if(msg.connections[uuid] === null) {
						msg.connections[uuid] = undefined;
					} else {
						msg.connections[uuid] = {
							...this.state.connections[uuid],
							...msg.connections[uuid],
						};
					}
				}
				
				this.setState({
					connections: {
						...this.state.connections,
						...msg.connections,
					},
				});
				break;
			
			default:
				console.error("Unknown packet: " + msg.type, msg);
				break;
		}
	};
	onMouseMove = ev => {
		if((ev.buttons & 1) === 0) return;
		if(ev.target !== this.div) return;
		
		this.setState({
			posx: this.state.posx + ev.nativeEvent.movementX,
			posy: this.state.posy + ev.nativeEvent.movementY,
		});
	};
	onDragStart = ev => {
		const target = ev.target;
		const uuid = target.dataset.uuid;
		const device = this.state.devices[uuid];
		ev.dataTransfer.setData("type", "device");
		ev.dataTransfer.setData("uuid", uuid);
		ev.dataTransfer.setData("posx", device.posx);
		ev.dataTransfer.setData("posy", device.posy);
		ev.dataTransfer.setDragImage(nullImage, 0, 0);
	};
	onDragLeave = ev => {
		if(ev.dataTransfer.getData("type") !== "device") return;
		const uuid = ev.dataTransfer.getData("uuid");
		const device = this.state.devices[uuid];
		this.setState({
			devices: {
				...this.state.devices,
				[uuid]: {
					...device,
					posx: ev.dataTransfer.getData("posx"),
					posy: ev.dataTransfer.getData("posy"),
				},
			},
		});
	};
	onDragOver = ev => {
		if(ev.dataTransfer.getData("type") !== "device") return;
		const uuid = ev.dataTransfer.getData("uuid");
		ev.preventDefault();
		const device = this.state.devices[uuid];
		const offset = this.offsetDiv.getBoundingClientRect();
		let posx = ev.screenX - offset.x;
		let posy = ev.screenY - offset.y - 100;
		posx = 16 * Math.round(posx / 16);
		posy = 16 * Math.round(posy / 16);
		this.setState({
			devices: {
				...this.state.devices,
				[uuid]: {
					...device,
					posx, posy,
				},
			},
		});
	};
	onDrop = ev => {
		if(ev.dataTransfer.getData("type") !== "device") return;
		const uuid = ev.dataTransfer.getData("uuid");
		ev.preventDefault();
		const device = this.state.devices[uuid];
		this.ws.send(packets.deviceMovePacket(uuid, device.posx, device.posy));
	};
	onConnect = (from, to, output, input) => {
		this.ws.send(packets.deviceConnectPacket(from, to, output, input));
	};
	
	constructor(props) {
		super(props);
		
		this.state = {
			loading: true,
			posx: 0,
			posy: 0,
			devices: {},
			connections: {},
			dragging: null,
			draggingOrig: null,
		};
		
		if(!isNode) {
			this.reconnectWS();
		}
	}
	
	componentWillUnmount() {
		this.ws.removeEventListener("close", this.handleClose);
		this.ws.removeEventListener("message", this.handleMessage);
		this.ws.close();
	}
	
	reconnectWS() {
		this.ws = new WebSocket(`ws://${location.host}/audio/system`);
		this.ws.addEventListener("open", () => {
			this.setState({
				loading: true,
				devices: {},
			});
		});
		this.ws.addEventListener("close", this.handleClose);
		this.ws.addEventListener('message', this.handleMessage);
	}
	
	render() {
		const {posx, posy, devices, connections, loading} = this.state;
		
		return <div className="AudioManager"
		            onMouseMove={this.onMouseMove}
		            onDragOver={this.onDragOver}
		            onDragLeave={this.onDragLeave}
		            onDrop={this.onDrop}
		            ref={div => this.div = div}
		            style={{backgroundPosition: `calc(${posx}px + 50%) calc(${posy}px + 50%)`}}>
			<div className="offset"
			     ref={div => this.offsetDiv = div}
			     style={{transform: `translate(${posx}px, ${posy}px)`}}>
				{Object.values(devices).map(device =>
					<Device device={device}
					        key={device.uuid}
					        onConnect={this.onConnect}
					        onDragStart={this.onDragStart}/>)}
			</div>
			<Cabbles devices={devices} connections={connections} posx={posx} posy={posy}/>
			<Dimmer active={loading} inverted><Loader/></Dimmer>
		</div>;
	}
}

export const name = "Audio Manager";

