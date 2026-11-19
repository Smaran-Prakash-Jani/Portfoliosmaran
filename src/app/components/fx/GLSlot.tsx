import React, { useEffect, useRef, useState } from 'react';

/**
 * A budget for live WebGL contexts.
 *
 * Android Chrome keeps at most 8 WebGL contexts alive per page and silently kills the oldest when
 * another is created: that effect turns into a white box with a broken-image icon. This page has
 * about ten (hero tunnel, menu tunnel, portrait, shards, four project ripples, orb, chrome), so on
 * touch devices only the effects near the viewport hold a context. When a new one is needed and
 * the budget is full, the effect farthest out of view is released and rebuilt about a screen
 * before it scrolls back in. On desktop nothing is ever released. If a browser kills a context
 * anyway, the budget shrinks to what that device evidently allows and the effect is rebuilt
 * instead of staying blank.
 *
 * `?glbudget=N` forces a budget (for testing).
 */

type Slot = {
  host: HTMLElement;
  always: boolean;
  granted: boolean;
  gen: number;
  apply: () => void;
};

const slots = new Set<Slot>();

function initialBudget(): number {
  if (typeof window === 'undefined') return Infinity;
  const forced = Number(new URLSearchParams(window.location.search).get('glbudget'));
  if (forced > 0) return forced;
  const touch = navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches;
  // 6 managed contexts leave room for the ID card in the resume panel and one spare
  return touch || /Android/i.test(navigator.userAgent) ? 6 : Infinity;
}

let budget = initialBudget();
let listening = false;
let timer = 0;

/** How far the effect's box is from the viewport, in px (0 = on screen; Infinity = not laid out). */
function distance(s: Slot, vh: number): number {
  if (s.always) return -1;
  const zone = s.host.closest('[data-gl-zone]') ?? s.host.parentElement ?? s.host;
  const r = zone.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return Infinity;
  return Math.max(0, r.top - vh, -r.bottom);
}

function rebalance() {
  timer = 0;
  const vh = window.innerHeight;
  const dist = new Map<Slot, number>();
  for (const s of slots) dist.set(s, distance(s, vh));
  // within a screen of the viewport: build it now, so it is ready before it shows
  const wanted = [...slots].filter((s) => !s.granted && dist.get(s)! < vh).sort((a, b) => dist.get(a)! - dist.get(b)!);
  let live = 0;
  for (const s of slots) if (s.granted) live++;
  for (const s of wanted) {
    if (live >= budget) {
      let victim: Slot | null = null;
      let far = vh;
      for (const g of slots) {
        const d = dist.get(g)!;
        if (g.granted && !g.always && d >= far) {
          far = d;
          victim = g;
        }
      }
      if (!victim) break;
      victim.granted = false;
      victim.apply();
      live--;
    }
    s.granted = true;
    s.gen++;
    s.apply();
    live++;
  }
}

function schedule(delay = 120) {
  if (!timer) timer = window.setTimeout(rebalance, delay);
}

const onScroll = () => schedule();

function listen() {
  if (listening || !Number.isFinite(budget)) return;
  listening = true;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}

/** A context the page did not give up: the device allows fewer than we thought. Rebuild that effect. */
function onLost(e: Event) {
  const target = e.target as Node;
  for (const s of slots) {
    if (!s.granted || !s.host.contains(target)) continue;
    let live = 0;
    for (const x of slots) if (x.granted) live++;
    budget = Math.max(3, Math.min(budget, live - 2));
    s.granted = false;
    s.apply();
    listen();
    schedule(250);
    return;
  }
}

if (typeof window !== 'undefined') {
  // contextlost does not bubble, but the capture phase still reaches window for canvases in the page
  window.addEventListener('webglcontextlost', onLost, true);
}

/**
 * Wrap a WebGL effect. Its children mount only while it holds a context (always, on desktop);
 * `fallback` shows meanwhile. The effect is measured by its parent element, or by the nearest
 * `[data-gl-zone]` ancestor. `always` effects (the menu backdrop) are never released.
 * Children must release their context (WEBGL_lose_context) when they unmount.
 */
export function GLSlot({
  children,
  fallback = null,
  always = false,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  always?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState(() => ({ granted: always || !Number.isFinite(budget), gen: 0 }));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const slot: Slot = {
      host,
      always,
      granted: state.granted,
      gen: state.gen,
      apply: () => setState({ granted: slot.granted, gen: slot.gen }),
    };
    slots.add(slot);
    if (!slot.granted) {
      listen();
      schedule(0);
    }
    return () => {
      slots.delete(slot);
      if (slot.granted) schedule(0); // its context is free again
    };
    // registered once; `always` never changes for a given effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={hostRef} style={{ display: 'contents' }}>
      {state.granted ? <React.Fragment key={state.gen}>{children}</React.Fragment> : fallback}
    </div>
  );
}
