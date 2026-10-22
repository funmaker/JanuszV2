import React, { useEffect, useRef, useState } from "react";
import { styled } from "@mui/material";
import useFranku from "./frankuStore";

const TOLERANCE = 120;
const TARGET = [44, 255, 26];

function chromaKey(frame: ImageData) {
  const [targetRed, targetGreen, targetBlue] = TARGET;
  
  for(let n = 0; n < frame.data.length; n += 4) {
    const [r, g, b] = [frame.data[n], frame.data[n + 1], frame.data[n + 2]];
    const diff = Math.abs(r - targetRed) + Math.abs(g - targetGreen) + Math.abs(b - targetBlue);
    
    if(diff < TOLERANCE) {
      frame.data[n + 3] = 0;
    } else if(diff < TOLERANCE * 2) {
      frame.data[n] = r + (r - targetRed) * (2 - diff / TOLERANCE) * 10;
      frame.data[n + 1] = g + (g - targetGreen) * (2 - diff / TOLERANCE) * 10;
      frame.data[n + 2] = b + (b - targetBlue) * (2 - diff / TOLERANCE) * 10;
      frame.data[n + 3] = 255 * (diff / TOLERANCE - 1);
    }
  }
}

export default function Franku() {
  const { counter } = useFranku();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  
  useEffect(() => {
    const video = videoRef.current = document.createElement("video");
    video.src = "/static/franku.webm";
    let drawRequest: number | null = null;
    
    const draw = () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d", { willReadFrequently: true });
      if(canvas && context && video.videoWidth) {
        const width = canvas.width = video.videoWidth;
        const height = canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0, width, height);
        const frame = context.getImageData(0, 0, width, height);
        chromaKey(frame);
        context.putImageData(frame, 0, 0);
      }
      
      drawRequest = requestAnimationFrame(draw);
    };
    
    const stop = () => {
      if(drawRequest !== null) cancelAnimationFrame(drawRequest);
      drawRequest = null;
    };
    
    video.onplaying = () => {
      setPlaying(true);
      stop();
      drawRequest = requestAnimationFrame(draw);
    };
    video.onended = () => {
      setPlaying(false);
      stop();
    };
    
    return () => {
      stop();
      video.pause();
      videoRef.current = null;
    };
  }, []);
  
  useEffect(() => {
    const video = videoRef.current;
    if(counter >= 6 && video?.paused) video.play().catch(console.error);
  }, [counter]);
  
  return (
    <StyledFranku>
      <canvas ref={canvasRef} width="854" height="480" hidden={!playing} />
    </StyledFranku>
  );
}

const StyledFranku = styled("div")`
  position: absolute;
  line-height: 0;
  bottom: 0;
  right: 0;
  z-index: 10;
  pointer-events: none;
  
  canvas {
    max-width: 100%;
  }
`;
