import React, { useEffect, useMemo, useRef } from "react";
import { decomposeColor, hslToRgb, styled, useTheme } from "@mui/material";
import BezierEasing from "bezier-easing";
import { ConnectionStateData, DeviceStateData } from "../../../../audio/packets";
import { deviceHeight, deviceWidth, GRID, portOffset } from "./audioState";

const ease = BezierEasing(0.25, 0.1, 0.25, 1);
const EASE_DURATION = 0.2;

export interface LinkPreview {
  device: string;
  port: number;
  kind: "input" | "output";
  x: number;
  y: number;
}

interface CabblesProps {
  devices: Record<string, DeviceStateData>;
  connections: Record<string, ConnectionStateData>;
  preview: LinkPreview | null;
}

interface Point {
  x: number;
  y: number;
}

function toRGB(color: string) {
  return decomposeColor(color.startsWith("hsl") ? hslToRgb(color) : color).values.slice(0, 3);
}

function interpolateColor(from: number[], to: number[], time: number) {
  const val = ease(time);
  const color = from.map((f, id) => f + val * (to[id] - f));
  return `rgb(${color.join(", ")})`;
}

function getBounds(devices: Record<string, DeviceStateData>, preview: LinkPreview | null) {
  const rects = Object.values(devices).map(device => ({
    x1: device.posx,
    y1: device.posy,
    x2: device.posx + deviceWidth(device),
    y2: device.posy + deviceHeight(device),
  }));
  if(preview) rects.push({ x1: preview.x, y1: preview.y, x2: preview.x, y2: preview.y });
  if(rects.length === 0) return { x: 0, y: 0, width: 64, height: 64 };
  
  let { x1, y1, x2, y2 } = rects[0];
  for(const rect of rects) {
    x1 = Math.min(x1, rect.x1 - GRID);
    y1 = Math.min(y1, rect.y1 - GRID);
    x2 = Math.max(x2, rect.x2 + GRID);
    y2 = Math.max(y2, rect.y2 + GRID);
  }
  
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

interface Cable {
  fill: Path2D;
  outline: Path2D;
  activity: number;
}

const CABLE_HALF_WIDTH = 8; // Including the outline
const FILL_HALF_WIDTH = 6;
const OUTLINE_WIDTH = CABLE_HALF_WIDTH - FILL_HALF_WIDTH;
const OUTLINE_CENTER = (CABLE_HALF_WIDTH + FILL_HALF_WIDTH) / 2;

function cablePaths(from: Point, to: Point) {
  const magic = Math.sign(from.y - to.y) * Math.sign(from.x - to.x);
  const top = (path: Path2D, w: number) => path.bezierCurveTo(
    (from.x + to.x) / 2 + w * magic, from.y - w,
    (from.x + to.x) / 2 + w * magic, to.y - w,
    to.x, to.y - w,
  );
  const bottom = (path: Path2D, w: number) => path.bezierCurveTo(
    (from.x + to.x) / 2 - w * magic, to.y + w,
    (from.x + to.x) / 2 - w * magic, from.y + w,
    from.x, from.y + w,
  );
  
  const fill = new Path2D();
  fill.moveTo(from.x, from.y - FILL_HALF_WIDTH);
  top(fill, FILL_HALF_WIDTH);
  fill.lineTo(to.x, to.y + FILL_HALF_WIDTH);
  bottom(fill, FILL_HALF_WIDTH);
  fill.closePath();
  
  // Only the edges, the ends touching the ports stay open
  const outline = new Path2D();
  outline.moveTo(from.x, from.y - OUTLINE_CENTER);
  top(outline, OUTLINE_CENTER);
  outline.moveTo(to.x, to.y + OUTLINE_CENTER);
  bottom(outline, OUTLINE_CENTER);
  
  return { fill, outline };
}

export default function Cabbles({ devices, connections, preview }: CabblesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animations = useRef<Record<string, number[]>>({});
  const bounds = useMemo(() => getBounds(devices, preview), [devices, preview]);
  const { cable, cableActive, cableBorder } = useTheme().palette.audio;
  
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if(!ctx) return;
    
    const anims = animations.current;
    const offColor = toRGB(cable);
    const onColor = toRGB(cableActive);
    for(const device of Object.values(devices)) {
      if(!anims[device.uuid]) anims[device.uuid] = device.outputActivity.map(out => out ? 1 : 0);
    }
    
    const portPos = (uuid: string, port: number, isOutput: boolean): Point => ({
      x: devices[uuid].posx - bounds.x + (isOutput ? deviceWidth(devices[uuid]) : 0),
      y: devices[uuid].posy - bounds.y + portOffset(port),
    });
    
    const draw = () => {
      ctx.clearRect(0, 0, bounds.width, bounds.height);
      
      const cables: Cable[] = [];
      
      for(const con of Object.values(connections)) {
        if(!devices[con.from] || !devices[con.to]) continue;
        cables.push({
          ...cablePaths(portPos(con.from, con.output, true), portPos(con.to, con.input, false)),
          activity: anims[con.from]?.[con.output] ?? 0,
        });
      }
      
      if(preview && devices[preview.device]) {
        const port = portPos(preview.device, preview.port, preview.kind === "output");
        const pointer = { x: preview.x - bounds.x, y: preview.y - bounds.y };
        cables.push({
          ...preview.kind === "output" ? cablePaths(port, pointer) : cablePaths(pointer, port),
          activity: 0,
        });
      }
      
      // All borders go below all fills, and active cables go above inactive ones
      cables.sort((a, b) => a.activity - b.activity);
      
      ctx.strokeStyle = cableBorder;
      ctx.lineWidth = OUTLINE_WIDTH;
      for(const { outline } of cables) ctx.stroke(outline);
      
      for(const { fill, activity } of cables) {
        ctx.fillStyle = interpolateColor(offColor, onColor, activity);
        ctx.fill(fill);
      }
    };
    
    let request: number | null = null;
    let last = performance.now();
    
    const frame = (now: number) => {
      const deltaTime = (now - last) / 1000;
      last = now;
      let dirty = false;
      
      for(const device of Object.values(devices)) {
        const devAnim = anims[device.uuid];
        
        device.outputActivity.forEach((active, output) => {
          const target = active ? 1 : 0;
          if(devAnim[output] === target) return;
          dirty = true;
          if(active) devAnim[output] = Math.min((devAnim[output] ?? 0) + deltaTime / EASE_DURATION, 1);
          else devAnim[output] = Math.max((devAnim[output] ?? 0) - deltaTime / EASE_DURATION, 0);
        });
      }
      
      draw();
      request = dirty ? requestAnimationFrame(frame) : null;
    };
    
    draw();
    request = requestAnimationFrame(frame);
    
    return () => {
      if(request !== null) cancelAnimationFrame(request);
    };
  }, [devices, connections, bounds, preview, cable, cableActive, cableBorder]);
  
  return (
    <StyledCanvas ref={canvasRef}
                  width={bounds.width}
                  height={bounds.height}
                  style={{ transform: `translate(${bounds.x}px, ${bounds.y}px)` }} />
  );
}

const StyledCanvas = styled("canvas")`
  position: absolute;
  pointer-events: none;
`;
