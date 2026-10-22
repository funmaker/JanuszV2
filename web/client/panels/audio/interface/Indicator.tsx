import React from "react";
import { Palette, styled, useTheme } from "@mui/material";
import { InterfaceProps } from "./types";

const getColors = ({ audio }: Palette): Record<string, string> => ({
  disabled: "gray",
  off: "#000e53",
  on: "#b8dcf9",
  inputOff: audio.input,
  inputOn: audio.inputActive,
  outputOff: audio.output,
  outputOn: audio.outputActive,
});

export default function Indicator({ data }: InterfaceProps) {
  const color = getColors(useTheme().palette)[data.state.color] ?? data.state.color;
  
  return (
    <StyledIndicator style={{ width: data.state.width * 16 + 2 + "px", height: data.state.height * 16 + 2 + "px", backgroundColor: color }}>
      {data.state.text}
    </StyledIndicator>
  );
}

const StyledIndicator = styled("div")`
  display: inline-block;
  margin: -1px;
  border: 2px solid #9c9c9c;
  border-radius: 8px;
  overflow: hidden;
  line-height: 14px;
  text-align: center;
  transition: background-color 0.2s;
`;
