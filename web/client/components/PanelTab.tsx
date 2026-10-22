import React from "react";
import { styled } from "@mui/material";
import { transientOptions } from "../helpers/utils";

interface PanelTabProps {
  children: React.ReactNode;
  active?: boolean;
  draggable?: boolean;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
  onDragStart?: (ev: React.DragEvent) => void;
  onDragEnd?: (ev: React.DragEvent) => void;
}

export default function PanelTab({ children, active = false, disabled = false, ...rest }: PanelTabProps) {
  return (
    <StyledPanelTab $active={active} $disabled={disabled} {...rest}>
      {children}
    </StyledPanelTab>
  );
}

export const StyledPanelTab = styled("div", transientOptions)<{ $active?: boolean; $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 0 1em;
  height: 3em;
  border-right: 1px solid rgba(127, 127, 127, 0.3);
  background-color: ${props => props.$active ? props.theme.palette.background.tabActive : props.theme.palette.background.tabs};
  color: ${props => props.$disabled ? "rgba(255, 255, 255, 0.6)" : "white"};
  font-weight: ${props => props.$active ? "bold" : "normal"};
  white-space: nowrap;
  user-select: none;
  cursor: ${props => props.$disabled ? "default" : props.draggable ? "move" : "pointer"};
  transition: 0.1s background-color;
  
  &:hover {
    background-color: ${props => props.$disabled || props.$active ? undefined : props.theme.palette.background.tabHover};
  }
`;
