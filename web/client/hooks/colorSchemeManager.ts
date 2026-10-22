import type { StorageManager } from '@mui/material/styles';
import { COLOR_SCHEME_KEY, parseColorScheme } from "../theme";

// Like MUI's localStorage manager, but also stores the choice in a cookie so the server can render the right scheme
function setCookie(name: string, value: string) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(name: string) {
  for(const cookie of document.cookie.split(";")) {
    const [cookieName, ...rest] = cookie.trim().split("=");
    if(cookieName === name) return decodeURIComponent(rest.join("="));
  }
  
  return null;
}

interface StorageManagerParams {
  key: string;
}

export default function colorSchemeManager({ key }: StorageManagerParams): ReturnType<StorageManager> {
  return {
    get: defaultValue => {
      if(typeof window === 'undefined') return defaultValue;
      
      const value = getCookie(key);
      if(value === null) return defaultValue;
      else if(key === COLOR_SCHEME_KEY) return parseColorScheme(value);
      else return value;
    },
    set: value => {
      if(typeof window === 'undefined') return;
      setCookie(key, value);
      try {
        window.localStorage.setItem(key, value);
      } catch(e) {
        void e;
      }
    },
    subscribe: handler => {
      if(typeof window === 'undefined') return () => {};
      
      const listener = (event: StorageEvent) => {
        if(event.key === key) handler(event.newValue);
      };
      
      window.addEventListener('storage', listener);
      return () => window.removeEventListener('storage', listener);
    },
  };
}
