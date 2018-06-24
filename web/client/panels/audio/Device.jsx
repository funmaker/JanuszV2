import React from 'react';
import isNode from "detect-node";
import {Icon} from "semantic-ui-react";

const nullImage = isNode ? {} : document.createElement('IMG');
nullImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export default class Device extends React.Component {
	
	onDragStart = ev => {
		const target = ev.target;
		const kind = target.dataset.kind;
		const port = target.dataset.port;
		const uuid = target.dataset.device;
		
		ev.stopPropagation();
		ev.dataTransfer.setData("type", "link");
		ev.dataTransfer.setData("uuid", uuid);
		ev.dataTransfer.setData("port", port);
		ev.dataTransfer.setData("kind", kind);
		ev.dataTransfer.setDragImage(nullImage, 0, 0);
		ev.dataTransfer.effectAllowed = "link";
	};
	
	onDragOver = ev => {
		if(ev.dataTransfer.getData("type") !== "link") return;
		if(ev.target.dataset.kind === ev.dataTransfer.getData("kind")) return;
		ev.dataTransfer.dropEffect = "link";
		ev.preventDefault();
	};
	
	onDrop = ev => {
		if(ev.dataTransfer.getData("type") !== "link") return;
		if(ev.target.dataset.kind === ev.dataTransfer.getData("kind")) return;
		const target = ev.target;
		let input, to, output, from;
		if(ev.dataTransfer.getData("kind") === "output") {
			input = parseInt(target.dataset.port);
			to = target.dataset.device;
			output = parseInt(ev.dataTransfer.getData("port"));
			from = ev.dataTransfer.getData("uuid");
		} else {
			output = parseInt(target.dataset.port);
			from = target.dataset.device;
			input = parseInt(ev.dataTransfer.getData("port"));
			to = ev.dataTransfer.getData("uuid");
		}
		
		this.props.onConnect(from, to, output, input);
	};
	
	onRemove = ev => {
		this.props.onRemove(this.props.device.uuid);
	};
	
	render() {
		const {device, onConnect, onRemove, ...rest} = this.props;
		const inputs = [];
		const outputs = [];
		
		for(let i = 0; i < device.inputs; i++) {
			inputs.push(<div className="input"
			                 draggable
			                 onDragStart={this.onDragStart}
			                 onDragOver={this.onDragOver}
			                 onDrop={this.onDrop}
			                 data-port={i}
			                 data-kind="input"
			                 data-device={device.uuid}
			                 key={i}/>)
		}
		for(let i = 0; i < device.outputs; i++) {
			outputs.push(<div className="output"
			                  draggable
			                  onDragStart={this.onDragStart}
			                  onDragOver={this.onDragOver}
			                  onDrop={this.onDrop}
			                  data-port={i}
			                  data-kind="output"
			                  data-device={device.uuid}
			                  key={i}/>)
		}
		
		return <div className="Device"
		            style={{
			            transform: `translate(${device.posx}px, ${device.posy}px) translate(-50%, -50%)`,
		            }}
		            draggable
		            data-name={device.name}
		            data-uuid={device.uuid}
		            {...rest}>
			<Icon className="removeButton" name="delete" color="red" onClick={this.onRemove} />
			<div className="inputs">{inputs}</div>
			<div className="outputs">{outputs}</div>
			<div className="clearfix"/>
		</div>
	}
	
}