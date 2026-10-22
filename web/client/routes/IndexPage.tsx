import React, { useCallback, useEffect, useState } from 'react';
import { useMediaQuery } from "@mui/material";
import PageLayout from "../components/PageLayout";
import Panels from "../components/Panels";
import Modules, { ExtraTabs } from "../components/Modules";
import { LayoutUpdater, PanelsLayout, reduceLayout } from "../components/panelsLayout";
import { clientModules } from "../panels";

const STORAGE_KEY = "panels";

function loadPanels(): PanelsLayout {
  try {
    return reduceLayout(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));
  } catch(e) {
    console.error(e);
    return null;
  }
}

function savePanels(panels: PanelsLayout) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
  } catch(e) {
    console.error(e);
  }
}

export default function IndexPage() {
  const [panels, setPanels] = useState<PanelsLayout | undefined>(undefined);
  const mobile = useMediaQuery("(max-width: 800px), (pointer: coarse)", { noSsr: false });
  
  useEffect(() => {
    setPanels(loadPanels()); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);
  
  useEffect(() => {
    if(panels !== undefined) savePanels(panels);
  }, [panels]);
  
  const onUpdate = useCallback((updater: LayoutUpdater) => {
    setPanels(panels => reduceLayout(updater(panels ?? null)));
  }, []);
  
  return (
    <PageLayout compact={mobile}>
      {mobile
? (
        <Panels layout={clientModules.map(mod => mod.name)} readOnly extraTab={<ExtraTabs />} />
      )
: (
        <>
          <Panels layout={panels ?? null} onUpdate={onUpdate} />
          <Modules />
        </>
      )}
    </PageLayout>
  );
}
