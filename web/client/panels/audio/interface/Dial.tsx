import React from "react";
import { styled } from "@mui/material";
import useNumberDrag from "./useNumberDrag";
import { InterfaceProps } from "./types";

const pos = (ang: number, radius: number) => `${128 - Math.sin((0.25 + ang * 1.5) * Math.PI) * radius},${128 + Math.cos((0.25 + ang * 1.5) * Math.PI) * radius}`;
const arc = (start: number, end: number, r1: number, r2: number) => `
  M ${pos(start, r2)}
  A ${r2},${r2} 0 ${end - start > 2 / 3 ? 1 : 0} 1 ${pos(end, r2)}
  L ${pos(end, r1)}
  A ${r1},${r1} 0 ${end - start > 2 / 3 ? 1 : 0} 0 ${pos(start, r1)}
  Z`;

export default function Dial(props: InterfaceProps) {
  const { ref, proc, onMouseDown } = useNumberDrag<SVGSVGElement>(props, (ev, proc) => (ev.movementX + ev.movementY * (proc - 0.5)) / 1000);
  
  return (
    <StyledDial data-interactive title={props.data.state.title}>
      <svg xmlns="http://www.w3.org/2000/svg"
           width="48"
           height="48"
           viewBox="0 0 256 256"
           version="1"
           onMouseDown={onMouseDown}
           ref={ref}>
        <path d={arc(-0.01, 1.01, 78, 98)} fill="#000e53" stroke="#546c9c" strokeWidth="8" />
        <path d={arc(0, proc, 82, 94)} fill="#b8dcf9" />
        <image y="32" x="32" href="/static/gauge.png" preserveAspectRatio="none" height="192" width="192" />
        <path d="m 126,126 -10,67 10,35 2,0 10,-35 -10,-67 -4,0 z" fill="#333" transform={`rotate(${45 + proc * 270} 128 128)`} />
      </svg>
    </StyledDial>
  );
}

const StyledDial = styled("div")`
  line-height: 0;
  
  svg {
    cursor: grab;
  }
`;
