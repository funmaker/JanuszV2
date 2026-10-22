import React, { useRef, useState } from "react";
import { styled } from "@mui/material";
import { transientOptions } from "../helpers/utils";

const MIN_SIZE = 96;
const MAX_SIZE_REST = 110;

interface SplitPaneProps {
  vertical: boolean;
  size?: number;
  onChange: (size: number) => void;
  first: React.ReactNode;
  second: React.ReactNode;
}

function sizeToBasis(size: number | undefined) {
  if(size === undefined) return "50%";
  if(size > 1) return `${size}px`; // Legacy pixel sizes
  return `${size * 100}%`;
}

export default function SplitPane({ vertical, size, onChange, first, second }: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragSize, setDragSize] = useState<number | null>(null);
  
  const getSize = (ev: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if(!rect) return null;
    
    const total = vertical ? rect.width : rect.height;
    let pos = vertical ? ev.clientX - rect.left : ev.clientY - rect.top;
    pos = Math.min(Math.max(pos, MIN_SIZE), total - MAX_SIZE_REST);
    return pos / total;
  };
  
  const onPointerDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    if(ev.button !== 0) return;
    ev.preventDefault();
    ev.currentTarget.setPointerCapture(ev.pointerId);
    setDragSize(getSize(ev));
  };
  
  const onPointerMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    if(dragSize === null) return;
    setDragSize(getSize(ev));
  };
  
  const onPointerUp = (ev: React.PointerEvent<HTMLDivElement>) => {
    if(dragSize === null) return;
    ev.currentTarget.releasePointerCapture(ev.pointerId);
    const newSize = getSize(ev) ?? dragSize;
    setDragSize(null);
    onChange(newSize);
  };
  
  return (
    <StyledSplitPane ref={containerRef} $vertical={vertical}>
      <div className="pane first" style={{ flexBasis: sizeToBasis(dragSize ?? size) }}>{first}</div>
      <div className="resizer"
           onPointerDown={onPointerDown}
           onPointerMove={onPointerMove}
           onPointerUp={onPointerUp}
           onPointerCancel={onPointerUp} />
      <div className="pane second">{second}</div>
    </StyledSplitPane>
  );
}

const StyledSplitPane = styled("div", transientOptions)<{ $vertical: boolean }>`
  display: flex;
  flex-direction: ${props => props.$vertical ? "row" : "column"};
  width: 100%;
  height: 100%;
  
  & > .pane {
    position: relative;
    display: flex;
    overflow: hidden;
    min-width: 0;
    min-height: 0;
    
    &.first {
      flex-grow: 0;
      flex-shrink: 0;
    }
    
    &.second {
      flex: 1 1 0;
    }
  }
  
  & > .resizer {
    flex: 0 0 1em;
    background: #000;
    opacity: 0;
    transition: opacity 0.2s ease;
    cursor: ${props => props.$vertical ? "col-resize" : "row-resize"};
    touch-action: none;
    
    &:hover {
      opacity: 0.2;
    }
  }
`;
