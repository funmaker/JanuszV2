import React, { useRef, useState } from 'react';
import { useLocation } from "wouter";
import { Button, Paper, styled, TextField, Typography } from "@mui/material";
import { LoginRequest, LoginResponse } from "../../../types/api";
import PageLayout from "../components/PageLayout";
import CenteredPaper from "../components/CenteredPaper";
import requestJSON from "../helpers/requestJSON";
import useAsyncCallback from "../hooks/useAsyncCallback";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [wrongPassword, setWrongPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [onSubmit, loading] = useAsyncCallback(async (ev: React.FormEvent) => {
    ev.preventDefault();
    
    const response = await requestJSON<LoginResponse, LoginRequest>({
      url: "/core/login",
      method: "POST",
      data: { password },
    });
    
    if(response.success) {
      navigate("/");
    } else {
      setWrongPassword(true);
      setPassword("");
      inputRef.current?.focus();
    }
  });
  
  return (
    <PageLayout>
      <CenteredPaper>
        <StyledForm elevation={2} component="form" onSubmit={onSubmit}>
          <Typography variant="h6">Prove yourself worthy</Typography>
          <div className="row">
            <TextField name="password"
                       type="password"
                       size="small"
                       label="Password"
                       autoFocus
                       value={password}
                       inputRef={inputRef}
                       error={wrongPassword}
                       helperText={wrongPassword ? "Wrong password" : " "}
                       onChange={ev => { setPassword(ev.target.value); setWrongPassword(false); }} />
            <Button type="submit" variant="contained" loading={loading}>Login</Button>
          </div>
        </StyledForm>
      </CenteredPaper>
    </PageLayout>
  );
}

const StyledForm = styled(Paper)`
  display: flex;
  flex-direction: column;
  gap: 1em;
  padding: 1.5em;
  
  .row {
    display: flex;
    align-items: flex-start;
    gap: 0.5em;
    
    .MuiTextField-root {
      width: 300px;
    }
    
    button {
      height: 40px;
    }
  }
` as typeof Paper; // styled() drops the polymorphic `component` prop typing
