import React from "react";
import { styled } from "@mui/material";
import Logo from "./Logo";

interface PageLayoutProps {
  children: React.ReactNode;
  compact?: boolean;
}

export default function PageLayout({ children, compact }: PageLayoutProps) {
  return (
    <StyledPageLayout>
      <Logo compact={compact} />
      {children}
    </StyledPageLayout>
  );
}

const StyledPageLayout = styled("div")`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 1em;
  padding: 1em;
  background-color: ${props => props.theme.palette.background.default};
  
  & > *:not(:first-of-type) {
    flex: 1;
    min-height: 0;
  }
`;
