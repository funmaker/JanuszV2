import React from "react";
import { styled } from "@mui/material";
import useNumberDrag from "./useNumberDrag";
import { InterfaceProps } from "./types";

export default function Slider(props: InterfaceProps) {
  const { vertical, length, size, title } = props.data.state as { vertical: boolean; length: number; size: number; title: string };
  const { ref, proc, onMouseDown } = useNumberDrag<SVGSVGElement>(props, ev => (vertical ? ev.movementY : ev.movementX) / 16 / size / length);
  
  const w = vertical ? 256 : 256 * length;
  const h = vertical ? 256 * length : 256;
  
  return (
    <StyledSlider data-interactive title={title}>
      <svg xmlns="http://www.w3.org/2000/svg"
           version="1"
           width={16 * size * (vertical ? 1 : length)}
           height={16 * size * (vertical ? length : 1)}
           viewBox={`0 0 ${w} ${h}`}
           onMouseDown={onMouseDown}
           ref={ref}>
        <rect fill="#9c9c9c" x="26" y="26" width={w - 52} height={h - 52} />
        <path fill="#000e53"
              fillRule="nonzero"
              stroke="#546c9c"
              strokeWidth="8"
              d={`M ${w - 6},${h - 56} Q ${w - 6},${h - 6} ${w - 56},${h - 6}
                  H 56 Q 6,${h - 6} 6,${h - 56}
                  V 56 Q 6,6 56,6
                  H ${w - 56} Q ${w - 6},6 ${w - 6},56
                  Z
                  M ${w - 56},${h - 26} Q ${w - 26},${h - 26} ${w - 26},${h - 56}
                  V 56 Q ${w - 26},26 ${w - 56},26
                  H 56 Q 26,26 26,56
                  V ${h - 56} Q 26,${h - 26} 56,${h - 26}
                  Z`} />
        <image y={vertical ? proc * 256 * (length - 1) : 0}
               x={vertical ? 0 : proc * 256 * (length - 1)}
               href={vertical ? "/static/sliderv.png" : "/static/sliderh.png"}
               preserveAspectRatio="none"
               height="256"
               width="256" />
      </svg>
    </StyledSlider>
  );
}

const StyledSlider = styled("div")`
  line-height: 0;
  
  svg {
    cursor: grab;
  }
`;
