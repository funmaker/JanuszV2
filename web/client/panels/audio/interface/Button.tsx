import React from "react";
import { styled } from "@mui/material";
import ShuffleIcon from '@mui/icons-material/Shuffle';
import CloseIcon from '@mui/icons-material/Close';
import { InterfaceProps } from "./types";

const icons: Record<string, typeof CloseIcon> = {
  shuffle: ShuffleIcon,
  close: CloseIcon,
};

export default function Button({ data, onInteract }: InterfaceProps) {
  const { toggle, value, size, icon } = data.state as { toggle: boolean; value: boolean; size: number; icon: string | null };
  const Icon = icon ? icons[icon] : null;
  
  const onMouseDown = () => {
    if(!toggle) onInteract(data.uuid, { value: true });
  };
  
  const onMouseUp = () => {
    if(!toggle) onInteract(data.uuid, { value: false });
  };
  
  const onClick = () => {
    if(toggle) onInteract(data.uuid, { value: !value });
  };
  
  return (
    <StyledButton data-interactive>
      <svg xmlns="http://www.w3.org/2000/svg"
           width={size * 16}
           height={size * 16}
           viewBox="0 0 256 256"
           version="1"
           onMouseDown={onMouseDown}
           onMouseUp={onMouseUp}
           onClick={onClick}>
        <path style={{ fill: value ? "#b8dcf9" : "#000e53" }}
              fillRule="nonzero"
              stroke="#546c9c"
              strokeWidth="8"
              d="M 250,200 Q 250,250 200,250
                 H 56 Q 6,250 6,200
                 V 56 Q 6,6 56,6
                 H 200 Q 250,6 250,56
                 Z
                 M 200,230 Q 230,230 230,200
                 V 56 Q 230,26 200,26
                 H 56 Q 26,26 26,56
                 V 200 Q 26,230 56,230
                 Z" />
        <image y="0" x="0" href="/static/button.png" preserveAspectRatio="none" height="256" width="256" />
      </svg>
      {Icon && <Icon className="icon" style={{ fontSize: size * 9 + "px" }} />}
    </StyledButton>
  );
}

const StyledButton = styled("div")`
  position: relative;
  line-height: 0;
  cursor: pointer;
  
  .icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: black;
    opacity: 0.75;
    filter: drop-shadow(1px 1px 0 white) drop-shadow(-1px -1px 0 gray);
    pointer-events: none;
  }
  
  path {
    transition: fill 0.2s;
  }
`;
