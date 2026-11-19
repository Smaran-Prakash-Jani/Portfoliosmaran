import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

// One shared Lenis instance: inertia scrolling for the whole page.
let lenis: Lenis | null = null;

export function initSmoothScroll() {
  // Lenis already skips smoothing when the visitor asks for reduced motion
  lenis = new Lenis({ autoRaf: true, lerp: 0.085, wheelMultiplier: 0.9 });
  return () => {
    lenis?.destroy();
    lenis = null;
  };
}

export function setSmoothScrollPaused(paused: boolean) {
  if (paused) lenis?.stop();
  else lenis?.start();
}

/** Scroll to a section id, or to a pixel offset (works even while scrolling is paused). `immediate` jumps. */
export function scrollToTarget(target: string | number, { immediate = false }: { immediate?: boolean } = {}) {
  if (lenis) {
    // Restarting Lenis cancels any running scroll, so resume before starting a smooth one
    if (!immediate && lenis.isStopped) lenis.start();
    lenis.scrollTo(
      typeof target === 'number' ? target : `#${target}`,
      immediate ? { immediate: true, force: true } : { duration: 1.8, force: true },
    );
    return;
  }
  const behavior: ScrollBehavior = immediate ? 'instant' : 'smooth';
  if (typeof target === 'number') window.scrollTo({ top: target, behavior });
  else document.getElementById(target)?.scrollIntoView({ behavior });
}
