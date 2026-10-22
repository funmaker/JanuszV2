import React from "react";
import { Paper, styled } from "@mui/material";

interface CenteredPaperProps {
  children: React.ReactNode;
}

export default function CenteredPaper({ children }: CenteredPaperProps) {
  return (
    <StyledWrapper elevation={0}>
      {children}
    </StyledWrapper>
  );
}

const StyledWrapper = styled(Paper)`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: auto;
  background-color: ${props => props.theme.palette.background.empty};
`;
