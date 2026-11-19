import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GLSlot } from './fx/GLSlot';
import {
  motion,
  useAnimationControls,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type Variants,
} from 'motion/react';
import { scrollToTarget } from '../lib/smoothScroll';
import { ScrambleText } from './fx/TextFx';
import { WormholeTunnel } from './fx/WormholeTunnel';

const easeInOut = [0.76, 0, 0.24, 1] as const;
const easeOut = [0.22, 1, 0.36, 1] as const;

const links: Array<{ key: string; name: string; index: string; target: string | number; caption: string }> = [
  { key: 'home', name: 'Home', index: '00', target: 0, caption: 'Back into the vortex' },
  { key: 'about', name: 'About', index: '01', target: 'about', caption: 'The person behind the work' },
  { key: 'projects', name: 'Projects', index: '02', target: 'projects', caption: 'Proof of work' },
  { key: 'capabilities', name: 'Capabilities', index: '03', target: 'capabilities', caption: 'What I build with' },
  { key: 'contact', name: 'Contact', index: '04', target: 'contact', caption: "Let's build something" },
];

const socials = [
  { label: 'GitHub', href: 'https://github.com/Smaran-Prakash-Jani' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/smaranprakashjani' },
  { label: 'X', href: 'https://x.com/PrakashSmaran' },
  { label: 'Instagram', href: 'https://www.instagram.com/_.smarann._/' },
];

/** Which section is under the middle of the screen right now. */
function currentSection() {
  const mid = window.innerHeight / 2;
  for (const id of ['contact', 'capabilities', 'projects', 'about']) {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= mid) return id;
  }
  return 'home';
}

/** Tells the WebGL scenes to stop rendering while the menu fully covers them. */
const setPageCovered = (covered: boolean) =>
  window.dispatchEvent(new CustomEvent<boolean>('site-overlay', { detail: covered }));

const rowVariants: Variants = {
  hidden: { y: '115%', rotate: 5 },
  shown: (i: number) => ({ y: '0%', rotate: 0, transition: { duration: 1.1, ease: easeOut, delay: 0.32 + i * 0.07 } }),
  exit: (i: number) => ({ y: '-115%', rotate: -3, transition: { duration: 0.5, ease: easeInOut, delay: i * 0.03 } }),
};

const fadeVariants: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
  shown: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: easeOut, delay: 0.65 + i * 0.06 },
  }),
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

const glowVariants: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 1.2, ease: easeOut, delay: 0.7 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const lineVariants: Variants = {
  hidden: { scaleX: 0 },
  shown: { scaleX: 1, transition: { duration: 1.4, ease: easeInOut, delay: 0.25 } },
  exit: { scaleX: 0, transition: { duration: 0.5, ease: easeInOut } },
};

const tunnelVariants: Variants = {
  hidden: { scale: 1.25, opacity: 0 },
  shown: { scale: 1, opacity: 0.8, transition: { duration: 1.6, ease: easeOut, delay: 0.1 } },
  exit: { scale: 1.1, opacity: 0, transition: { duration: 0.6, ease: easeInOut } },
};

const CornerAccents = () => (
  <>
    <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50" />
    <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/50" />
    <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/50" />
    <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50" />
  </>
);

// ---------- liquid reveal ----------

const OPEN_MS = 1250;
const CLOSE_MS = 1000;
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * A blob of liquid at progress u (0..1): it bulges out of the button as a drip, then floods the
 * screen as a circle whose edge ripples like a liquid, the ripples settling as it fills.
 */
function liquidPath(u: number, time: number, cx: number, cy: number, r0: number, rMax: number, vh: number, inset = 0) {
  const grow = easeInOutCubic(clamp01((u - 0.06) / 0.94));
  const R = r0 + (rMax - r0) * grow;
  const drip = Math.sin(clamp01(u / 0.6) * Math.PI) * Math.min(vh, 900) * 0.24;
  const wob = Math.pow(1 - u, 1.4);
  const N = 72;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const w =
      wob *
      (0.07 * Math.sin(3 * a + time * 5.1) + 0.05 * Math.sin(5 * a - time * 7.3 + 1.3) + 0.035 * Math.sin(8 * a + time * 9.7 + 2.1));
    let d = a - Math.PI / 2; // straight down
    d = Math.atan2(Math.sin(d), Math.cos(d));
    const r = Math.max(R * (1 + w) + drip * Math.exp(-((d / 0.42) ** 2)) - inset, 0.5);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  // closed Catmull-Rom spline -> cubic Beziers
  const f = (n: number) => n.toFixed(1);
  let path = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];
    path += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return `${path} Z`;
}

/**
 * Full-screen menu: a MENU chip at the top opens an overlay that pours out of it like liquid,
 * with big section links rolling up into place.
 */
export function MenuOverlay({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const reduceMotion = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const origin = useRef({ x: 0, y: 40, r0: 18, rMax: 2000 });
  const navigating = useRef(false);
  const [mounted, setMounted] = useState(false);
  // Built ahead of time (hidden, its tunnel paused) so opening only has to reveal it
  const [prepared, setPrepared] = useState(false);
  useEffect(() => {
    let id = 0;
    const t = window.setTimeout(() => {
      if ('requestIdleCallback' in window) id = window.requestIdleCallback(() => setPrepared(true), { timeout: 3000 });
      else setPrepared(true);
    }, 1200);
    return () => {
      window.clearTimeout(t);
      if (id) window.cancelIdleCallback(id);
    };
  }, []);
  const [active, setActive] = useState('home');
  const [hovered, setHovered] = useState<number | null>(null);
  const chip = useAnimationControls();
  // liquid-glass rim that traces the liquid's edge while it moves
  const rimRef = useRef<HTMLDivElement>(null);
  const frostRef = useRef<HTMLDivElement>(null);
  const rimPaths = useRef<Array<SVGPathElement | null>>([]);

  // The tunnel behind the menu stays at rest
  const calm = useMotionValue(0);

  // Soft light that trails the cursor across the overlay
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const gx = useSpring(mx, { stiffness: 70, damping: 20 });
  const gy = useSpring(my, { stiffness: 70, damping: 20 });
  const glow = useMotionTemplate`radial-gradient(520px circle at ${gx}px ${gy}px, rgba(196, 181, 253, 0.10), transparent 65%)`;

  const toggle = () => {
    if (!open) {
      const b = buttonRef.current?.getBoundingClientRect();
      const x = b ? b.left + b.width / 2 : window.innerWidth / 2;
      const y = b ? b.top + b.height / 2 : 40;
      const rMax = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 60;
      origin.current = { x, y, r0: b ? b.height / 2 : 18, rMax };
      mx.jump(window.innerWidth / 2);
      my.jump(window.innerHeight / 2);
      setActive(currentSection());
      setHovered(null);
      navigating.current = false;
    }
    // Dynamic-Island style squish on the chip as the liquid leaves or returns
    if (!reduceMotion) {
      chip.start({
        scaleX: [1, 1.18, 0.94, 1.03, 1],
        scaleY: [1, 0.82, 1.08, 0.98, 1],
        transition: { duration: 0.7, ease: 'easeOut' },
      });
    }
    onOpenChange(!open);
  };

  // Mount on open; on close keep it mounted until the liquid has flowed back
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // Drive the liquid edge frame by frame (layout effect: the first shape is set before paint)
  const uRef = useRef(0);
  useLayoutEffect(() => {
    if (!mounted) return;
    const el = overlayRef.current;
    if (!el) return;
    if (reduceMotion) {
      el.style.clipPath = 'none';
      uRef.current = open ? 1 : 0;
      setPageCovered(open);
      if (!open) {
        const t = window.setTimeout(() => setMounted(false), 450);
        return () => window.clearTimeout(t);
      }
      return;
    }
    const { x, y, r0, rMax } = origin.current;
    const vh = window.innerHeight;
    const RIM = 16;
    const draw = (u: number, time: number) => {
      const d = liquidPath(u, time, x, y, r0, rMax, vh);
      el.style.clipPath = `path('${d}')`;
      rimPaths.current.forEach((p) => p?.setAttribute('d', d));
      if (frostRef.current) {
        const inner = liquidPath(u, time, x, y, r0, rMax, vh, RIM);
        frostRef.current.style.clipPath = `path(evenodd, '${d} ${inner}')`;
      }
    };
    const showRim = (on: boolean) => {
      if (rimRef.current) rimRef.current.style.opacity = on ? '1' : '0';
    };
    const from = uRef.current;
    const to = open ? 1 : 0;
    const duration = Math.abs(to - from) * (open ? OPEN_MS : CLOSE_MS);
    if (!open) setPageCovered(false);
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const k = duration > 0 ? clamp01((now - start) / duration) : 1;
      const u = from + (to - from) * k;
      uRef.current = u;
      if (k >= 1) {
        showRim(false);
        if (open) {
          el.style.clipPath = 'none';
          setPageCovered(true);
        } else {
          setMounted(false);
        }
        return;
      }
      draw(u, now / 1000);
      raf = requestAnimationFrame(tick);
    };
    draw(from, performance.now() / 1000);
    showRim(true);
    // a full menu waits a beat before draining, so the links can roll away first
    const delay = !open && from > 0.99 ? 220 : 0;
    const t = window.setTimeout(() => (raf = requestAnimationFrame(tick)), delay);
    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [open, mounted, reduceMotion]);

  // Keyboard: Escape closes, Tab stays inside the menu
  useEffect(() => {
    if (!open || !mounted) return;
    overlayRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
        return;
      }
      if (e.key !== 'Tab' || !overlayRef.current) return;
      const nodes = [
        buttonRef.current,
        ...Array.from(overlayRef.current.querySelectorAll<HTMLElement>('a[href], button')),
      ].filter((n): n is HTMLElement => !!n);
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (!current || !nodes.includes(current)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // Hand focus back to the button unless a link just sent the visitor somewhere
      if (!navigating.current && overlayRef.current?.contains(document.activeElement)) {
        buttonRef.current?.focus({ preventScroll: true });
      }
    };
  }, [open, mounted, onOpenChange]);

  const go = (e: React.MouseEvent, target: string | number) => {
    e.preventDefault();
    navigating.current = true;
    // Jump while the overlay still hides the page, so the liquid drains to reveal the new section
    scrollToTarget(target, { immediate: true });
    onOpenChange(false);
  };

  const openResume = (e: React.MouseEvent) => {
    e.preventDefault();
    navigating.current = true;
    onOpenChange(false);
    window.dispatchEvent(new CustomEvent('open-resume'));
  };

  return (
    <>
      {/* Trigger chip */}
      <div className="fixed top-4 md:top-7 inset-x-0 z-[70] flex justify-center pointer-events-none">
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.2, ease: easeOut, delay: 0.5 }}>
          <motion.button
            ref={buttonRef}
            type="button"
            onClick={toggle}
            onPointerEnter={() => setPrepared(true)}
            onFocus={() => setPrepared(true)}
            animate={chip}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className={`group pointer-events-auto relative flex items-center gap-3 h-9 pl-3 pr-4 backdrop-blur-xl border transition-colors duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.6)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#8B5CF6] ${
              open ? 'bg-white/[0.04] border-[#8B5CF6]/60' : 'bg-[#0a0a0a]/50 border-white/[0.16] hover:border-[#8B5CF6]/60'
            }`}
          >
            <CornerAccents />
            <span aria-hidden="true" className="relative w-4 h-[9px]">
              <motion.span
                className="absolute left-0 top-0 w-full h-px bg-white"
                animate={open ? { y: 4, rotate: 45 } : { y: 0, rotate: 0 }}
                transition={{ duration: 0.5, ease: easeInOut }}
              />
              <motion.span
                className="absolute left-0 top-2 h-px bg-white"
                animate={open ? { y: -4, rotate: -45, width: '100%' } : { y: 0, rotate: 0, width: '60%' }}
                transition={{ duration: 0.5, ease: easeInOut }}
              />
            </span>
            <span aria-hidden="true" className="relative h-[14px] overflow-hidden font-mono text-[10px] leading-[14px] tracking-[0.3em] uppercase">
              <motion.span className="flex flex-col" animate={{ y: open ? '-50%' : '0%' }} transition={{ duration: 0.6, ease: easeInOut }}>
                <span className="h-[14px] text-white">Menu</span>
                <span className="h-[14px] text-[#C4B5FD]">Close</span>
              </motion.span>
            </span>
          </motion.button>
        </motion.div>
      </div>

      {(mounted || prepared) && !reduceMotion && (
        <div
          ref={rimRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[61] transition-opacity duration-300"
          style={mounted ? undefined : { visibility: 'hidden' }}
        >
          {/* frosted glass ring along the edge */}
          <div
            ref={frostRef}
            className="absolute inset-0 bg-white/[0.06]"
            style={{ backdropFilter: 'blur(10px) saturate(1.7) brightness(1.25)', WebkitBackdropFilter: 'blur(10px) saturate(1.7) brightness(1.25)' }}
          />
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="menu-rim" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#c4b5fd" stopOpacity="0.55" />
                <stop offset="65%" stopColor="#ffffff" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#a5f3fc" stopOpacity="0.6" />
              </linearGradient>
              <filter id="menu-rim-glow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
            </defs>
            <path ref={(n) => { rimPaths.current[0] = n; }} fill="none" stroke="rgba(196,181,253,0.35)" strokeWidth="16" filter="url(#menu-rim-glow)" />
            <path ref={(n) => { rimPaths.current[1] = n; }} fill="none" stroke="url(#menu-rim)" strokeWidth="2.2" />
            <path ref={(n) => { rimPaths.current[2] = n; }} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" transform="translate(-2.5 -3.5)" />
          </svg>
        </div>
      )}

      {(mounted || prepared) && (
        <motion.div
          key="menu"
          id="site-menu"
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          tabIndex={-1}
          data-lenis-prevent
          aria-hidden={!mounted}
          style={mounted ? undefined : { visibility: 'hidden', pointerEvents: 'none' }}
          initial={reduceMotion ? { opacity: 0 } : 'hidden'}
          animate={reduceMotion ? { opacity: open ? 1 : 0 } : open ? 'shown' : mounted ? 'exit' : 'hidden'}
          onPointerMove={(e) => {
            mx.set(e.clientX);
            my.set(e.clientY);
          }}
          className="fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-[#030305] text-white outline-none"
        >
          {/* Backdrop: the hero's silver tunnel, calmer, with a dark middle so the links stay readable */}
          <div aria-hidden="true" className="pointer-events-none fixed inset-0">
            <motion.div variants={tunnelVariants} className="absolute inset-0">
              <GLSlot always>
                <WormholeTunnel progress={calm} ignoreCover paused={!mounted} className="absolute inset-0 w-full h-full" />
              </GLSlot>
            </motion.div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(5,3,11,0.88)_0%,rgba(5,3,11,0.55)_45%,transparent_80%)]" />
            <motion.div className="absolute inset-0" style={{ background: glow }} />
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
                backgroundSize: '48px 48px',
              }}
            />
          </div>

          <div className="relative flex flex-col min-h-full">
            {/* HUD header */}
            <div className="relative h-20 md:h-24 shrink-0 flex items-center justify-between px-6 md:px-12 font-mono text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-white/60">
              <motion.span variants={fadeVariants} custom={0}>SPJ. // Index</motion.span>
              <motion.span variants={fadeVariants} custom={1} className="hidden md:inline">
                Esc — Close
              </motion.span>
              <motion.span variants={fadeVariants} custom={1} className="md:hidden">
                05
              </motion.span>
              <motion.div
                variants={lineVariants}
                className="absolute bottom-0 left-6 right-6 md:left-12 md:right-12 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            </div>

            {/* Links */}
            <nav aria-label="Menu" className="flex-1 flex items-center justify-center px-6 py-10 md:py-8">
              <ul className="flex flex-col items-center" onMouseLeave={() => setHovered(null)}>
                {links.map((link, i) => {
                  const isActive = active === link.key;
                  const dim = hovered !== null && hovered !== i;
                  return (
                    <li key={link.key}>
                      <a
                        href={typeof link.target === 'number' ? '#' : `#${link.target}`}
                        onClick={(e) => go(e, link.target)}
                        onMouseEnter={() => setHovered(i)}
                        onFocus={() => setHovered(i)}
                        onBlur={() => setHovered(null)}
                        aria-current={isActive ? 'location' : undefined}
                        data-fx-group
                        className={`group relative flex items-start gap-3 md:gap-5 outline-none transition-[opacity,filter] duration-500 ${
                          dim ? 'opacity-25 blur-[2px]' : 'opacity-100'
                        }`}
                      >
                        <span
                          className={`mt-[1.1em] md:mt-[1.6em] font-mono text-[10px] md:text-[11px] tracking-[0.2em] transition-colors duration-500 ${
                            isActive ? 'text-[#A78BFA]' : 'text-white/45 group-hover:text-[#C4B5FD] group-focus-visible:text-[#C4B5FD]'
                          }`}
                        >
                          <ScrambleText text={link.index} playOn="hover" />
                        </span>

                        {/* soft violet glow behind the current section (kept outside the mask so it isn't cut off) */}
                        {isActive && (
                          <motion.span
                            aria-hidden="true"
                            variants={glowVariants}
                            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[70%] rounded-full bg-[#8B5CF6]/25 blur-3xl"
                          />
                        )}

                        <span className="relative block overflow-hidden py-[0.12em] pl-[0.12em] pr-[0.35em] -ml-[0.12em] -mr-[0.35em]">
                          <motion.span variants={rowVariants} custom={i} className="block origin-bottom-left will-change-transform">
                            <span
                              className={`block transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3 group-focus-visible:translate-x-3 ${
                                isActive
                                  ? "font-['Pinyon_Script'] text-[3.9rem] sm:text-[4.6rem] md:text-[5.4rem] lg:text-[7rem] leading-[1] text-[#C4B5FD] pr-[0.15em]"
                                  : 'font-light text-[3.15rem] sm:text-6xl md:text-7xl lg:text-[5.75rem] leading-[1.08] tracking-[-0.035em] text-white/90 group-hover:text-white'
                              }`}
                            >
                              {link.name}
                            </span>
                          </motion.span>
                          {/* underline that draws in on hover */}
                          <span className="absolute left-[0.12em] right-[0.35em] bottom-[0.14em] h-px origin-left scale-x-0 bg-gradient-to-r from-[#8B5CF6] via-[#C4B5FD] to-transparent transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100" />
                        </span>

                        {/* caption beside the word (large screens) */}
                        <span className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-8 whitespace-nowrap font-mono text-[10px] tracking-[0.25em] uppercase text-[#C4B5FD]/85 opacity-0 -translate-x-2 transition-[opacity,translate] duration-500 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0">
                          <span className="text-white/35">{'// '}</span>
                          <ScrambleText text={link.caption} playOn="hover" />
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer strip */}
            <div className="relative shrink-0 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6 px-6 md:px-12 pt-6 pb-8 md:pb-10 font-mono text-[10px] md:text-[11px] tracking-[0.15em]">
              <motion.div
                variants={lineVariants}
                className="absolute top-0 left-6 right-6 md:left-12 md:right-12 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
              <motion.div variants={fadeVariants} custom={0} className="col-span-2 md:col-span-1 flex flex-col gap-2">
                <span className="text-white/45 uppercase tracking-[0.3em] text-[9px]">Start a project</span>
                <a href="mailto:smaranprakash@gmail.com" className="text-white/85 hover:text-[#C4B5FD] transition-colors break-all">
                  smaranprakash@gmail.com
                </a>
              </motion.div>
              <motion.div variants={fadeVariants} custom={1} className="col-span-2 md:col-span-1 flex flex-col gap-2">
                <span className="text-white/45 uppercase tracking-[0.3em] text-[9px]">Follow</span>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {socials.map((s, si) => (
                    <React.Fragment key={s.label}>
                      <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-white/85 hover:text-[#C4B5FD] transition-colors">
                        {s.label}
                      </a>
                      {si < socials.length - 1 && <span className="text-white/25">/</span>}
                    </React.Fragment>
                  ))}
                </span>
              </motion.div>
              <motion.div variants={fadeVariants} custom={2} className="flex flex-col gap-2">
                <span className="text-white/45 uppercase tracking-[0.3em] text-[9px]">Resume</span>
                <a href="#resume" onClick={openResume} className="text-white/85 hover:text-[#C4B5FD] transition-colors">
                  Open file ↗
                </a>
              </motion.div>
              <motion.div variants={fadeVariants} custom={3} className="flex flex-col gap-2 items-end">
                <span className="text-white/45 uppercase tracking-[0.3em] text-[9px]">© {new Date().getFullYear()}</span>
                <span className="text-white/85">Smaran Prakash Jani</span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
