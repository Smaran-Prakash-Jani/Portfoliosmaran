import { useEffect, useState } from 'react';

/**
 * Whether something bright (the marquee band) is on screen behind the fixed HUD, so the HUD's
 * corner readouts should sit on a dark backing to stay readable.
 */
let on = false;
const subs = new Set<(v: boolean) => void>();

export function setHudBackdrop(v: boolean) {
  if (v === on) return;
  on = v;
  subs.forEach((f) => f(v));
}

export function useHudBackdrop() {
  const [v, set] = useState(on);
  useEffect(() => {
    set(on);
    subs.add(set);
    return () => {
      subs.delete(set);
    };
  }, []);
  return v;
}
