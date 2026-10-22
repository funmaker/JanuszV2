import React, { memo } from 'react';
import { styled } from "@mui/material";
import CancelIcon from '@mui/icons-material/Cancel';
import { DeviceStateData, InteractEvent } from "../../../../audio/packets";
import { Root } from "./interface/Node";

interface DeviceProps {
  device: DeviceStateData;
  onRemove: (uuid: string) => void;
  onInteract: (device: string, node: string, event: InteractEvent) => void;
}

function Device({ device, onRemove, onInteract }: DeviceProps) {
  const ports = (kind: "input" | "output", count: number, activity: boolean[]) => [...new Array(count)].map((_, i) => (
    <div key={i}
         className={`${kind}${activity[i] ? " active" : ""}`}
         data-port={i}
         data-kind={kind}
         data-device={device.uuid} />
  ));
  
  return (
    <StyledDevice data-name={device.name}
                  data-device={device.uuid}
                  style={{ transform: `translate(${device.posx}px, ${device.posy}px)` }}>
      <CancelIcon className="removeButton"
                  data-interactive
                  color="error"
                  onClick={() => onRemove(device.uuid)} />
      <div className="inputs">{ports("input", device.inputs, device.inputActivity)}</div>
      <div className="outputs">{ports("output", device.outputs, device.outputActivity)}</div>
      <Root data={device.interface} onInteract={(node, event) => onInteract(device.uuid, node, event)} />
    </StyledDevice>
  );
}

export default memo(Device);

const StyledDevice = styled("div")`
  position: absolute;
  top: 0;
  left: 0;
  min-width: 128px;
  padding: 14px 14px 0;
  background: ${props => props.theme.palette.audio.device};
  border: 2px solid ${props => props.theme.palette.audio.deviceBorder};
  border-radius: 8px;
  cursor: move;
  user-select: none;
  touch-action: none;
  
  &::after {
    content: attr(data-name);
    position: absolute;
    display: block;
    top: -2px;
    left: -2px;
    right: -2px;
    height: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: #333;
    border-radius: 8px;
    border: 1px solid gray;
    text-align: center;
    color: #aaa;
    font-size: 12px;
    line-height: 16px;
    font-family: "courier new", courier, monospace;
    font-weight: bold;
  }
  
  .removeButton {
    position: absolute;
    top: -6px;
    right: -6px;
    z-index: 1;
    font-size: 20px;
    background: ${props => props.theme.palette.background.paper};
    border-radius: 50%;
    opacity: 0;
    cursor: pointer;
    transition: opacity 0.1s;
  }
  
  &:hover .removeButton {
    opacity: 1;
  }
  
  .inputs, .outputs {
    margin: 16px 0 -2px;
    
    .input, .output {
      width: 17px;
      height: 16px;
      margin-bottom: 16px;
      border: 2px solid ${props => props.theme.palette.audio.deviceBorder};
      cursor: crosshair;
      transition: background-color 0.2s;
    }
  }
  
  .inputs {
    float: left;
    margin-left: -16px;
    
    .input {
      border-left: none;
      border-radius: 0 8px 8px 0;
      background: ${props => props.theme.palette.audio.input};
      
      &.active {
        background: ${props => props.theme.palette.audio.inputActive};
      }
    }
  }
  
  .outputs {
    float: right;
    margin-right: -16px;
    
    .output {
      border-right: none;
      border-radius: 8px 0 0 8px;
      background: ${props => props.theme.palette.audio.output};
      
      &.active {
        background: ${props => props.theme.palette.audio.outputActive};
      }
    }
  }
`;
