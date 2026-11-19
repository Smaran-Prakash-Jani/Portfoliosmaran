import React, { useEffect, useRef } from 'react';
import { canvasDpr, quality } from '../../lib/quality';

/**
 * Faint star dust behind every section. It drifts with parallax as you scroll and
 * stretches into warp streaks when you scroll fast. Canvas 2D.
 */
export function StarDust({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phone = window.innerWidth < 768;
    const COUNT = Math.max(60, Math.round((phone ? 110 : 280) * Math.min(1, quality().count * 1.5)));

    let W = 0;
    let H = 0;
    let dpr = 1;
    const stars = Array.from({ length: COUNT }, () => ({ x: Math.random(), y: Math.random(), z: 0.15 + Math.random() * 0.85, tw: Math.random() * 6.28 }));

    const resize = () => {
      dpr = canvasDpr(2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };

    let lastY = window.scrollY;
    let vel = 0;
    let raf = 0;
    let last = 0;
    let time = 0;

    const draw = (dt: number) => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      vel += (dy - vel) * Math.min(dt * 10, 1);
      time += dt;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgb(214,206,255)';
      for (const s of stars) {
        s.y -= (dy * s.z * 0.35) / H;
        s.y -= (dt * 0.004 * s.z);
        if (s.y < -0.05) s.y += 1.1;
        if (s.y > 1.05) s.y -= 1.1;
        const px = s.x * W;
        const py = s.y * H;
        const a = (0.2 + 0.55 * s.z) * (0.7 + 0.3 * Math.sin(time * 1.5 + s.tw));
        const streak = Math.max(Math.min(vel * s.z * 0.9, 90), -90);
        ctx.globalAlpha = a;
        ctx.lineWidth = 0.6 + s.z * 1.1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + (Math.abs(streak) < 1 ? 0.01 : streak));
        ctx.stroke();
      }
    };

    // Hidden behind the opaque hero tunnel or the 3D Process scene? Then there's nothing to draw.
    // Section positions are measured only when the layout changes, never per frame.
    const spans = { heroBottom: 0, procTop: -1, procBottom: -1 };
    const measure = () => {
      const y = window.scrollY;
      const hero = document.getElementById('hero')?.getBoundingClientRect();
      spans.heroBottom = hero ? hero.bottom + y : 0;
      const proc = document.getElementById('process')?.getBoundingClientRect();
      spans.procTop = proc ? proc.top + y : -1;
      spans.procBottom = proc ? proc.bottom + y : -1;
    };
    measure();
    const layoutWatch = new ResizeObserver(measure);
    layoutWatch.observe(document.body);
    const covered = () => {
      const vh = window.innerHeight;
      const y = window.scrollY;
      if (spans.heroBottom - y > vh * 1.15) return true;
      return spans.procTop >= 0 && spans.procTop - y <= 0 && spans.procBottom - y >= vh;
    };
    let idle = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      const scrolling = window.scrollY !== lastY || Math.abs(vel) > 0.05;
      idle += dt;
      // full rate while scrolling (the streaks), a gentle 15 fps twinkle otherwise
      if (!scrolling && idle < 1 / 15) return;
      if (covered()) {
        lastY = window.scrollY;
        vel = 0;
        idle = 0;
        return;
      }
      draw(idle);
      idle = 0;
    };

    resize();
    window.addEventListener('resize', resize);
    if (reduced) draw(0);
    else raf = requestAnimationFrame(loop);
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      layoutWatch.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
