import React, { useEffect, useRef } from 'react';
import { createFrameGovernor } from '../../lib/frameGovernor';
import { whenProgramReady } from '../../lib/glProgram';
import { canvasDpr, createFrameLimiter, qualityTier } from '../../lib/quality';

/**
 * Liquid chrome: a few metal blobs that drift, merge and split (raymarched signed distance
 * fields reflecting a procedural studio), followed by a computer-vision style tracking overlay.
 */

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/** The studio the chrome reflects; shared with the follower blob. */
export const CHROME_ENV = `
// Studio: lit upper half, dark floor, crisp horizon, softboxes, strip lights, violet rim, warm kicker
vec3 env(vec3 d) {
  float y = d.y;
  vec3 sky = mix(vec3(0.34, 0.31, 0.42), vec3(0.08, 0.07, 0.13), smoothstep(0.0, 0.85, y));
  vec3 ground = mix(vec3(0.06, 0.04, 0.10), vec3(0.012, 0.01, 0.02), smoothstep(0.0, -0.6, y));
  vec3 col = mix(ground, sky, smoothstep(-0.012, 0.012, y));
  col += vec3(0.30, 0.16, 0.55) * pow(max(-y, 0.0), 2.0) * 0.7;
  col += vec3(1.0, 0.98, 1.0) * smoothstep(0.925, 0.95, dot(d, normalize(vec3(-0.6, 0.65, 0.45)))) * 5.0;
  col += vec3(0.95, 0.95, 1.0) * smoothstep(0.965, 0.99, y) * 2.2;
  float a = atan(d.x, d.z);
  col += vec3(0.90, 0.86, 1.0) * smoothstep(0.045, 0.0, abs(a - 1.2)) * smoothstep(-0.05, 0.25, y) * smoothstep(0.95, 0.6, y) * 3.5;
  col += vec3(0.75, 0.80, 1.0) * smoothstep(0.03, 0.0, abs(a + 2.2)) * smoothstep(-0.2, 0.5, y) * 2.0;
  col += vec3(0.55, 0.36, 0.97) * pow(max(dot(d, normalize(vec3(0.7, 0.1, -0.7))), 0.0), 6.0) * 2.4;
  col += vec3(0.98, 0.70, 0.30) * pow(max(dot(d, normalize(vec3(-0.9, -0.25, -0.3))), 0.0), 12.0) * 1.6;
  return col;
}
`;

const FRAG = (steps: number) => `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec4 u_balls[6];
uniform float u_glitch;
varying vec2 v_uv;

const float CAM = 4.2;
const float FOV = 0.42;

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float map(vec3 p) {
  float d = length(p - u_balls[0].xyz) - u_balls[0].w;
  for (int i = 1; i < 6; i++) d = smin(d, length(p - u_balls[i].xyz) - u_balls[i].w, 0.45);
  d += 0.01 * sin(p.x * 9.0 + u_time * 1.7) * sin(p.y * 8.0 - u_time * 1.3) * sin(p.z * 7.0 + u_time);
  return d;
}

vec3 calcNormal(vec3 p) {
  const vec2 e = vec2(0.0015, -0.0015);
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}

${CHROME_ENV}

void main() {
  vec2 uv = v_uv;
  float band = floor(uv.y * 28.0);
  float h = fract(sin(band * 91.7 + floor(u_time * 24.0) * 13.1) * 43758.5);
  uv.x += (h - 0.5) * 0.1 * u_glitch * step(0.55, h);
  vec2 p = (uv * 2.0 - 1.0) * vec2(u_res.x / u_res.y, 1.0);
  vec3 ro = vec3(0.0, 0.0, CAM);
  vec3 rd = normalize(vec3(p * FOV, -1.0));

  float t = 0.0;
  float dmin = 1e5;
  bool hit = false;
  for (int i = 0; i < ${steps}; i++) {
    float d = map(ro + rd * t);
    dmin = min(dmin, d);
    if (d < 0.0012) { hit = true; break; }
    t += d * 0.9;
    if (t > 8.0) break;
  }

  vec3 col = vec3(0.0);
  float alpha = 0.0;
  if (hit) {
    vec3 pos = ro + rd * t;
    vec3 n = calcNormal(pos);
    float ndv = clamp(dot(n, -rd), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 5.0);
    vec3 film = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + ndv * 1.6 + 0.2));
    vec3 metal = mix(vec3(0.92, 0.90, 1.0), film, 0.3);
    col = env(reflect(rd, n)) * metal * (0.8 + 0.7 * fres);
    float ao = clamp(map(pos + n * 0.12) / 0.12, 0.0, 1.0);
    col *= 0.5 + 0.5 * ao;
    alpha = 1.0;
  } else {
    float glow = exp(-max(dmin, 0.0) * 8.0);
    col = vec3(0.45, 0.30, 0.90) * glow * 0.5;
    alpha = glow * 0.4;
  }
  col.r *= 1.0 + u_glitch * 0.5 * h;
  col.b *= 1.0 + u_glitch * 0.3 * (1.0 - h);
  col = col / (1.0 + col);
  col = pow(col, vec3(0.4545));
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

const CAM = 4.2;
const FOV = 0.42;

// Five blobs on slow Lissajous orbits (radius, amplitudes, frequencies, phase); a sixth follows the cursor
const BLOBS = [
  { r: 0.66, a: [0.28, 0.22, 0.3], f: [0.31, 0.43, 0.27], ph: 0 },
  { r: 0.38, a: [0.75, 0.75, 0.45], f: [0.23, 0.51, 0.41], ph: 3.1 },
  { r: 0.3, a: [1.15, 0.35, 0.6], f: [0.39, 0.33, 0.22], ph: 4.4 },
  { r: 0.26, a: [0.5, 0.95, 0.4], f: [0.55, 0.37, 0.48], ph: 5.6 },
  { r: 0.22, a: [0.9, 0.85, 0.7], f: [0.29, 0.58, 0.33], ph: 2.4 },
];

export function ChromeTracker({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = glRef.current;
    const hud = hudRef.current;
    const ctx = hud?.getContext('2d');
    const gl = canvas?.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!wrap || !canvas || !hud || !ctx || !gl) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phone = window.innerWidth < 768;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG(phone ? 56 : 80));
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
      const uRes = gl.getUniformLocation(prog, 'u_res');
      const uTime = gl.getUniformLocation(prog, 'u_time');
      const uBalls = gl.getUniformLocation(prog, 'u_balls');
      const uGlitch = gl.getUniformLocation(prog, 'u_glitch');
      gl.clearColor(0, 0, 0, 0);

      // lowers the render resolution on machines that can't keep up
      const maxDpr = canvasDpr(phone ? 1.4 : 1.75);
      const governor = createFrameGovernor({ min: Math.min(maxDpr, qualityTier() === 'low' ? 0.5 : 0.75), max: maxDpr });
      let W = 0;
      let H = 0;
      let dpr = 1;
      const resize = () => {
        dpr = governor.scale;
        W = wrap.clientWidth;
        H = wrap.clientHeight;
        for (const c of [canvas, hud]) {
          c.width = Math.max(1, Math.round(W * dpr));
          c.height = Math.max(1, Math.round(H * dpr));
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uRes, canvas.width, canvas.height);
      };

      const balls = new Float32Array(24);
      // Smoothed tracker boxes lag behind the real blobs, like a real tracker would
      const track = BLOBS.map(() => ({ x: 0, y: 0, r: 0 }));
      let lost = 0;
      let nextGlitch = 3 + Math.random() * 3;
      let glitch = 0;

      const project = (x: number, y: number, z: number, r: number) => {
        const depth = CAM - z;
        const aspect = W / Math.max(H, 1);
        const nx = x / depth / FOV / aspect;
        const ny = y / depth / FOV;
        return { sx: (nx * 0.5 + 0.5) * W, sy: (0.5 - ny * 0.5) * H, sr: (r / depth / FOV) * H * 0.5 };
      };

      const drawHud = (time: number, positions: Array<{ x: number; y: number; z: number; r: number }>) => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        const font = phone ? 8 : 9;
        ctx.font = `${font}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.textBaseline = 'middle';
        const lostNow = lost > 0;
        const k = 1 - Math.exp(-0.16);

        positions.forEach((p, i) => {
          const s = project(p.x, p.y, p.z, p.r);
          const tr = track[i];
          if (tr.r === 0) Object.assign(tr, { x: s.sx, y: s.sy, r: s.sr });
          tr.x += (s.sx - tr.x) * k;
          tr.y += (s.sy - tr.y) * k;
          tr.r += (s.sr - tr.r) * k;
        });

        // links between tracked objects
        ctx.strokeStyle = lostNow ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        track.forEach((tr, i) => (i === 0 ? ctx.moveTo(tr.x, tr.y) : ctx.lineTo(tr.x, tr.y)));
        ctx.stroke();

        track.forEach((tr, i) => {
          const primary = i === 0;
          const jitter = lostNow ? (Math.random() - 0.5) * 10 : 0;
          const x = tr.x + jitter;
          const y = tr.y + jitter * 0.6;
          const half = Math.max(tr.r * 1.18, 10);
          const c = Math.min(half * 0.45, 12);
          ctx.strokeStyle = lostNow ? 'rgba(248,113,113,0.9)' : primary ? 'rgba(167,139,250,0.95)' : 'rgba(255,255,255,0.7)';
          ctx.lineWidth = primary ? 1.25 : 1;
          ctx.beginPath();
          for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
            const cx = x + sx * half;
            const cy = y + sy * half;
            ctx.moveTo(cx, cy - sy * c);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx - sx * c, cy);
          }
          ctx.stroke();
          // center cross
          ctx.beginPath();
          ctx.moveTo(x - 3, y);
          ctx.lineTo(x + 3, y);
          ctx.moveTo(x, y - 3);
          ctx.lineTo(x, y + 3);
          ctx.stroke();

          // Label the main blobs only, so the readout stays legible when they cluster
          if (i === 0 || i === 1 || (!phone && i === 3)) {
            const conf = lostNow ? 0.1 + Math.random() * 0.2 : 0.9 + 0.09 * Math.sin(time * 2 + i);
            ctx.fillStyle = lostNow ? 'rgba(248,113,113,0.95)' : primary ? '#DDD6FE' : 'rgba(255,255,255,0.8)';
            ctx.fillText(`OBJ_0${i + 1}  x:${Math.round(x * 1.5)} y:${Math.round(y * 1.5)}`, x - half, y - half - 8);
            if (primary) {
              ctx.fillStyle = 'rgba(255,255,255,0.5)';
              ctx.fillText(`r ${(tr.r / 100).toFixed(2)}  conf ${conf.toFixed(2)}`, x - half, y + half + 9);
            }
          }
        });

        // Pulsing lock ring on the main blob
        const m = track[0];
        if (!lostNow) {
          const pulse = (time * 0.8) % 1;
          ctx.strokeStyle = `rgba(167,139,250,${0.5 * (1 - pulse)})`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r * (1.3 + pulse * 0.6), 0, Math.PI * 2);
          ctx.stroke();
        }

        // Status line
        ctx.fillStyle = lostNow ? 'rgba(248,113,113,0.95)' : 'rgba(255,255,255,0.55)';
        ctx.fillText(lostNow ? 'SIGNAL LOST // REACQUIRING' : `TRACKING // ${BLOBS.length + 1} OBJ // LOCK`, 6, 10);
      };

      const render = (time: number) => {
        const positions = BLOBS.map((b, i) => {
          const w = 0.6;
          let x = b.a[0] * Math.sin(time * b.f[0] * w + b.ph);
          let y = b.a[1] * Math.sin(time * b.f[1] * w + b.ph * 1.3);
          const z = b.a[2] * Math.cos(time * b.f[2] * w + b.ph * 0.7);
          return { x, y, z, r: b.r };
        });
        positions.forEach((p, i) => balls.set([p.x, p.y, p.z, p.r], i * 4));
        balls.set([0, 0, 50, 0.001], 20); // unused sixth slot, parked far away
        gl.uniform4fv(uBalls, balls);
        gl.uniform1f(uTime, time);
        gl.uniform1f(uGlitch, glitch);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        drawHud(time, positions);
      };

      let raf = 0;
      let running = false;
      let last = 0;
      let time = 2;
      const limit = createFrameLimiter();
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        if (!limit(now)) return;
        const raw = last ? (now - last) / 1000 : 0;
        const dt = Math.min(raw, 0.05);
        if (governor.sample(raw)) resize();
        last = now;
        time += dt;
        if (time > nextGlitch) {
          glitch = 1;
          lost = 0.7;
          nextGlitch = time + 4 + Math.random() * 4;
        }
        glitch = Math.max(glitch - dt * 4, 0);
        lost = Math.max(lost - dt, 0);
        render(time);
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

      let onScreen = false;
      let covered = false;
      const update = () => {
        if (reduced) return;
        if (onScreen && !covered) start();
        else stop();
      };
      const io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        update();
      });
      io.observe(wrap);
      const onCover = (ev: Event) => {
        covered = (ev as CustomEvent<boolean>).detail;
        update();
      };
      window.addEventListener('site-overlay', onCover);
      const ro = new ResizeObserver(() => {
        resize();
        if (reduced || !running) render(time);
      });
      ro.observe(wrap);
      resize();

      teardown = () => {
        stop();
        io.disconnect();
        ro.disconnect();
        window.removeEventListener('site-overlay', onCover);
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
  }, []);

  return (
    <div ref={wrapRef} className={className} aria-hidden="true" data-chrome-dock>
      <canvas ref={glRef} className="absolute inset-0 w-full h-full" />
      <canvas ref={hudRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
