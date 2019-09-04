import React from "react";
import Root from "./Root";
import Generic from "./Generic";
import Label from "./Label";
import Dial from "./Dial";

export default function Node({ data, onInteract }) {
  let node;
  
  switch(data.type) {
    case "Root": return <Root data={data} onInteract={onInteract} />;
    case "Label": node = <Label data={data} onInteract={onInteract} />; break;
    case "Dial": node = <Dial data={data} onInteract={onInteract} />; break;
    // case "Input": node = <Root data={data} />; break;
    // case "NumberInput": node = <Root data={data} />; break;
    // case "Slider": node = <Root data={data} />; break;
    default: node = <Generic data={data} onInteract={onInteract} />;
  }
  
  return (
    <div className="Node" style={{ top: data.state.y * 16 + "px", left: data.state.x * 16 + "px" }}>
      {node}
      {Object.values(data.children).filter(x => x).map(child => <Node key={child.uuid} data={child} onInteract={onInteract} />)}
    </div>
  );
}
