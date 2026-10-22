import { styled } from "@mui/material";

const PanelScroll = styled("div")`
  position: absolute;
  inset: 0;
  padding: 1em 1em 0;
  overflow-y: auto;
  
  &::after { // Space for the panel buttons
    content: "";
    display: block;
    height: 4em;
  }
`;

export default PanelScroll;
