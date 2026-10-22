import React from "react";
import { styled } from "@mui/material";
import { InterfaceProps } from "./types";

interface DropdownOption {
  text: string;
  value: string;
}

export default function Dropdown({ data, onInteract }: InterfaceProps) {
  const { options, value, size, defaultText, clearable } = data.state as { options: DropdownOption[]; value: string | null; size: number; defaultText: string; clearable: boolean };
  
  return (
    <StyledDropdown data-interactive
                    value={value ?? ""}
                    style={{ width: 16 * size + "px" }}
                    onChange={ev => onInteract(data.uuid, { value: ev.target.value || null })}>
      <option value="" disabled={!clearable}>{defaultText}</option>
      {options.map(option => <option key={option.value} value={option.value}>{option.text}</option>)}
    </StyledDropdown>
  );
}

const StyledDropdown = styled("select")`
  display: block;
  height: 18px;
  margin: -1px;
  padding: 0 2px;
  border: 2px solid #546c9c;
  border-radius: 8px;
  background: #000e53;
  color: #b8dcf9;
  font-family: "courier new", courier, monospace;
  font-size: 13px;
  font-weight: bold;
  line-height: 14px;
  outline: none;
  cursor: pointer;
  
  option {
    background: #000e53;
    color: #b8dcf9;
  }
`;
