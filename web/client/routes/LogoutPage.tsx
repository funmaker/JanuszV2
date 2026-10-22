import React, { useEffect } from 'react';
import { useLocation } from "wouter";
import { CircularProgress, Typography } from "@mui/material";
import PageLayout from "../components/PageLayout";
import CenteredPaper from "../components/CenteredPaper";
import requestJSON from "../helpers/requestJSON";

export default function LogoutPage() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    requestJSON({ url: "/core/logout", method: "POST" })
      .then(() => navigate("/core/login"))
      .catch(console.error);
  }, [navigate]);
  
  return (
    <PageLayout>
      <CenteredPaper>
        <CircularProgress />
        <Typography variant="h6">Please wait...</Typography>
      </CenteredPaper>
    </PageLayout>
  );
}
