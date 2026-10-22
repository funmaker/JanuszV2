import React from 'react';
import { Button, styled } from "@mui/material";
import { ErrorResponse } from "../../../types/api";
import PageLayout from "../components/PageLayout";
import CenteredPaper from "../components/CenteredPaper";

interface ErrorPageProps {
  error: ErrorResponse;
}

export default function ErrorPage({ error }: ErrorPageProps) {
  return (
    <PageLayout>
      <CenteredPaper>
        <StyledError>
          <div className="code">{error.status}</div>
          <div className="message">{error.message}</div>
        </StyledError>
        {error.stack && <StyledStack>{error.stack}</StyledStack>}
        <Button variant="contained" href="/">Return to Home Page</Button>
      </CenteredPaper>
    </PageLayout>
  );
}

const StyledError = styled("div")`
  display: flex;
  align-items: baseline;
  font-weight: bold;
  gap: 1rem;
  
  .code {
    font-size: 12em;
    line-height: 1;
    color: ${props => props.theme.palette.text.disabled};
  }
  
  .message {
    font-size: 4em;
    color: ${props => props.theme.palette.text.secondary};
  }
`;

const StyledStack = styled("div")`
  max-width: 100%;
  padding: 1em;
  white-space: pre-wrap;
  font-family: Consolas, 'Lucida Console', Monaco, monospace;
`;
