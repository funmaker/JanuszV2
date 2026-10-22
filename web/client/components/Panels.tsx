import React, { useState } from 'react';
import { darken, lighten, Paper, styled } from "@mui/material";
import { findClientModule } from "../panels";
import { getDragData, markDragHandled, startDrag } from "../helpers/dragData";
import PanelTab from "./PanelTab";
import SplitPane from "./SplitPane";
import { getAt, isSplit, LayoutUpdater, PanelPath, PanelsLayout, parseSource, removeSource, setAt } from "./panelsLayout";

interface PanelsProps {
  layout: PanelsLayout;
  path?: PanelPath;
  onUpdate?: (updater: LayoutUpdater) => void;
  readOnly?: boolean;
  extraTab?: React.ReactNode;
}

function onDragOver(ev: React.DragEvent) {
  if(getDragData("januszTab") === "true") {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
  }
}

// Moves the dragged tab into the place computed by `insert`. Both happen in a single update.
function dropTab(ev: React.DragEvent, onUpdate: ((updater: LayoutUpdater) => void) | undefined, insert: (layout: PanelsLayout, name: string) => PanelsLayout) {
  if(getDragData("januszTab") !== "true" || !onUpdate) return;
  ev.preventDefault();
  ev.stopPropagation();
  
  const name = getDragData("name");
  const source = parseSource(getDragData("source"));
  if(!name) return;
  
  markDragHandled();
  onUpdate(layout => insert(removeSource(layout, source), name));
}

export default function Panels({ layout, path = [], onUpdate, readOnly, extraTab }: PanelsProps) {
  const [activeTab, setActiveTab] = useState(0);
  
  if(layout === null) {
    return (
      <StyledEmpty elevation={0}
                   onDragOver={onDragOver}
                   onDrop={ev => dropTab(ev, onUpdate, (layout, name) => setAt(layout, path, [name]))} />
    );
  } else if(isSplit(layout)) {
    return (
      <SplitPane vertical={layout.vertical}
                 size={layout.size}
                 onChange={size => onUpdate?.(root => {
                   const current = getAt(root, path);
                   return isSplit(current) ? setAt(root, path, { ...current, size }) : root;
                 })}
                 first={<Panels layout={layout.first} path={[...path, "first"]} onUpdate={onUpdate} readOnly={readOnly} />}
                 second={<Panels layout={layout.second} path={[...path, "second"]} onUpdate={onUpdate} readOnly={readOnly} />} />
    );
  }
  
  const active = activeTab < layout.length ? activeTab : 0;
  const Panel = findClientModule(layout[active])?.Panel;
  
  const onTabsDrop = (ev: React.DragEvent) => dropTab(ev, onUpdate, (root, name) => {
    const tabs = getAt(root, path);
    return setAt(root, path, Array.isArray(tabs) ? [...tabs, name] : [name]);
  });
  
  const onContentDrop = (ev: React.DragEvent) => {
    const rect = ev.currentTarget.getBoundingClientRect();
    const x = (ev.clientX - rect.left) / (rect.right - rect.left);
    const y = (ev.clientY - rect.top) / (rect.bottom - rect.top);
    
    dropTab(ev, onUpdate, (root, name) => {
      const current = getAt(root, path);
      const vertical = Math.abs(x - 0.5) > Math.abs(y - 0.5);
      const after = vertical ? x > 0.5 : y > 0.5;
      
      return setAt(root, path, {
        vertical,
        first: after ? current : [name],
        second: after ? [name] : current,
      });
    });
  };
  
  return (
    <StyledPanels elevation={1}>
      <div className="tabs" onDragOver={onDragOver} onDrop={onTabsDrop}>
        <div className="scrollWrap">
          {layout.map((panel, id) => (
            <PanelTab key={id}
                      active={id === active}
                      draggable={!readOnly}
                      onClick={() => setActiveTab(id)}
                      onDragStart={ev => startDrag(ev, { januszTab: "true", name: panel, source: JSON.stringify({ path, index: id }) })}
                      onDragEnd={() => {
                        if(getDragData("remove") === "true" && getDragData("handled") !== "true") onUpdate?.(root => removeSource(root, { path, index: id }));
                      }}>
              {panel}
            </PanelTab>
          ),
          )}
        </div>
        {extraTab}
      </div>
      <div className="content" onDragOver={onDragOver} onDrop={onContentDrop}>
        {Panel ? <Panel /> : null}
      </div>
    </StyledPanels>
  );
}

const StyledPanels = styled(Paper)`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow: hidden;
  background: ${props => props.theme.palette.background.panel}; // Also drops the dark mode elevation overlay
  
  & > .tabs {
    display: flex;
    flex: 0 0 auto;
    background-color: ${props => props.theme.palette.background.tabs};
    
    .scrollWrap {
      flex: 1;
      overflow-x: auto;
      white-space: nowrap;
    }
  }
  
  & > .content {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
`;

const StyledEmpty = styled(Paper)`
  position: relative;
  flex: 1;
  width: 100%;
  background-color: ${props => props.theme.palette.background.empty};
  
  &::after {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    content: "NO PANEL";
    color: ${props => props.theme.palette.background.empty};
    font-size: 50px;
    font-weight: bold;
    text-shadow: 2px 2px ${props => darken(props.theme.palette.background.empty, 0.08)}, -2px -2px ${props => lighten(props.theme.palette.background.empty, 0.08)};
    white-space: nowrap;
  }
`;
