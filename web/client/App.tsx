import React, { useEffect, useState } from 'react';
import { Redirect, Route, Router, Switch, useLocation } from "wouter";
import { CssBaseline, ThemeProvider } from '@mui/material';
import { toast, ToastContainer } from "react-toastify";
import { InitialData } from "../../types/api";
import { SSRProvider } from "./hooks/useSSR";
import colorSchemeManager from "./hooks/colorSchemeManager";
import IndexPage from "./routes/IndexPage";
import LoginPage from "./routes/LoginPage";
import LogoutPage from "./routes/LogoutPage";
import ErrorPage from "./routes/ErrorPage";
import theme, { COLOR_SCHEME_KEY } from "./theme";
import "./globals.css";

interface AppProps {
  initialData: InitialData;
}

export default function App({ initialData }: AppProps) {
  const [location] = useLocation();
  const [errorLocation] = useState(location);
  const error = location === errorLocation ? initialData?._error : undefined;
  
  useEffect(() => {
    const initialError = initialData?._error;
    if(initialError && initialError.status !== 404) {
      toast.error(initialError.message || "Something Happened");
    }
  }, [initialData]);
  
  return (
    <ThemeProvider theme={theme}
                   noSsr
                   defaultMode={initialData._colorScheme}
                   modeStorageKey={COLOR_SCHEME_KEY}
                   storageManager={colorSchemeManager}>
      <CssBaseline enableColorScheme />
      <SSRProvider>
        <Router>
          {error
? <ErrorPage error={error} />
: (
            <Switch>
              <Route path="/"><IndexPage /></Route>
              <Route path="/core/login"><LoginPage /></Route>
              <Route path="/core/logout"><LogoutPage /></Route>
              <Route><Redirect to="/" /></Route>
            </Switch>
          )}
          <ToastContainer position="bottom-right" newestOnTop />
        </Router>
      </SSRProvider>
    </ThemeProvider>
  );
}
