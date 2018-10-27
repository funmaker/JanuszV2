import React from 'react';
import {Button, Dimmer, Loader, Dropdown} from "semantic-ui-react";
import isNode from 'detect-node';
import * as packets from "../../../../audio/packets";
import Cabbles from "./Cabbles";
import Device from "./Device";

const nullImage = isNode ? {} : document.createElement('IMG');
nullImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export class Panel extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			loading: true,
			posx: 0,
			posy: 0,
			devices: {},
			connections: {},
			types: [],
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
	
	handleClose = (code, reason) => {
		console.log(code, reason);
		this.setState({
			devices: {},
			connections: {},
			types: [],
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
					types: msg.types,
				});
				break;
			
			case packets.types.DEVICES_UPDATE:
				let devices = {...this.state.devices};
				
				for(let uuid of Object.keys(msg.devices)) {
					if(msg.devices[uuid] === null) {
						delete devices[uuid];
					} else {
						devices[uuid] = {
							...devices[uuid],
							...msg.devices[uuid],
						};
					}
				}
				
				this.setState({devices});
				break;
			
			case packets.types.CONNECTIONS_UPDATE:
				let connections = {...this.state.connections};
				
				for(let uuid of Object.keys(msg.connections)) {
					if(msg.connections[uuid] === null) {
						delete connections[uuid];
					} else {
						connections[uuid] = {
							...connections[uuid],
							...msg.connections[uuid],
						};
					}
				}
				
				this.setState({connections});
				break;
			
			default:
				console.error("Unknown packet: " + msg.type, msg);
				break;
		}
	};
	
	reconnectWS() {
		this.ws = new WebSocket(`ws://${location.host}/audio?format=html`);
		this.ws.addEventListener("open", () => {
			this.setState({
				loading: true,
				devices: {},
			});
		});
		this.ws.addEventListener("close", this.handleClose);
		this.ws.addEventListener("error", err => {
			console.log("Connection error: ", err);
			this.ws.close();
		});
		this.ws.addEventListener('message', this.handleMessage);
	}
  
  onMouseMove = ev => {
    if((ev.buttons & 1) === 0) return;
    if(ev.target !== this.div) return;
    
    this.setState({
      posx: this.state.posx + ev.nativeEvent.movementX,
      posy: this.state.posy + ev.nativeEvent.movementY,
    });
  };
  
  onTouchStart = ev => {
    if(ev.touches.length !== 1) return;
    
    this.setState({
      touchX: ev.touches[0].clientX,
      touchY: ev.touches[0].clientY,
    });
  };
  
  onTouchMove = ev => {
    if(ev.touches.length !== 1) return;
    ev.preventDefault();
    
    this.setState({
      posx: this.state.posx + ev.touches[0].clientX - this.state.touchX,
      posy: this.state.posy + ev.touches[0].clientY - this.state.touchY,
      touchX: ev.touches[0].clientX,
      touchY: ev.touches[0].clientY,
    });
  };
	
	onDragStart = ev => {
		const target = ev.target;
		const uuid = target.dataset.uuid;
		const device = this.state.devices[uuid];
		
		ev.stopPropagation();
		ev.dataTransfer.setData("firefox", "sucks");
		window.dataTransfer.clearData();
		window.dataTransfer.setData("type", "device");
		window.dataTransfer.setData("uuid", uuid);
		window.dataTransfer.setData("posx", device.posx);
		window.dataTransfer.setData("posy", device.posy);
		ev.dataTransfer.setDragImage(nullImage, 0, 0);
		ev.dataTransfer.effectAllowed = "move";
	};
	
	onDragLeave = ev => {
		if(window.dataTransfer.getData("type") !== "device") return;
		const uuid = window.dataTransfer.getData("uuid");
		const device = this.state.devices[uuid];
		// this.setState({
		// 	devices: {
		// 		...this.state.devices,
		// 		[uuid]: {
		// 			...device,
		// 			posx: parseInt(window.dataTransfer.getData("posx")),
		// 			posy: parseInt(window.dataTransfer.getData("posy")),
		// 		},
		// 	},
		// });
	};
	
	onDragOver = ev => {
		if(window.dataTransfer.getData("type") !== "device") return;
		const uuid = window.dataTransfer.getData("uuid");
		ev.preventDefault();
		const device = this.state.devices[uuid];
		const offset = this.offsetDiv.getBoundingClientRect();
		let posx = ev.clientX - offset.x;
		let posy = ev.clientY - offset.y;
		posx = 16 * Math.round(posx / 16);
		posy = 16 * Math.round(posy / 16);
		if(device.posx !== posx || device.posy !== posy) {
			this.setState({
				devices: {
					...this.state.devices,
					[uuid]: {
						...device,
						posx, posy,
					},
				},
			});
		}
	};
	
	onDrop = ev => {
		if(window.dataTransfer.getData("type") !== "device") return;
		const uuid = window.dataTransfer.getData("uuid");
		ev.preventDefault();
		const device = this.state.devices[uuid];
		this.ws.send(packets.deviceMovePacket(uuid, device.posx, device.posy));
	};
	
	onConnect = (from, to, output, input) => {
		for(let connection of Object.values(this.state.connections)) {
			if(connection.from === from &&
				connection.to === to &&
				connection.output === output &&
				connection.input === input) {
				this.ws.send(packets.deviceDisconnectPacket(connection.uuid));
				return;
			}
		}
		this.ws.send(packets.deviceConnectPacket(from, to, output, input));
	};
	
	addDevice = (ev, {value: deviceName}) => {
		this.ws.send(packets.deviceAddPacket(deviceName));
	};
	
	removeDevice = uuid => {
		this.ws.send(packets.deviceRemovePacket(uuid));
	};
	
	render() {
		const {posx, posy, devices, connections, types, loading} = this.state;
		
		return (
			<React.Fragment>
				<div className="board"
				            onMouseMove={this.onMouseMove}
             				onTouchStart={this.onTouchStart}
             				onTouchMove={this.onTouchMove}
				            onDragOver={this.onDragOver}
				            onDragLeave={this.onDragLeave}
				            onDrop={this.onDrop}
				            ref={div => this.div = div}
				            style={{backgroundPosition: `calc(${posx}px + 50%) calc(${posy}px + 50%)`}}>
					<div className="offset"
					     ref={div => this.offsetDiv = div}
					     style={{transform: `translate(${posx}px, ${posy}px)`}}>
						<Dimmer active={loading}><Loader size="huge"/></Dimmer>
						{Object.values(devices).map(device =>
							<Device device={device}
							        key={device.uuid}
							        onRemove={this.removeDevice}
							        onConnect={this.onConnect}
							        onDragStart={this.onDragStart}/>)}
						<Cabbles devices={devices} connections={connections}/>
					</div>
				</div>
				<Button.Group className="panelButtons">
					<Dropdown trigger={<Button icon="add" />}
					          icon={null}
					          options={types.map(type => ({
						          value: type.deviceName,
						          text: type.deviceName,
						          disabled: type.singleton && Object.values(devices).some(device => device.name === type.deviceName)
					          }))}
					          upward
					          direction="right"
					          onChange={this.addDevice}
					          selectOnBlur={false}
					          value={false}/>
				</Button.Group>
			</React.Fragment>
		);
	}
}

export const name = "Audio Manager";

