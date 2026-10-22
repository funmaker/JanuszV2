import { useCallback, useEffect, useReducer, useState } from "react";
import { Canceler } from "axios";
import requestJSON from "../helpers/requestJSON";

interface RequestResult<T> {
  key: string;
  data: T | null;
}

export default function useRequest<T>(url: string | null, search?: Record<string, unknown>) {
  const [counter, refresh] = useReducer((acc: number) => acc + 1, 0);
  const [result, setResult] = useState<RequestResult<T> | null>(null);
  const searchKey = JSON.stringify(search ?? {});
  const key = url && `${counter}:${url}:${searchKey}`;
  
  useEffect(() => {
    if(!url || !key) return;
    
    let cancel: Canceler | null = null;
    requestJSON<T>({ url, search: JSON.parse(searchKey), cancelCb: c => { cancel = c; } })
      .then(data => setResult({ key, data }))
      .catch(() => setResult(result => ({ key, data: result?.data ?? null })));
    
    return () => cancel?.();
  }, [url, key, searchKey]);
  
  const setData = useCallback((fn: (data: T) => T) => setResult(result => result?.data ? { ...result, data: fn(result.data) } : result), []);
  
  return {
    data: result?.data ?? null,
    loading: !!key && result?.key !== key,
    refresh,
    setData,
  };
}
