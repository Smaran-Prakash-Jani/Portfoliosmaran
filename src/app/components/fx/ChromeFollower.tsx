import React, { useEffect, useRef, useState } from 'react';
import { canvasDpr } from '../../lib/quality';
import { whenProgramReady } from '../../lib/glProgram';
import { CHROME_ENV } from './ChromeTracker';

/**
 * One liquid-chrome blob that breaks away from the tracked cluster and follows the cursor around
 * its section, keeping its distance. When the cursor leaves the section it floats back and docks
 * beside the cluster ([data-chrome-dock]). Rendered as an analytic sphere reflecting the same studio.
 */

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
uniform float u_time;
uniform vec2 u_tilt;
uniform float u_px;
varying vec2 v_uv;
${CHROME_ENV}
void main() {
  vec2 p = v_uv / 0.86;
  float a = atan(p.y, p.x);
  // a little liquid wobble on the outline
  float edgeR = 1.0 + 0.025 * sin(a * 3.0 + u_time * 2.1) + 0.015 * sin(a * 5.0 - u_time * 2.9);
  float r = length(p) / edgeR;
  float alpha = 1.0 - smoothstep(1.0 - u_px * 2.0, 1.0, r);
  if (alpha <= 0.0) { gl_FragColor = vec4(0.0); return; }
  vec3 n = normalize(vec3(p / edgeR, sqrt(max(1.0 - r * r, 0.0))));
  // reflections drift as it moves around the page
  float cy = cos(u_tilt.x), sy = sin(u_tilt.x);
  n.xz = mat2(cy, -sy, sy, cy) * n.xz;
  float cx = cos(u_tilt.y), sx = sin(u_tilt.y);
  n.yz = mat2(cx, -sx, sx, cx) * n.yz;
  vec3 rd = vec3(0.0, 0.0, -1.0);
  float ndv = clamp(dot(n, -rd), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 5.0);
  vec3 film = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + ndv * 1.6 + 0.2));
  vec3 metal = mix(vec3(0.92, 0.90, 1.0), film, 0.3);
  vec3 col = env(reflect(rd, n)) * metal * (0.8 + 0.7 * fres);
  col = col / (1.0 + col);
  col = pow(col, vec3(0.4545));
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

/** Mouse pointers only (no follower on touch screens). */
export const chromeFollowerEnabled = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ChromeFollower({ sectionRef }: { sectionRef: React.RefObject<HTMLElement | null> }) {
  const [enabled] = useState(chromeFollowerEnabled);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!enabled || !section || !wrap || !canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const vs = sh(gl.VERTEX_SHADER, VERT);
    const fs = sh(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    // a large shader: let the GPU compile it in the background (KHR_parallel_shader_compile) and
    // start once it's ready, so no other canvas on the page stalls in the meantime
    let teardown = () => {};
    const setup = () => {
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error(gl.getShaderInfoLog(fs) || gl.getProgramInfoLog(prog));
        return;
      }
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'a_pos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const uTime = gl.getUniformLocation(prog, 'u_time');
      const uTilt = gl.getUniformLocation(prog, 'u_tilt');
      const uPx = gl.getUniformLocation(prog, 'u_px');
      gl.clearColor(0, 0, 0, 0);

      const SIZE = 92;
      const KEEP = 130;
      const dpr = canvasDpr(2);
      canvas.width = canvas.height = Math.round(SIZE * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uPx, 2 / canvas.width);

      // positions are relative to the section
      const pos = { x: -1, y: -1 };
      const vel = { x: 0, y: 0 };
      const cursor = { x: 0, y: 0, inside: false };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        const r = section.getBoundingClientRect();
        cursor.x = e.clientX - r.left;
        cursor.y = e.clientY - r.top;
        cursor.inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      };
      const onLeave = () => (cursor.inside = false);
      window.addEventListener('pointermove', onMove, { passive: true });
      section.addEventListener('pointerleave', onLeave);

      const dockPoint = () => {
        const r = section.getBoundingClientRect();
        const dock = section.querySelector('[data-chrome-dock]')?.getBoundingClientRect();
        if (!dock || dock.width < 10) return { x: r.width * 0.75, y: r.height * 0.3 };
        return { x: dock.left - r.left + dock.width * 0.22, y: dock.top - r.top + dock.height * 0.62 };
      };

      let raf = 0;
      let running = false;
      let last = 0;
      let t = 0;
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min((now - (last || now)) / 1000, 0.05);
        last = now;
        t += dt;
        const rect = section.getBoundingClientRect();
        if (pos.x < 0) Object.assign(pos, dockPoint());
        let tx: number;
        let ty: number;
        let dx = 0;
        let dy = 0;
        let d = 1e9;
        if (cursor.inside) {
          // aim for a point KEEP px from the cursor, on whichever side the blob already is
          dx = pos.x - cursor.x;
          dy = pos.y - cursor.y;
          d = Math.hypot(dx, dy) || 1;
          dx /= d;
          dy /= d;
          tx = cursor.x + dx * KEEP + Math.sin(t * 0.9) * 12;
          ty = cursor.y + dy * KEEP + Math.cos(t * 1.3) * 9;
        } else {
          const dp = dockPoint();
          tx = dp.x + Math.sin(t * 0.7) * 8;
          ty = dp.y + Math.cos(t * 0.9) * 6;
        }
        tx = Math.min(Math.max(tx, SIZE * 0.6), rect.width - SIZE * 0.6);
        ty = Math.min(Math.max(ty, SIZE * 0.6), rect.height - SIZE * 0.6);
        vel.x += (tx - pos.x) * 3 * dt;
        vel.y += (ty - pos.y) * 3 * dt;
        if (d < KEEP * 0.7) {
          vel.x += dx * (KEEP * 0.7 - d) * 9 * dt;
          vel.y += dy * (KEEP * 0.7 - d) * 9 * dt;
        }
        const drag = Math.exp(-dt * 2.6);
        vel.x *= drag;
        vel.y *= drag;
        pos.x += vel.x * dt;
        pos.y += vel.y * dt;

        const speed = Math.hypot(vel.x, vel.y);
        const stretch = Math.min(speed / 1500, 0.15);
        const ang = Math.atan2(vel.y, vel.x);
        wrap.style.transform =
          `translate3d(${pos.x - SIZE / 2}px, ${pos.y - SIZE / 2}px, 0) rotate(${ang}rad) ` +
          `scale(${1 + stretch}, ${1 - stretch * 0.7}) rotate(${-ang}rad)`;
        if (labelRef.current) {
          labelRef.current.textContent = `OBJ_06 // ${cursor.inside ? 'FOLLOW' : 'DOCK'}  x:${Math.round(pos.x)} y:${Math.round(pos.y)}`;
        }
        gl.uniform1f(uTime, t);
        gl.uniform2f(uTilt, (pos.x / Math.max(rect.width, 1) - 0.5) * 0.9 + vel.x * 0.0004, (pos.y / Math.max(rect.height, 1) - 0.5) * 0.6 + vel.y * 0.0004);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      const start = () => {
        if (running) return;
        running = true;
        last = 0;
        raf = requestAnimationFrame(loop);
      };
      const stop = () => {
        running = false;
        cancelAnimationFrame(raf);
      };
      const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
      io.observe(section);

      teardown = () => {
        stop();
        io.disconnect();
        window.removeEventListener('pointermove', onMove);
        section.removeEventListener('pointerleave', onLeave);
        gl.deleteBuffer(buf);
      };
    };
    const cancelWait = whenProgramReady(gl, prog, setup);

    return () => {
      cancelWait();
      teardown();
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      // free the context now (see GLSlot)
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [enabled, sectionRef]);

  if (!enabled) return null;
  return (
    <div ref={wrapRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-30 w-[92px] h-[92px]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full drop-shadow-[0_10px_30px_rgba(139,92,246,0.35)]" />
      {/* tracking brackets, matching the cluster's overlay */}
      <span className="absolute -inset-2 border-violet-300/80 [border-width:0] before:absolute before:left-0 before:top-0 before:w-3 before:h-3 before:border-l before:border-t before:border-[#A78BFA] after:absolute after:right-0 after:bottom-0 after:w-3 after:h-3 after:border-r after:border-b after:border-[#A78BFA]" />
      <span ref={labelRef} className="absolute left-[-8px] -top-6 whitespace-nowrap font-mono text-[9px] tracking-wider text-[#DDD6FE]" />
    </div>
  );
}
