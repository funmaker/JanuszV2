import React from "react";
import { styled } from "@mui/material";
import { InterfaceProps } from "./types";

export default function Label({ data }: InterfaceProps) {
  return (
    <StyledLabel style={{ width: data.state.size * 16 + 2 + "px" }}>
      {data.state.text}
    </StyledLabel>
  );
}

const StyledLabel = styled("div")`
  display: inline-block;
  margin: -1px;
  border: 2px solid #546c9c;
  border-radius: 8px;
  overflow: hidden;
  background: #000e53;
  color: #b8dcf9;
  font-family: "courier new", courier, monospace;
  font-size: 13px;
  font-weight: bold;
  line-height: 14px;
  text-align: center;
  white-space: nowrap;
`;
