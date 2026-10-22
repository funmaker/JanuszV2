import React from 'react';
import { styled, useTheme } from "@mui/material";
import { removeTabDropTarget } from "../helpers/dragData";

interface LogoProps {
  compact?: boolean;
}

export default function Logo({ compact }: LogoProps) {
  const theme = useTheme();
  
  return (
    <StyledLogo {...removeTabDropTarget}>
      <img src={theme.palette.mode === "dark" ? "/static/logo_dark.png" : "/static/logo.png"} alt="Janusz" style={{ maxWidth: compact ? 300 : undefined }} />
    </StyledLogo>
  );
}

const StyledLogo = styled("div")`
  text-align: center;
  line-height: 0;
  
  img {
    width: calc(100% - 2em);
    max-width: 700px;
  }
`;
