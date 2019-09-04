import React from "react";
import Node from "./Node";

export default function Root({ data, onInteract }) {
  return (
    <div className="Root" style={{ width: data.state.width * 16 + "px", height: data.state.height * 16 + "px" }}>
      {Object.values(data.children).filter(x => x).map(child => <Node key={child.uuid} data={child} onInteract={onInteract} />)}
    </div>
  );
}
