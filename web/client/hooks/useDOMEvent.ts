import { useEffect, useEffectEvent } from "react";

export default function useDOMEvent<K extends keyof DocumentEventMap>(type: K, listener: (ev: DocumentEventMap[K]) => void, active = true) {
  const handler = useEffectEvent(listener);
  
  useEffect(() => {
    if(!active) return;
    
    const callback = (ev: DocumentEventMap[K]) => handler(ev);
    document.addEventListener(type, callback);
    return () => document.removeEventListener(type, callback);
  }, [type, active]);
}
