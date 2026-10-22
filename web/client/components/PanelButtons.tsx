import React from "react";
import { ButtonGroup, ButtonGroupProps, styled } from "@mui/material";

export default function PanelButtons(props: ButtonGroupProps) {
  return <StyledPanelButtons variant="contained" color="inherit" size="small" {...props} />;
}

const StyledPanelButtons = styled(ButtonGroup)`
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 10;
  height: 2.5em;
  border-radius: 0 4px 0 0;
  
  & > .MuiButton-root {
    min-width: 0;
    padding: 0 0.9em;
    border-radius: 0;
    border-color: ${props => props.theme.palette.divider} !important;
  }
  
  & > *:last-child {
    border-top-right-radius: 4px;
  }
`;
