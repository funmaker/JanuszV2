import React, { useEffect, useRef, useState } from "react";
import { useThrottledCallback } from "use-debounce";
import useDOMEvent from "../../../hooks/useDOMEvent";
import { InterfaceProps } from "./types";

export const toLinear = (value: number, logScale: number) => Math.sign(value) * Math.abs(value) ** (2 ** logScale);
export const fromLinear = (value: number, logScale: number) => Math.sign(value) * Math.abs(value) ** (1 / 2 ** logScale);

export function valueToProc(value: number, min: number, max: number, logScale: number) {
  const linMin = toLinear(min, logScale);
  const linMax = toLinear(max, logScale);
  return (toLinear(value, logScale) - linMin) / (linMax - linMin);
}

export function procToValue(proc: number, min: number, max: number, logScale: number) {
  const linMin = toLinear(min, logScale);
  const linMax = toLinear(max, logScale);
  return fromLinear(linMin + Math.min(Math.max(proc, 0), 1) * (linMax - linMin), logScale);
}

// Pointer-locked dragging of a numeric control. `getDelta` maps mouse movement to a change in the 0..1 range.
export default function useNumberDrag<E extends Element>({ data, onInteract }: InterfaceProps, getDelta: (ev: MouseEvent, proc: number) => number) {
  const ref = useRef<E>(null);
  const dragValue = useRef<number | null>(null);
  const [value, setValue] = useState<number | null>(null);
  const { min, max, logScale, title } = data.state as { min: number; max: number; logScale: number; title: string };
  
  const send = useThrottledCallback((value: number) => {
    onInteract(data.uuid, { value: Math.min(Math.max(value, min), max) });
  }, 100, { leading: false, trailing: true });
  
  useEffect(() => () => send.cancel(), [send]);
  
  useDOMEvent("pointerlockchange", () => {
    if(document.pointerLockElement && document.pointerLockElement === ref.current) {
      dragValue.current = data.state.value;
      setValue(data.state.value);
    } else if(dragValue.current !== null) {
      dragValue.current = null;
      setValue(null);
    }
  });
  
  useDOMEvent("mousemove", ev => {
    if(dragValue.current === null) return;
    
    const proc = valueToProc(dragValue.current, min, max, logScale);
    const newValue = procToValue(proc + getDelta(ev, proc) / (ev.ctrlKey ? 10 : 1), min, max, logScale);
    
    dragValue.current = newValue;
    setValue(newValue);
    send(ev.shiftKey ? Math.floor(newValue) : newValue);
  }, value !== null);
  
  useDOMEvent("mouseup", ev => {
    if(ev.button === 0) document.exitPointerLock();
  }, value !== null);
  
  const onMouseDown = (ev: React.MouseEvent) => {
    if(ev.button === 0) {
      ev.preventDefault();
      ref.current?.requestPointerLock()?.catch?.(console.error);
    } else if(ev.button === 1) {
      ev.preventDefault();
      
      const input = parseFloat(prompt(title, data.state.value) ?? "");
      if(!isNaN(input)) send(input);
    }
  };
  
  return {
    ref,
    proc: valueToProc(value ?? data.state.value, min, max, logScale),
    onMouseDown,
  };
}
