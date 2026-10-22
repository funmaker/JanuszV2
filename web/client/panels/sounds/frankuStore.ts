import { useSyncExternalStore } from "react";
import isNode from "detect-node";

interface FrankuState {
  counter: number;
  triggered: boolean;
}

let state: FrankuState = { counter: 0, triggered: false };
const listeners = new Set<() => void>();

function setCounter(counter: number) {
  let triggered = state.triggered;
  if(counter >= 3) triggered = true;
  else if(counter === 0) triggered = false;
  
  state = { counter, triggered };
  listeners.forEach(listener => listener());
}

if(!isNode) {
  setInterval(() => {
    if(state.counter > 0) setCounter(state.counter - 1);
  }, 1000);
}

export function trigger() {
  setCounter(state.counter + 1);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

const serverState: FrankuState = { counter: 0, triggered: false };

export default function useFranku() {
  return useSyncExternalStore(subscribe, () => state, () => serverState);
}
