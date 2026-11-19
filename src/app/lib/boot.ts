import { useEffect, useState } from 'react';

/**
 * "Site ready": the loading screen has lifted. Intro animations (the hero's arriving light,
 * the headline writing itself) wait for it, so they play in view instead of behind the loader.
 */
let ready = false;
const listeners = new Set<() => void>();

export function markSiteReady() {
  if (ready) return;
  ready = true;
  window.dispatchEvent(new Event('site-ready'));
  listeners.forEach((fn) => fn());
  listeners.clear();
}

export function isSiteReady() {
  return ready;
}

export function useSiteReady() {
  const [value, setValue] = useState(ready);
  useEffect(() => {
    if (ready) {
      setValue(true);
      return;
    }
    const fn = () => setValue(true);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return value;
}
