import React from 'react';
import {Button, Dimmer, Loader, Dropdown} from "semantic-ui-react";
import isNode from 'detect-node';
import * as packets from "../../../../audio/packets";
import Cabbles from "./Cabbles";
import Device from "./Device";
import { merge } from "../../../../audio/sharedUtils";

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
		console.log(msg);
		
		switch(msg.type) {
			case packets.types.INIT:
				for(const device of Object.values(msg.devices)) {
					device.inputActivity = this.calculateInputActivity(device.uuid, msg.devices, msg.connections);
				}
				
				this.setState({
					loading: false,
					devices: msg.devices,
					connections: msg.connections,
					types: msg.types,
				});
				break;
			
			case packets.types.DEVICES_UPDATE: {
				const devices = merge(this.state.devices, msg.devices);
				
				for(const key of Object.keys(devices)) if(devices[key] === null) delete devices[key];

				if(Object.values(devices).some(device => device.outputActivity)) {
					const dirty = new Set();
					
					for(const con of Object.values(this.state.connections)) {
						if(msg.devices[con.from] && msg.devices[con.from].outputActivity && msg.devices[con.from].outputActivity[con.output] !== undefined) dirty.add(con.to);
					}
					
					for(const uuid of dirty.values()) {
						devices[uuid] = {
							...devices[uuid],
							inputActivity: this.calculateInputActivity(uuid, devices),
						};
					}
				}
				
				this.setState({devices});
				break;
			}
			
			case packets.types.CONNECTIONS_UPDATE: {
				let connections = {...this.state.connections};
				let devices = {...this.state.devices};
				
				const dirty = new Set();
				
				for(let uuid of Object.keys(msg.connections)) {
					if(msg.connections[uuid] === null) {
						dirty.add(connections[uuid].to);
						delete connections[uuid];
					} else {
						dirty.add(msg.connections[uuid].to);
						connections[uuid] = {
							...connections[uuid],
							...msg.connections[uuid],
						};
					}
				}
				
				for(const uuid of dirty.values()) {
					devices[uuid] = {
						...devices[uuid],
						inputActivity: this.calculateInputActivity(uuid, devices, connections),
					};
				}
				
				this.setState({connections, devices});
				break;
			}
			
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
	
	calculateInputActivity(uuid, devices = this.state.devices, connections = this.state.connections) {
		const inputActivity = devices[uuid].inputActivity.map(() => false);
		
		for(const con of Object.values(connections)) {
			if(con.to === uuid && devices[con.from].outputActivity[con.output]) {
				inputActivity[con.input] = true;
				break;
			}
		}
		
		return inputActivity;
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
		const rect = target.getBoundingClientRect();
		const uuid = target.dataset.uuid;
		const device = this.state.devices[uuid];
		
		ev.stopPropagation();
		ev.dataTransfer.setData("firefox", "sucks");
		window.dataTransfer.clearData();
		window.dataTransfer.setData("type", "device");
		window.dataTransfer.setData("uuid", uuid);
		window.dataTransfer.setData("posx", device.posx);
		window.dataTransfer.setData("posy", device.posy);
		window.dataTransfer.setData("offsetx", (ev.clientX - rect.left).toString());
		window.dataTransfer.setData("offsety", (ev.clientY - rect.top).toString());
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
		let posx = ev.clientX - offset.x - window.dataTransfer.getData("offsetx");
		let posy = ev.clientY - offset.y - window.dataTransfer.getData("offsety");
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
		this.ws.send(packets.deviceAddPacket(deviceName), Math.round(this.state.posx), Math.round(this.state.posy));
	};
	
	removeDevice = uuid => {
		this.ws.send(packets.deviceRemovePacket(uuid));
	};
	
	onInteract = (device, node, data) => {
		this.ws.send(packets.interfaceInteractPacket(device, node, data));
	};
	
	render() {
		const {posx, posy, devices, connections, types, loading} = this.state;
		
		const groups = {};
		const typeToOption = type => <Dropdown.Item value={type.deviceName} text={type.deviceName} key={type.deviceName} onClick={this.addDevice}
																					      disabled={type.singleton && Object.values(devices).some(device => device.name === type.deviceName)} />;
		
		for(const type of types) {
			if(type.deviceNameGroup) groups[type.deviceNameGroup] = [...(groups[type.deviceNameGroup] || []), type];
		}
		
		const dropdownOptions = [
			...Object.entries(groups)
							 .sort((a, b) => a[0].localeCompare(b[0]))
							 .map(([name, inner]) => (
				<Dropdown key={name} as={Dropdown.Item} text={name}>
					<Dropdown.Menu>
						{inner.map(typeToOption)}
					</Dropdown.Menu>
				</Dropdown>
			)),
			...types.filter(type => !type.deviceNameGroup)
							.sort((a, b) => a.deviceName.localeCompare(b.deviceName))
							.map(typeToOption),
		];
		
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
					<Dimmer active={loading}><Loader size="huge"/></Dimmer>
					<div className="offset"
					     ref={div => this.offsetDiv = div}
					     style={{transform: `translate(${posx}px, ${posy}px)`}}>
						{Object.values(devices).map(device =>
							<Device device={device}
							        key={device.uuid}
							        onRemove={this.removeDevice}
							        onConnect={this.onConnect}
							        onDragStart={this.onDragStart}
											onInteract={this.onInteract}/>)}
						<Cabbles devices={devices} connections={connections}/>
					</div>
				</div>
				<Button.Group className="panelButtons">
					<Dropdown trigger={<Button icon="add" />}
					          icon={null}
					          upward
					          value={false}>
						<Dropdown.Menu className="right">
							{dropdownOptions}
						</Dropdown.Menu>
					</Dropdown>
				</Button.Group>
			</React.Fragment>
		);
	}
}

export const name = "Audio Manager";

