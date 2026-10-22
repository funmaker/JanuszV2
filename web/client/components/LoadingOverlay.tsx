import React from "react";
import { alpha, CircularProgress, keyframes, styled } from "@mui/material";
import { transientOptions } from "../helpers/utils";

interface LoadingOverlayProps {
  active: boolean;
  dark?: boolean;
}

export default function LoadingOverlay({ active, dark = false }: LoadingOverlayProps) {
  if(!active) return null;
  
  return (
    <StyledLoadingOverlay $dark={dark}>
      <CircularProgress color={dark ? "inherit" : "primary"} />
    </StyledLoadingOverlay>
  );
}

const showOverlay = keyframes`
  from {
    opacity: 0;
    pointer-events: none;
  }
  
  to {
    opacity: 1;
    pointer-events: auto;
  }
`;

const StyledLoadingOverlay = styled("div", transientOptions)<{ $dark: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background-color: ${props => props.$dark ? "rgba(0, 0, 0, 0.75)" : alpha(props.theme.palette.background.paper, 0.75)};
  cursor: wait;
  animation: ${showOverlay} 1s ease-in 0.5s both;
`;
