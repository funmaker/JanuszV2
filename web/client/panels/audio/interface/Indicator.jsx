import React from "react";

const colors = {
  disabled: "gray",
  off: "#000e53",
  on: "#b8dcf9",
  inputOff: "#a24141",
  inputOn: "#c44949",
  outputOff: "#42a142",
  outputOn: "#48c648",
};

export default function Indicator({ data }) {
  let color;
  
  if(colors[data.state.color]) color = colors[data.state.color];
  else color = data.state.color;
  
  return (
    <div className="Indicator" style={{ width: data.state.width * 16 + 2 + "px", height: data.state.height * 16 + 2 + "px", backgroundColor: color }}>
      { data.state.text }
    </div>
  );
}
