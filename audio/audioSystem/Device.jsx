import React from 'react';
import isNode from "detect-node";

const nullImage = isNode ? {} : document.createElement('IMG');
nullImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export default class Device extends React.Component {
	
	onDragStart = ev => {
		const target = ev.target;
		const id = target.dataset.id;
		const uuid = target.dataset.device;
		
		ev.stopPropagation();
		ev.dataTransfer.setData("type", "output");
		ev.dataTransfer.setData("uuid", uuid);
		ev.dataTransfer.setData("output", id);
		ev.dataTransfer.setDragImage(nullImage, 0, 0);
		ev.dataTransfer.effectAllowed = "link";
	};
	
	onDragOver = ev => {
		if(ev.dataTransfer.getData("type") !== "output") return;
		ev.dataTransfer.dropEffect = "link";
		ev.preventDefault();
	};
	
	onDrop = ev => {
		if(ev.dataTransfer.getData("type") !== "output") return;
		const target = ev.target;
		const input = parseInt(target.dataset.id);
		const to = target.dataset.device;
		const output = parseInt(ev.dataTransfer.getData("output"));
		const from = ev.dataTransfer.getData("uuid");
		
		this.props.onConnect(from, to, output, input);
	};
	
	render() {
		const {device, onConnect, ...rest} = this.props;
		const inputs = [];
		const outputs = [];
		
		for(let i = 0; i < device.inputs; i++) {
			inputs.push(<div className="input"
			                 onDragOver={this.onDragOver}
			                 onDrop={this.onDrop}
			                 data-id={i}
			                 data-device={device.uuid}
			                 key={i}/>)
		}
		for(let i = 0; i < device.outputs; i++) {
			outputs.push(<div className="output"
			                  draggable
			                  onDragStart={this.onDragStart}
			                  data-id={i}
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
			<div className="inputs">{inputs}</div>
			<div className="outputs">{outputs}</div>
			<div className="clearfix"/>
		</div>
	}
	
}