import React, { useEffect, useRef } from 'react';
import type { MotionValue } from 'motion/react';
import { createFrameGovernor } from '../../lib/frameGovernor';
import { canvasDpr, createFrameLimiter, quality } from '../../lib/quality';
import { isSiteReady } from '../../lib/boot';

/**
 * Hero background: a tunnel of light. Thousands of silver particles swirl in rings around a
 * dark core; each one leaves a curved trail along its real path (a short camera exposure), so
 * a slow spin gives soft arcs.
 * Scroll progress (0..1): the swirl winds up into a twirl, then the light leaves the way it
 * arrived: it keeps streaming outwards past the edges while the tunnel empties from its far end,
 * so the middle only ever gets darker (never a glare), and finally opens onto the page behind.
 * Plain WebGL 1.
 */

const TUNNEL_VERT = `
precision highp float;
attribute vec4 a_seed;
attribute vec2 a_corner; // x: place along the trail (0 = the particle, 1 = end of its trail), y: side
uniform mat4 u_proj;
uniform vec2 u_res;
uniform float u_rot;
uniform float u_rotVel;
uniform float u_travel;
uniform float u_zVel;
uniform float u_trail;
uniform float u_gain;
uniform float u_dpr;
uniform float u_hole;
uniform float u_clear;
uniform float u_clearR;
uniform float u_cut;
uniform float u_exit;
uniform vec2 u_bend;
varying float v_a;
varying float v_side;
varying float v_along;
varying vec3 v_col;

const float SPAN = 90.0;
float hash(float n) { return fract(sin(n) * 43758.5453123); }

float g_band;
float g_r;
float g_spin;
float g_ang;

vec3 tunnelPos(float z, float ang, float r) {
  float k = z / SPAN;
  vec2 axis = u_bend * k * k * 9.0;
  return vec3(cos(ang) * r + axis.x, sin(ang) * r + axis.y, z);
}

// where this particle was tau seconds ago
vec3 particleAt(float tau) {
  float zNow = min(-(SPAN - mod(g_band * SPAN + u_travel, SPAN)), -0.35);
  float z = max(zNow - u_zVel * tau, -SPAN);
  float ang = g_ang + (u_rot - u_rotVel * tau) * g_spin + z * 0.035;
  return tunnelPos(z, ang, g_r);
}

void main() {
  float id = a_seed.w * 7919.0;
  // particles clump into rings along the tunnel
  float bandId = floor(a_seed.z * 70.0);
  g_band = (bandId + 0.5 + (hash(id + 1.0) - 0.5) * 0.25) / 70.0;
  float bandGlow = 0.55 + 0.9 * hash(bandId + 11.0);
  g_r = 5.2 * (0.82 + 0.36 * hash(id + 2.0)) * (1.0 + 0.08 * sin(a_seed.x * 18.0 + g_band * 40.0));
  g_spin = 0.75 + 0.5 * hash(id + 3.0);
  g_ang = a_seed.x * 6.2831853;

  // the whole trail on screen, so very long ones can be shortened
  vec4 ch = u_proj * vec4(particleAt(0.0), 1.0);
  vec4 ct = u_proj * vec4(particleAt(u_trail), 1.0);
  vec2 sh = ch.xy / ch.w;
  float len = length((sh - ct.xy / ct.w) * u_res * 0.5);
  float maxLen = 320.0 * u_dpr;
  float trail = u_trail * min(1.0, maxLen / max(len, 0.001));
  len = min(len, maxLen);

  // this vertex: a point along the curved trail, pushed sideways by the trail's width there
  float s = a_corner.x;
  vec4 c = u_proj * vec4(particleAt(s * trail), 1.0);
  vec4 back = u_proj * vec4(particleAt((s + 0.06) * trail + 0.0004), 1.0);
  vec2 d = (c.xy / c.w - back.xy / back.w) * u_res * 0.5;
  float dl = length(d);
  vec2 dir = dl > 0.0001 ? d / dl : vec2(0.0, 1.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float width = (0.7 + 1.7 * hash(id + 4.0)) * u_dpr * clamp(7.0 / c.w, 0.7, 3.2) * 2.0 * (1.0 - 0.35 * s);
  c.xy += nrm * a_corner.y * width / (u_res * 0.5) * c.w;
  gl_Position = c;

  float zHead = -ch.w;
  float near = 1.0 - smoothstep(-3.0, -0.4, zHead);
  float far = smoothstep(-SPAN, -SPAN * 0.55, zHead);
  float centre = length(vec2(sh.x * u_res.x / u_res.y, sh.y));
  float hole = smoothstep(u_hole * 0.85, u_hole + 0.001, centre);
  float b = (0.3 + 0.7 * pow(hash(id + 5.0), 2.0)) * (0.75 + 0.25 * sin(u_rot * 3.0 + id)) * bandGlow;
  // the same light spread over a longer trail looks dimmer
  float spread = mix(clamp(18.0 * u_dpr / (len + 18.0 * u_dpr), 0.3, 1.0), 1.0, 0.4);
  // at rest the middle stays clear so the hero sphere in front reads
  float clearZone = mix(1.0, smoothstep(u_clearR * 0.7, u_clearR * 1.55, centre), u_clear);
  // leaving: nothing new comes out of the far end (the middle of the screen), so the tunnel
  // empties from the centre outwards while the last light streams off past the edges
  float leaving = smoothstep(u_cut, u_cut + 8.0, zHead);
  // and while it leaves, light near the middle is kept soft, so there is never a glare in the centre
  leaving *= mix(1.0, smoothstep(0.08, 0.75, centre), u_exit);
  v_a = u_gain * b * near * far * hole * spread * clearZone * leaving * 1.6;
  float h = hash(id + 6.0);
  v_col = mix(vec3(0.76, 0.82, 1.0), vec3(1.0, 0.98, 0.95), h);
  if (hash(id + 7.0) > 0.92) v_col = vec3(0.80, 0.72, 1.0);
  v_side = a_corner.y;
  v_along = 1.0 - s;
  // trails too faint to see are skipped entirely (moved off screen), so they cost no fill
  if (v_a < 0.004) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}
`;

const TUNNEL_FRAG = `
precision mediump float;
varying float v_a;
varying float v_side;
varying float v_along;
varying vec3 v_col;
void main() {
  // a hot core plus a soft halo, like light blooming in a lens
  float s2 = v_side * v_side;
  float a = (exp(-s2 * 16.0) + exp(-s2 * 2.6) * 0.22) * pow(v_along, 0.6) * v_a;
  vec3 c = v_col * a;
  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)));
}
`;

const BG_VERT = `
attribute vec2 a_pos;
varying vec2 v_ndc;
void main() {
  v_ndc = a_pos;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const BG_FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_hole;
uniform float u_haze;
uniform float u_gain;
uniform vec2 u_bend;
varying vec2 v_ndc;

void main() {
  vec2 p = v_ndc * vec2(u_res.x / u_res.y, 1.0) - u_bend * 0.35;
  float r = length(p);
  // dark core, a faint silver haze towards the walls
  vec3 col = vec3(0.012, 0.012, 0.018);
  col += vec3(0.55, 0.58, 0.70) * u_haze * smoothstep(0.15, 1.4, r) * 0.1;
  col *= 1.0 - 0.35 * smoothstep(0.7, 1.6, r);
  // exit: the middle turns see-through, so the page behind the hero shows through it
  float solid = smoothstep(u_hole * 0.9, u_hole * 1.05 + 0.001, r);
  gl_FragColor = vec4(col * u_gain * solid, solid);
}
`;

function perspective(fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('[tunnel] shader:', gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

function link(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  return { prog, vs, fs };
}

// Vertex data depends only on the particle and segment counts, so it is built once and shared
// (the menu's tunnel reuses the hero's instead of rebuilding it the moment the menu opens).
const dataCache = new Map<string, Float32Array>();
function trailData(count: number, segments: number) {
  const key = `${count}:${segments}`;
  const hit = dataCache.get(key);
  if (hit) return hit;
  const perParticle = segments * 6;
  const data = new Float32Array(count * perParticle * 6);
  let o = 0;
  for (let i = 0; i < count; i++) {
    const a = Math.random();
    const b = Math.random();
    const c = Math.random();
    const d = Math.random();
    for (let k = 0; k < segments; k++) {
      const s0 = k / segments;
      const s1 = (k + 1) / segments;
      // two triangles per segment: (s0,-1) (s1,-1) (s1,1) / (s0,-1) (s1,1) (s0,1)
      const verts = [s0, -1, s1, -1, s1, 1, s0, -1, s1, 1, s0, 1];
      for (let v = 0; v < 6; v++) {
        data[o++] = a;
        data[o++] = b;
        data[o++] = c;
        data[o++] = d;
        data[o++] = verts[v * 2];
        data[o++] = verts[v * 2 + 1];
      }
    }
  }
  dataCache.set(key, data);
  return data;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

export function WormholeTunnel({
  progress,
  className,
  ignoreCover = false,
  clearCentre = false,
  paused = false,
}: {
  progress: MotionValue<number>;
  className?: string;
  /** keep rendering when the menu covers the page (for the copy inside the menu itself) */
  ignoreCover?: boolean;
  /** keep the middle free of streaks at rest, so the hero sphere in front reads clearly */
  clearCentre?: boolean;
  /** stop drawing (the context and buffers stay ready, so resuming is instant) */
  paused?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const updateRef = useRef<() => void>(() => {});
  useEffect(() => {
    pausedRef.current = paused;
    updateRef.current();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, depth: false, powerPreference: 'high-performance' });
    if (!gl) return;
    const tunnel = link(gl, TUNNEL_VERT, TUNNEL_FRAG);
    const bg = link(gl, BG_VERT, BG_FRAG);
    if (!tunnel || !bg) return;

    const q = quality();
    const small = window.innerWidth < 768;
    const COUNT = Math.round((small ? 7000 : 16000) * q.count);
    const SEGMENTS = q.trailSegments;
    const VERTS = COUNT * SEGMENTS * 6;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, trailData(COUNT, SEGMENTS), gl.STATIC_DRAW);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const tu = (n: string) => gl.getUniformLocation(tunnel.prog, n);
    const T = {
      proj: tu('u_proj'), res: tu('u_res'), rot: tu('u_rot'), rotVel: tu('u_rotVel'), travel: tu('u_travel'),
      zVel: tu('u_zVel'), trail: tu('u_trail'), gain: tu('u_gain'), dpr: tu('u_dpr'), hole: tu('u_hole'),
      clear: tu('u_clear'), clearR: tu('u_clearR'), cut: tu('u_cut'), exit: tu('u_exit'), bend: tu('u_bend'),
    };
    const aSeed = gl.getAttribLocation(tunnel.prog, 'a_seed');
    const aCorner = gl.getAttribLocation(tunnel.prog, 'a_corner');
    const bu = (n: string) => gl.getUniformLocation(bg.prog, n);
    const B = { res: bu('u_res'), hole: bu('u_hole'), haze: bu('u_haze'), gain: bu('u_gain'), bend: bu('u_bend') };
    const aPos = gl.getAttribLocation(bg.prog, 'a_pos');

    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.ONE, gl.ONE);

    // resolution follows the device tier, and drops a step further if frames start running late
    const maxDpr = canvasDpr(small ? 1.5 : 1.75);
    const governor = createFrameGovernor({ min: Math.min(maxDpr, q.tier === 'low' ? 0.5 : 0.75), max: maxDpr });
    let dpr = governor.scale;
    const view = { w: 1, h: 1, aspect: 1, fov: 1, clearR: 0 };
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      view.w = w;
      view.h = h;
      view.aspect = w / h;
      // wide lens; wider still on portrait phones
      view.fov = ((view.aspect < 1 ? 86 : 64) * Math.PI) / 180;
      // the hero sphere's radius (its box is 340 / 600 / 800 px wide) in units of half the height
      const cw = canvas.clientWidth;
      const box = cw >= 1024 ? 800 : cw >= 768 ? 600 : 340;
      view.clearR = clearCentre ? (box * 0.24) / Math.max(1, canvas.clientHeight / 2) : 0;
      needsDraw = true;
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let needsDraw = true;
    let raf = 0;
    let running = false;
    let last = 0;
    let elapsed = 0;
    let rot = 0;
    let travel = 0;
    let smoothP = progress.get();
    let exit = 0;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    // replay the arrival (fade-in and rush of light) when the loading screen lifts
    const onReady = () => {
      elapsed = 0;
    };
    window.addEventListener('site-ready', onReady);
    const unsubscribe = progress.on('change', () => {
      needsDraw = true;
    });

    const limit = createFrameLimiter();
    let drewBehindLoader = false;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!limit(now)) return;
      // hidden behind the loading screen: one frame is enough, the rest would only slow the loader
      if (!isSiteReady()) {
        if (drewBehindLoader) return;
        drewBehindLoader = true;
      }
      const raw = last ? (now - last) / 1000 : 0;
      const dt = Math.min(raw, 0.05);
      last = now;
      if (!reduced && governor.sample(raw)) {
        dpr = governor.scale;
        resize();
      }
      const p = progress.get();
      if (reduced) {
        if (!needsDraw) return;
        smoothP = p;
      } else {
        elapsed += dt;
        smoothP += (p - smoothP) * (1 - Math.exp(-dt * 5));
        mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-dt * 2));
        mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-dt * 2));
      }
      needsDraw = false;
      // the canvas has faded out completely once the exit is through: nothing to draw
      if (smoothP > 0.997 && p > 0.997) return;

      // the swirl winds up first, then the light leaves the way it came in; the exit follows the
      // scroll at its own unhurried pace, so even a fast flick plays out calmly
      const twirl = smooth(clamp01(smoothP / 0.4));
      const exitTarget = smooth(clamp01((smoothP - 0.25) / 0.55));
      if (reduced) exit = exitTarget;
      else exit += (exitTarget - exit) * (1 - Math.exp(-dt * 1.3));
      // nothing farther than this depth is lit: it sweeps from the far end of the tunnel to the camera
      const cut = -98 + 97.6 * Math.pow(exit, 0.75);
      const hole = smooth(clamp01((smoothP - 0.66) / 0.3)) * 1.7;
      const rush = reduced ? 0 : 70 * Math.exp(-elapsed * 1.6); // arriving on page load
      const rotVel = 1.05 + twirl * 1.9;
      const zVel = 1.5 + twirl * 1.5 + exit * 16 + rush;
      if (!reduced) {
        rot += rotVel * dt;
        travel += zVel * dt;
      }
      const fadeIn = reduced ? 1 : Math.min(elapsed / 1.1, 1);
      const bendX = mouse.x * 0.9 * (1 - exit * 0.6);
      const bendY = mouse.y * 0.6 * (1 - exit * 0.6);
      const fov = view.fov * (1 + 0.06 * twirl);
      // the clear middle grows with the sphere as it comes closer, and lets go once it has faded
      const clear = clearCentre ? 1 - smooth(clamp01((smoothP - 0.45) / 0.25)) : 0;
      const clearR = view.clearR * (1 + 1.6 * clamp01(smoothP / 0.85));

      // 1) background: haze and the exit
      gl.disable(gl.BLEND);
      gl.useProgram(bg.prog);
      gl.uniform2f(B.res, view.w, view.h);
      gl.uniform1f(B.hole, hole);
      gl.uniform1f(B.haze, 1 + twirl * 0.8);
      gl.uniform1f(B.gain, fadeIn);
      gl.uniform2f(B.bend, bendX, bendY);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(aPos);

      // 2) trails of light, added on top
      gl.enable(gl.BLEND);
      gl.useProgram(tunnel.prog);
      gl.uniformMatrix4fv(T.proj, false, perspective(fov, view.aspect, 0.1, 120));
      gl.uniform2f(T.res, view.w, view.h);
      gl.uniform1f(T.rot, rot);
      gl.uniform1f(T.rotVel, reduced ? 1.05 : rotVel);
      gl.uniform1f(T.travel, travel);
      gl.uniform1f(T.zVel, zVel);
      gl.uniform1f(T.trail, reduced ? 0.06 : 0.11 + twirl * 0.24);
      gl.uniform1f(T.gain, fadeIn);
      gl.uniform1f(T.dpr, dpr);
      gl.uniform1f(T.hole, hole);
      gl.uniform1f(T.clear, clear);
      gl.uniform1f(T.clearR, clearR);
      gl.uniform1f(T.cut, cut);
      gl.uniform1f(T.exit, exit);
      gl.uniform2f(T.bend, bendX, bendY);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(aSeed);
      gl.vertexAttribPointer(aSeed, 4, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(aCorner);
      gl.vertexAttribPointer(aCorner, 2, gl.FLOAT, false, 24, 16);
      gl.drawArrays(gl.TRIANGLES, 0, VERTS);
      gl.disableVertexAttribArray(aSeed);
      gl.disableVertexAttribArray(aCorner);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Only render while the hero is on screen and not covered by the menu / resume panel
    let onScreen = false;
    let covered = false;
    // while paused, draw a single frame once, so the GPU finishes setting everything up in advance
    let warmed = false;
    const warm = () => {
      if (warmed || running) return;
      warmed = true;
      raf = requestAnimationFrame((t) => {
        frame(t);
        cancelAnimationFrame(raf);
      });
    };
    const update = () => {
      if (onScreen && !covered && !pausedRef.current) start();
      else {
        stop();
        if (onScreen && pausedRef.current) warm();
      }
    };
    updateRef.current = update;
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    io.observe(canvas);
    const onCover = (ev: Event) => {
      if (ignoreCover) return;
      covered = (ev as CustomEvent<boolean>).detail;
      update();
    };
    window.addEventListener('site-overlay', onCover);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const onLost = (ev: Event) => {
      ev.preventDefault();
      stop();
    };
    canvas.addEventListener('webglcontextlost', onLost);

    return () => {
      stop();
      updateRef.current = () => {};
      io.disconnect();
      ro.disconnect();
      unsubscribe();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('site-ready', onReady);
      window.removeEventListener('site-overlay', onCover);
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteBuffer(buf);
      gl.deleteBuffer(quad);
      for (const p of [tunnel, bg]) {
        gl.deleteProgram(p.prog);
        gl.deleteShader(p.vs);
        gl.deleteShader(p.fs);
      }
      // free the context now (see GLSlot); waiting for GC keeps it counted against the page's limit
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [progress, ignoreCover, clearCentre]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
