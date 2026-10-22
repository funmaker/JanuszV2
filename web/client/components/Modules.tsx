import React from "react";
import { Paper, styled, useColorScheme } from "@mui/material";
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { clientModules } from "../panels";
import { removeTabDropTarget, startDrag } from "../helpers/dragData";
import Link from "./Link";
import PanelTab, { StyledPanelTab } from "./PanelTab";

export function ExtraTabs() {
  const { mode, setMode } = useColorScheme();
  const dark = mode === "dark";
  
  return (
    <>
      <StyledExtraTab title={dark ? "Light mode" : "Dark mode"} onClick={() => setMode(dark ? "light" : "dark")}>
        {dark ? <LightModeIcon /> : <DarkModeIcon />}
      </StyledExtraTab>
      <Link to="/core/logout" noMui title="Logout">
        <StyledExtraTab className="logout"><PowerSettingsNewIcon /></StyledExtraTab>
      </Link>
    </>
  );
}

export default function Modules() {
  return (
    <StyledModules elevation={1} {...removeTabDropTarget}>
      <div className="scrollWrap">
        <PanelTab disabled>Available Panels:</PanelTab>
        {clientModules.map(mod => (
          <PanelTab key={mod.name} draggable onDragStart={ev => startDrag(ev, { januszTab: "true", name: mod.name, source: "" })}>
            {mod.name}
          </PanelTab>
        ),
        )}
      </div>
      <ExtraTabs />
    </StyledModules>
  );
}

const StyledModules = styled(Paper)`
  display: flex;
  flex: 0 0 auto !important;
  overflow: hidden;
  background: ${props => props.theme.palette.background.tabs}; // Also drops the dark mode elevation overlay
  
  .scrollWrap {
    flex: 1;
    overflow-x: auto;
    white-space: nowrap;
  }
`;

const StyledExtraTab = styled(StyledPanelTab)`
  border-right: none;
  border-left: 1px solid rgba(127, 127, 127, 0.3);
  
  &.logout {
    color: ${props => props.theme.palette.secondary.main};
  }
`;
