import { useCallback, useLayoutEffect, useRef, useState } from "react";

// Wraps an async callback into a fire-and-forget handler that ignores calls while the previous one is still running.
export default function useAsyncCallback<Args extends any[]>(callback: (...args: Args) => Promise<unknown>) {
  const [loading, setLoading] = useState(false);
  const executing = useRef(false);
  const callbackRef = useRef(callback);
  
  useLayoutEffect(() => {
    callbackRef.current = callback;
  });
  
  const wrapped = useCallback((...args: Args) => {
    if(executing.current) return;
    
    executing.current = true;
    setLoading(true);
    
    callbackRef.current(...args)
      .catch(console.error)
      .finally(() => {
        executing.current = false;
        setLoading(false);
      });
  }, []);
  
  return [wrapped, loading] as const;
}
