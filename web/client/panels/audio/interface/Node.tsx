import React from "react";
import { styled } from "@mui/material";
import { NodeStateData } from "../../../../../audio/packets";
import Label from "./Label";
import Dial from "./Dial";
import Button from "./Button";
import Dropdown from "./Dropdown";
import Indicator from "./Indicator";
import Slider from "./Slider";
import { InterfaceProps } from "./types";

function NodeContent(props: InterfaceProps) {
  switch(props.data.type) {
    case "Label": return <Label {...props} />;
    case "Indicator": return <Indicator {...props} />;
    case "Slider": return <Slider {...props} />;
    case "Dial": return <Dial {...props} />;
    case "Button": return <Button {...props} />;
    case "Dropdown": return <Dropdown {...props} />;
    default: return <Generic />;
  }
}

function Generic() {
  return <StyledGeneric />;
}

function Children({ data, onInteract }: InterfaceProps) {
  return Object.values(data.children)
               .filter((child): child is NodeStateData => !!child)
               .map(child => <Node key={child.uuid} data={child} onInteract={onInteract} />);
}

export function Root({ data, onInteract }: InterfaceProps) {
  return (
    <StyledRoot style={{ width: data.state.width * 16 + "px", height: data.state.height * 16 + "px" }}>
      <Children data={data} onInteract={onInteract} />
    </StyledRoot>
  );
}

export default function Node({ data, onInteract }: InterfaceProps) {
  if(data.type === "Root") return <Root data={data} onInteract={onInteract} />;
  
  return (
    <StyledNode style={{ top: data.state.y * 16 + "px", left: data.state.x * 16 + "px" }}>
      <NodeContent data={data} onInteract={onInteract} />
      <Children data={data} onInteract={onInteract} />
    </StyledNode>
  );
}

const StyledRoot = styled("div")`
  position: relative;
  margin: 0 auto -2px;
`;

const StyledNode = styled("div")`
  position: absolute;
  display: inline-block;
`;

const StyledGeneric = styled("div")`
  width: 16px;
  height: 16px;
  background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZElEQVQ4y2NgAIITPjz/ycEMMM1/ZliQhYHa/8MNAHFI0YhhADLG5lyCLkDXDJaEYlyGEDQAnxjtDIBLQBWjRRtxBuALD7INIDoW8HmHZAPwpQHqewGvIiyBR3QYEBE+DP8pwQBsJUCtXNMecQAAAABJRU5ErkJggg==") no-repeat;
`;
