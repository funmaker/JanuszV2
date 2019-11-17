import React from 'react';
import isNode from "detect-node";
import { Icon } from "semantic-ui-react";
import Node from "./interface/Node";

const nullImage = isNode ? {} : document.createElement('IMG');
nullImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export default class Device extends React.PureComponent {
  onDragStart = ev => {
    const target = ev.target;
    const kind = target.dataset.kind;
    const port = target.dataset.port;
    const uuid = target.dataset.device;
    
    ev.stopPropagation();
    ev.dataTransfer.setData("firefox", "sucks");
    window.dataTransfer.clearData();
    window.dataTransfer.setData("type", "link");
    window.dataTransfer.setData("uuid", uuid);
    window.dataTransfer.setData("port", port);
    window.dataTransfer.setData("kind", kind);
    ev.dataTransfer.setDragImage(nullImage, 0, 0);
    ev.dataTransfer.effectAllowed = "link";
  };
  
  onDragOver = ev => {
    if(window.dataTransfer.getData("type") !== "link") return;
    if(ev.target.dataset.kind === window.dataTransfer.getData("kind")) return;
    ev.dataTransfer.dropEffect = "link";
    ev.preventDefault();
  };
  
  onDrop = ev => {
    if(window.dataTransfer.getData("type") !== "link") return;
    if(ev.target.dataset.kind === window.dataTransfer.getData("kind")) return;
    const target = ev.target;
    let input, to, output, from;
    if(window.dataTransfer.getData("kind") === "output") {
      input = parseInt(target.dataset.port);
      to = target.dataset.device;
      output = parseInt(window.dataTransfer.getData("port"));
      from = window.dataTransfer.getData("uuid");
    } else {
      output = parseInt(target.dataset.port);
      from = target.dataset.device;
      input = parseInt(window.dataTransfer.getData("port"));
      to = window.dataTransfer.getData("uuid");
    }
    
    this.props.onConnect(from, to, output, input);
  };
  
  onRemove = ev => {
    this.props.onRemove(this.props.device.uuid);
  };
  
  onInteract = (node, data) => {
    this.props.onInteract(this.props.device.uuid, node, data);
  };
  
  render() {
    const { device, onConnect, onRemove, onInteract, ...rest } = this.props;
    const inputs = [];
    const outputs = [];
    
    for(let i = 0; i < device.inputs; i++) {
      inputs.push(<div className={"input" + (device.inputActivity[i] ? " active" : "")}
                       draggable
                       onDragStart={this.onDragStart}
                       onDragOver={this.onDragOver}
                       onDrop={this.onDrop}
                       data-port={i}
                       data-kind="input"
                       data-device={device.uuid}
                       key={i} />);
    }
    for(let i = 0; i < device.outputs; i++) {
      outputs.push(<div className={"output" + (device.outputActivity[i] ? " active" : "")}
                        draggable
                        onDragStart={this.onDragStart}
                        onDragOver={this.onDragOver}
                        onDrop={this.onDrop}
                        data-port={i}
                        data-kind="output"
                        data-device={device.uuid}
                        key={i} />);
    }
    
    return (
      <div className="Device"
           style={{
             transform: `translate(${device.posx}px, ${device.posy}px)`,
           }}
           draggable
           data-name={device.name}
           data-uuid={device.uuid}
           {...rest}>
        <Icon className="removeButton" name="delete" color="red" onClick={this.onRemove} />
        <div className="inputs">{inputs}</div>
        <div className="outputs">{outputs}</div>
        <Node data={device.interface} onInteract={this.onInteract} />
      </div>
    );
  }
}
