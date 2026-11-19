import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createFrameGovernor } from '../../lib/frameGovernor';
import { canvasDpr, createFrameLimiter, quality } from '../../lib/quality';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
  MORPH_STOPS,
  brainPoint,
  fragmentPoint,
  globePoint,
  makeBulbSampler,
  makeNoise,
  mulberry32,
} from './shapes';

/**
 * Thousands of iridescent metal shards that form a brain, burst into fragments, re-form as a
 * lightbulb (whose filament really glows) and then a globe, driven by the pinned section's scroll.
 * Shard positions are blended on the GPU; reflections come from a small procedural studio.
 */

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

// A studio for the shards to reflect: dark room, white softboxes, violet and gold panels
function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(20, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0x07050d, side: THREE.BackSide }),
  );
  scene.add(room);
  const panel = (color: number, intensity: number, w: number, h: number, pos: [number, number, number]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  panel(0xffffff, 6, 6, 4, [-4, 6, 5]); // key softbox
  panel(0xffffff, 3, 10, 1, [0, 9, 0]); // overhead strip
  panel(0x8b5cf6, 5, 3, 8, [8, 1, -3]); // violet wall
  panel(0xf5b942, 4, 4, 2, [-7, -2, -4]); // gold kicker
  panel(0x67e8f9, 2.5, 1, 5, [5, 2, 7]); // cool strip
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(scene, 0.03).texture;
  pmrem.dispose();
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  return env;
}

export default function ShardMorph({
  sectionRef,
  className,
  exploded = false,
  onCollapse,
  hotspotRef,
}: {
  sectionRef: React.RefObject<HTMLElement | null>;
  className?: string;
  /** Burst the current shape open to show what's inside it */
  exploded?: boolean;
  /** Called when scrolling moves on to another shape while it is open */
  onCollapse?: () => void;
  /** An element the scene keeps positioned over the shape (for the cursor to lock onto and to click) */
  hotspotRef?: React.RefObject<HTMLElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const explodedRef = useRef(exploded);
  const collapseRef = useRef(onCollapse);
  explodedRef.current = exploded;
  collapseRef.current = onCollapse;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phone = window.innerWidth < 768;
    const weak = (navigator.hardwareConcurrency || 8) <= 4;
    const q = quality();
    // fewer shards on weaker devices (same shapes, same look)
    const COUNT = Math.max(900, Math.round((phone ? 4400 : weak ? 4200 : 6000) * Math.min(1, q.count * 1.15)));

    let renderer: THREE.WebGLRenderer;
    const giveUp = () => window.dispatchEvent(new Event('shards-ready'));
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: q.tier === 'high' && !phone, alpha: false, powerPreference: 'high-performance' });
    } catch {
      giveUp();
      return;
    }
    renderer.setClearColor(0x030303, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.environment = studioEnvironment(renderer);
    scene.fog = new THREE.Fog(0x030303, 7, 15);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    camera.position.set(0, 0, 7);

    // ---------- shards ----------
    const rand = mulberry32(20261119);
    const noise = makeNoise(rand);
    const bulb = makeBulbSampler(rand);
    const p0 = new Float32Array(COUNT * 3);
    const p1 = new Float32Array(COUNT * 3);
    const p2 = new Float32Array(COUNT * 3);
    const p3 = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      p0.set(brainPoint(rand, noise), i * 3);
      p1.set(fragmentPoint(rand), i * 3);
      p2.set(bulb(), i * 3);
      p3.set(globePoint(rand, noise), i * 3);
      seeds.set([rand(), rand(), rand(), rand()], i * 4);
    }

    const shard = new THREE.TetrahedronGeometry(1, 0);
    shard.scale(1, 1.25, 0.32); // flattened, elongated: reads as a shard, not a pyramid
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = shard.index;
    geometry.setAttribute('position', shard.getAttribute('position'));
    geometry.setAttribute('normal', shard.getAttribute('normal'));
    geometry.setAttribute('aP0', new THREE.InstancedBufferAttribute(p0, 3));
    geometry.setAttribute('aP1', new THREE.InstancedBufferAttribute(p1, 3));
    geometry.setAttribute('aP2', new THREE.InstancedBufferAttribute(p2, 3));
    geometry.setAttribute('aP3', new THREE.InstancedBufferAttribute(p3, 3));
    geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4));

    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.16,
      iridescence: 0.55,
      iridescenceIOR: 1.7,
      iridescenceThicknessRange: [180, 720],
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.25,
      flatShading: true,
    });
    const uniforms = {
      uFrom: { value: 1 },
      uTo: { value: 0 },
      uT: { value: 0 },
      uTime: { value: 0 },
      uExplode: { value: 0 },
      uKeep: { value: 0 },
      uGlobeW: { value: 0 },
    };
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          attribute vec3 aP0;
          attribute vec3 aP1;
          attribute vec3 aP2;
          attribute vec3 aP3;
          attribute vec4 aSeed;
          uniform float uFrom;
          uniform float uTo;
          uniform float uT;
          uniform float uTime;
          uniform float uExplode;
          uniform float uKeep;
          uniform float uGlobeW;
          varying vec3 vTint;
          vec3 pickP(float i) {
            if (i < 0.5) return aP0;
            if (i < 1.5) return aP1;
            if (i < 2.5) return aP2;
            return aP3;
          }
          mat3 rotAxis(vec3 a, float ang) {
            float s = sin(ang);
            float c = cos(ang);
            float oc = 1.0 - c;
            return mat3(
              oc * a.x * a.x + c, oc * a.x * a.y + a.z * s, oc * a.z * a.x - a.y * s,
              oc * a.x * a.y - a.z * s, oc * a.y * a.y + c, oc * a.y * a.z + a.x * s,
              oc * a.z * a.x + a.y * s, oc * a.y * a.z - a.x * s, oc * a.z * a.z + c);
          }
          vec3 tintFor(float h) {
            if (h < 0.45) return vec3(0.92, 0.92, 0.95);
            if (h < 0.70) return vec3(0.83, 0.79, 0.95);
            if (h < 0.88) return vec3(0.70, 0.62, 0.96);
            return vec3(0.96, 0.87, 0.70);
          }`,
        )
        .replace(
          '#include <beginnormal_vertex>',
          `float mt = clamp((uT - aSeed.x * 0.4) / 0.6, 0.0, 1.0);
          mt = mt * mt * (3.0 - 2.0 * mt);
          float arc = sin(mt * 3.14159) * step(0.5, abs(uTo - uFrom));
          vec3 instPos = mix(pickP(uFrom), pickP(uTo), mt)
            + arc * (vec3(fract(aSeed.y * 13.7), fract(aSeed.z * 7.3), fract(aSeed.w * 5.1)) - 0.5) * 2.4;
          // click: shards burst outward from the centre...
          float burst = uExplode * (1.0 - uKeep);
          vec3 outDir = normalize(instPos + vec3(0.0001, 0.0002, 0.0003));
          instPos += outDir * burst * (1.3 + aSeed.x * 1.8)
            + burst * (vec3(fract(aSeed.w * 9.1), fract(aSeed.x * 5.3), fract(aSeed.y * 3.7)) - 0.5) * 0.8;
          // ...or, inside the bubble, gather into the small brain and small bulb it keeps
          vec3 inner = aSeed.y < 0.5 ? aP0 * 0.3 + vec3(-0.42, 0.08, 0.0) : aP2 * 0.3 + vec3(0.46, -0.02, 0.0);
          instPos = mix(instPos, inner, uKeep * uExplode);
          vec3 axis = normalize(vec3(aSeed.y, aSeed.z, aSeed.w) * 2.0 - 1.0 + 0.001);
          mat3 instRot = rotAxis(axis, aSeed.x * 6.2831 + uTime * (0.2 + aSeed.w * 0.5) + arc * 5.0 + burst * 4.0);
          // the bubble stage wears only a light dusting of shards
          float lighten = uGlobeW * (1.0 - uExplode * uKeep);
          float sizeK = mix(1.0, aSeed.y > 0.45 ? 0.0 : 0.42, lighten) * mix(1.0, 0.55, uExplode * uKeep);
          float instScale = mix(0.026, 0.06, aSeed.w) * sizeK;
          vTint = tintFor(aSeed.y);
          vec3 objectNormal = instRot * normal;
          #ifdef USE_TANGENT
            vec3 objectTangent = vec3(tangent.xyz);
          #endif`,
        )
        .replace('#include <begin_vertex>', 'vec3 transformed = instRot * (position * instScale) + instPos;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vTint;')
        .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse * vTint, opacity );');
    };
    material.customProgramCacheKey = () => 'shard-morph-v3';
    const shards = new THREE.Mesh(geometry, material);
    shards.frustumCulled = false;
    geometry.instanceCount = COUNT;

    const object = new THREE.Group();
    object.add(shards);
    scene.add(object);

    // ---------- filament (lightbulb stage) ----------
    class Coil extends THREE.Curve<THREE.Vector3> {
      getPoint(t: number, target = new THREE.Vector3()) {
        const a = t * Math.PI * 2 * 9;
        return target.set(-0.2 + t * 0.4, 0.57 + Math.sin(a) * 0.05, Math.cos(a) * 0.05);
      }
    }
    const filamentMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.62, 0.28).multiplyScalar(6), transparent: true, opacity: 0, toneMapped: false });
    const filament = new THREE.Group();
    filament.add(new THREE.Mesh(new THREE.TubeGeometry(new Coil(), 220, 0.012, 6), filamentMat));
    for (const side of [-1, 1]) {
      const wire = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(side * 0.12, -0.4, 0), new THREE.Vector3(side * 0.2, 0.57, 0)), 8, 0.007, 5),
        filamentMat,
      );
      filament.add(wire);
    }
    object.add(filament);
    const bulbLight = new THREE.PointLight(0xffa860, 0, 4, 2);
    bulbLight.position.set(0, 0.55, 0);
    object.add(bulbLight);

    // ---------- atmosphere (globe stage) ----------
    const atmosphereMat = new THREE.ShaderMaterial({
      uniforms: { uAmount: { value: 0 } },
      vertexShader: `varying vec3 vN; varying vec3 vV;
        void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uAmount; varying vec3 vN; varying vec3 vV;
        void main() { float rim = pow(1.0 - abs(dot(vN, vV)), 5.0); gl_FragColor = vec4(vec3(0.45, 0.4, 1.0) * rim * 0.6 * uAmount, 1.0); }`,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.55, 48, 32), atmosphereMat);
    object.add(atmosphere);

    // ---------- soap bubble (globe stage) ----------
    // a swirling film-thickness texture drives the rainbow interference colours
    const filmCanvas = document.createElement('canvas');
    filmCanvas.width = 256;
    filmCanvas.height = 128;
    const fctx = filmCanvas.getContext('2d')!;
    const fimg = fctx.createImageData(256, 128);
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 256; x++) {
        const n = noise(x / 34, y / 22, 0.5) * 0.65 + noise(x / 11, y / 9, 3.3) * 0.35;
        const v = Math.round(Math.min(Math.max(n * 1.15 - 0.05 + (y / 128) * 0.25, 0), 1) * 255);
        const i = (y * 256 + x) * 4;
        fimg.data[i] = fimg.data[i + 1] = fimg.data[i + 2] = v;
        fimg.data[i + 3] = 255;
      }
    }
    fctx.putImageData(fimg, 0, 0);
    const filmTex = new THREE.CanvasTexture(filmCanvas);
    filmTex.wrapS = THREE.RepeatWrapping;
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.02,
      transmission: 1,
      thickness: 0.01,
      ior: 1.33,
      iridescence: 1,
      iridescenceIOR: 1.33,
      iridescenceThicknessRange: [140, 720],
      iridescenceThicknessMap: filmTex,
      specularIntensity: 1,
      envMapIntensity: 2.4,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(1.5, 96, 64), bubbleMat);
    object.add(bubble);

    // ---------- inside the brain: a neural network ----------
    const NEURONS = phone ? 120 : 220;
    const neurons: number[][] = [];
    for (let i = 0; i < NEURONS; i++) neurons.push(brainPoint(rand, noise).map((v) => v * 0.8));
    const edgePos: number[] = [];
    const edgeT: number[] = [];
    const edgePhase: number[] = [];
    neurons.forEach((a, i) => {
      const near = neurons
        .map((b, j) => ({ j, d: (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2 }))
        .filter((o) => o.j > i)
        .sort((x, y) => x.d - y.d)
        .slice(0, 3);
      for (const { j } of near) {
        const b = neurons[j];
        const ph = rand();
        edgePos.push(...a, ...b);
        edgeT.push(0, 1);
        edgePhase.push(ph, ph);
      }
    });
    const netGeo = new THREE.BufferGeometry();
    netGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePos, 3));
    netGeo.setAttribute('aT', new THREE.Float32BufferAttribute(edgeT, 1));
    netGeo.setAttribute('aPhase', new THREE.Float32BufferAttribute(edgePhase, 1));
    const netMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uAmount: { value: 0 } },
      vertexShader: `attribute float aT; attribute float aPhase; varying float vT; varying float vPhase;
        void main() { vT = aT; vPhase = aPhase; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uTime; uniform float uAmount; varying float vT; varying float vPhase;
        void main() {
          float head = fract(uTime * 0.55 + vPhase);
          float pulse = exp(-pow((vT - head) * 7.0, 2.0));
          vec3 col = vec3(0.55, 0.4, 1.0) * 0.45 + vec3(0.9, 0.85, 1.0) * pulse * 3.0;
          gl_FragColor = vec4(col * uAmount, 1.0);
        }`,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    const network = new THREE.LineSegments(netGeo, netMat);
    const neuronGeo = new THREE.BufferGeometry();
    neuronGeo.setAttribute('position', new THREE.Float32BufferAttribute(neurons.flat(), 3));
    const neuronMat = new THREE.PointsMaterial({
      color: new THREE.Color(0.85, 0.8, 1.0).multiplyScalar(2.5),
      size: 0.05,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    network.add(new THREE.Points(neuronGeo, neuronMat));
    object.add(network);

    // ---------- inside the bulb: its glass envelope ----------
    const profile: THREE.Vector2[] = [];
    for (let i = 0; i <= 60; i++) {
      const y = 1.5 - (i / 60) * 2.12;
      let r: number;
      if (y >= -0.04) r = Math.sqrt(Math.max(0.95 ** 2 - (y - 0.55) ** 2, 0));
      else r = 0.4 + (0.745 - 0.4) * (1 - Math.cos(((y + 0.62) / 0.58) * Math.PI)) * 0.5;
      profile.push(new THREE.Vector2(Math.max(r, 0.001), y + 0.05));
    }
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xfff4e6,
      metalness: 0,
      roughness: 0.04,
      transmission: 1,
      thickness: 0.05,
      ior: 1.5,
      specularIntensity: 1,
      envMapIntensity: 2,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const bulbGlass = new THREE.Mesh(new THREE.LatheGeometry(profile, 72), glassMat);
    object.add(bulbGlass);

    // ---------- lights and dust ----------
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-3, 4, 5);
    const rim = new THREE.DirectionalLight(0x8b5cf6, 3);
    rim.position.set(4, 1, -4);
    const brainGlow = new THREE.PointLight(0xa78bfa, 0, 3.5, 2);
    object.add(brainGlow);
    scene.add(key, rim);

    // Soft round sprite for dust and out-of-focus bokeh
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 64;
    const gctx = glowCanvas.getContext('2d')!;
    const ggrad = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    ggrad.addColorStop(0, 'rgba(255,255,255,1)');
    ggrad.addColorStop(0.55, 'rgba(255,255,255,0.55)');
    ggrad.addColorStop(0.8, 'rgba(255,255,255,0.12)');
    ggrad.addColorStop(1, 'rgba(255,255,255,0)');
    gctx.fillStyle = ggrad;
    gctx.fillRect(0, 0, 64, 64);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    // a few big, faint, out-of-focus motes close to the lens (shallow depth of field)
    const bokehCount = phone ? 18 : 36;
    const bokehPos = new Float32Array(bokehCount * 3);
    for (let i = 0; i < bokehCount; i++) bokehPos.set([(rand() * 2 - 1) * 4.5, (rand() * 2 - 1) * 2.8, 2 + rand() * 3], i * 3);
    const bokehGeo = new THREE.BufferGeometry();
    bokehGeo.setAttribute('position', new THREE.BufferAttribute(bokehPos, 3));
    const bokeh = new THREE.Points(
      bokehGeo,
      new THREE.PointsMaterial({ map: glowTex, color: 0xd8d0ff, size: 0.55, sizeAttenuation: true, transparent: true, opacity: 0.09, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    scene.add(bokeh);
    const dustCount = phone ? 400 : 900;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) dustPos.set([(rand() * 2 - 1) * 8, (rand() * 2 - 1) * 5, -7 + rand() * 10], i * 3);
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ map: glowTex, color: 0xe4ddff, size: 0.035, sizeAttenuation: true, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    scene.add(dust);

    // ---------- post: bloom for the glints and the filament ----------
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.28, 0.35, 0.92);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    // lowers the render resolution on machines that can't keep up
    const maxDpr = canvasDpr(phone ? 1.25 : 1.6);
    const governor = createFrameGovernor({ min: Math.min(maxDpr, q.tier === 'low' ? 0.5 : 0.7), max: maxDpr });
    let portrait = false;
    let needsDraw = true;
    const resize = () => {
      const dpr = governor.scale;
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      composer.setPixelRatio(dpr);
      composer.setSize(w, h);
      // the glow is soft anyway: a smaller buffer on weaker devices looks the same
      const bloomScale = q.tier === 'high' ? 0.5 : q.tier === 'medium' ? 0.35 : 0.25;
      bloom.resolution.set(w * bloomScale, h * bloomScale);
      portrait = w / h < 1;
      camera.aspect = w / h;
      camera.fov = portrait ? 38 * 1.35 : 38;
      camera.updateProjectionMatrix();
      needsDraw = true;
    };

    // Where the object sits for each shape (copy sits on the other side)
    const OFFSET_WIDE: Array<[number, number]> = [[1.55, 0], [0, 0], [-1.55, 0], [1.55, 0]];
    const OFFSET_TALL: Array<[number, number]> = [[0, 0.95], [0, 0.4], [0, 0.95], [0, 0.95]];
    const stageAt = (p: number, enter: number): [number, number, number] => {
      if (p <= 0) return [1, 0, smooth(clamp01((enter - 0.15) / 0.8))];
      if (p <= MORPH_STOPS[0][0]) return [0, 0, 0];
      for (let i = 0; i < MORPH_STOPS.length - 1; i++) {
        const [a, sa] = MORPH_STOPS[i];
        const [b, sb] = MORPH_STOPS[i + 1];
        if (p <= b) return sa === sb ? [sa, sa, 0] : [sa, sb, (p - a) / (b - a)];
      }
      return [3, 3, 0];
    };
    // How fully the object currently is a given shape (0..1)
    const weightOf = (shape: number, from: number, to: number, e: number) =>
      from === to ? (from === shape ? 1 : 0) : (from === shape ? 1 - e : 0) + (to === shape ? e : 0);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const pointer = { x: -1, y: -1 };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let raf = 0;
    let running = false;
    let last = 0;
    let time = 0;
    let smoothP = -1;
    let smoothEnter = 0;
    let lastKey = '';
    let explodeS = 0;
    let explodedAt = -1;
    const projected = new THREE.Vector3();
    const edge = new THREE.Vector3();

    const limit = createFrameLimiter();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!limit(now)) return;
      const raw = last ? (now - last) / 1000 : 0;
      const dt = Math.min(raw, 0.05);
      if (!reduced && governor.sample(raw)) resize();
      last = now;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp01(-rect.top / Math.max(rect.height - vh, 1));
      const enter = clamp01(1 - rect.top / vh);
      if (smoothP < 0 || reduced) {
        smoothP = p;
        smoothEnter = enter;
      } else {
        const k = 1 - Math.exp(-dt * 5);
        smoothP += (p - smoothP) * k;
        smoothEnter += (enter - smoothEnter) * k;
      }
      if (reduced) {
        const key = `${p.toFixed(4)}|${enter.toFixed(3)}|${explodedRef.current}|${pointer.x}|${pointer.y}`;
        if (key === lastKey && !needsDraw) return;
        lastKey = key;
      } else {
        time += dt;
        mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-dt * 2.5));
        mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-dt * 2.5));
      }
      needsDraw = false;

      const [from, to, t] = stageAt(smoothP, smoothEnter);
      const e = smooth(clamp01(t));
      const offsets = portrait ? OFFSET_TALL : OFFSET_WIDE;
      object.position.set(
        offsets[from][0] + (offsets[to][0] - offsets[from][0]) * e,
        offsets[from][1] + (offsets[to][1] - offsets[from][1]) * e,
        0,
      );
      object.rotation.set(0.12 + mouse.y * 0.18, Math.sin(time * 0.22) * 0.4 + mouse.x * 0.4 + smoothP * 2.2, 0);
      object.scale.setScalar(portrait ? 0.74 : 0.9);
      uniforms.uFrom.value = from;
      uniforms.uTo.value = to;
      uniforms.uT.value = t;
      uniforms.uTime.value = time;

      const settle = (shape: number) => clamp01(weightOf(shape, from, to, e));
      const brainW = settle(0);
      const bulbW = settle(2);
      const globeW = settle(3);

      // Open/close on click; moving on to another shape closes it again
      const dominant = t < 0.5 ? from : to;
      if (explodedRef.current) {
        if (explodedAt < 0) explodedAt = dominant;
        else if (dominant !== explodedAt) {
          explodedAt = -1;
          collapseRef.current?.();
        }
      } else explodedAt = -1;
      // Keep the hotspot over the shape on screen (hidden during the scattered-fragments stage)
      const hot = hotspotRef?.current;
      if (hot) {
        const cr = canvas.getBoundingClientRect();
        projected.copy(object.position).project(camera);
        edge.set(1, 0, 0).applyQuaternion(camera.quaternion).multiplyScalar(1.4 * object.scale.x).add(object.position).project(camera);
        const sx = (projected.x * 0.5 + 0.5) * cr.width;
        const sy = (0.5 - projected.y * 0.5) * cr.height;
        const radius = Math.abs(edge.x - projected.x) * 0.5 * cr.width;
        const shown = dominant !== 1 && rect.top <= 1 && rect.bottom >= vh - 1;
        hot.style.display = shown ? 'block' : 'none';
        hot.style.left = `${sx - radius}px`;
        hot.style.top = `${sy - radius}px`;
        hot.style.width = hot.style.height = `${radius * 2}px`;
      }

      const explodeTarget = explodedRef.current ? 1 : 0;
      explodeS += (explodeTarget - explodeS) * (1 - Math.exp(-dt * (reduced ? 60 : 3.2)));
      uniforms.uExplode.value = explodeS;
      uniforms.uKeep.value = globeW;
      uniforms.uGlobeW.value = globeW;

      const bulbOpen = bulbW * explodeS;
      filamentMat.opacity = bulbW * (0.85 + 0.15 * Math.sin(time * 9));
      filamentMat.color.setRGB(1.0, 0.62, 0.28).multiplyScalar(6 + bulbOpen * 10);
      filament.visible = bulbW > 0.01;
      bulbLight.intensity = bulbW * (4 + bulbOpen * 10);
      glassMat.opacity = bulbOpen;
      bulbGlass.visible = bulbOpen > 0.01;

      atmosphereMat.uniforms.uAmount.value = globeW * 0.45;
      atmosphere.visible = globeW > 0.01;
      bubbleMat.opacity = globeW;
      bubble.visible = globeW > 0.01;
      bubble.scale.set(1 + Math.sin(time * 1.7) * 0.012, 1 + Math.sin(time * 1.3 + 1) * 0.015, 1 + Math.sin(time * 1.1 + 2) * 0.012);
      filmTex.offset.x = time * 0.012;
      filmTex.offset.y = Math.sin(time * 0.2) * 0.05;

      const brainOpen = brainW * explodeS;
      netMat.uniforms.uTime.value = time;
      netMat.uniforms.uAmount.value = brainOpen;
      neuronMat.opacity = brainOpen;
      network.visible = brainOpen > 0.01;
      brainGlow.intensity = brainW * (1.1 + Math.sin(time * 2.3) * 0.5 + brainOpen * 2);

      bokeh.position.y = (smoothP - 0.5) * 3;
      bokeh.position.x = Math.sin(time * 0.05) * 0.3;
      dust.position.y = (smoothP - 0.5) * 1.4;
      dust.rotation.y = time * 0.01;

      // Fade in as the section arrives and out as it leaves
      const leave = clamp01((rect.bottom - vh * 0.15) / (vh * 0.6));
      renderer.toneMappingExposure = 1.05 * Math.min(smoothEnter * 1.6, 1) * leave;
      composer.render();
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

    let onScreen = false;
    let covered = false;
    const update = () => (onScreen && !covered ? start() : stop());
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    io.observe(canvas);
    const onCover = (ev: Event) => {
      covered = (ev as CustomEvent<boolean>).detail;
      update();
    };
    window.addEventListener('site-overlay', onCover);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // Build every shader in the background long before the section is reached, so its first frame
    // (and the bulb / globe parts appearing later) never freezes the scroll. Variants must match
    // what is drawn: the scene renders into the composer's buffer, the bloom passes into targets.
    let disposed = false;
    const warmUp = () => {
      if (disposed) return;
      try {
        // background compiling where the browser supports it; otherwise a plain compile (still at idle)
        const parallel = renderer.extensions.has('KHR_parallel_shader_compile');
        const compile = (target: THREE.Scene) =>
          parallel ? renderer.compileAsync(target, camera) : (renderer.compile(target, camera), Promise.resolve());
        const hidden = [filament, bulbGlass, atmosphere, bubble, network].filter((o) => !o.visible);
        hidden.forEach((o) => (o.visible = true));
        renderer.setRenderTarget(composer.readBuffer);
        const sceneReady = compile(scene);
        hidden.forEach((o) => (o.visible = false));
        const passScene = new THREE.Scene();
        const quad = new THREE.PlaneGeometry(2, 2);
        const passMats = Object.values(bloom as unknown as Record<string, unknown>)
          .flat()
          .filter((m): m is THREE.ShaderMaterial => !!m && (m as THREE.ShaderMaterial).isShaderMaterial === true);
        passMats.forEach((m) => passScene.add(new THREE.Mesh(quad, m)));
        renderer.setRenderTarget(bloom.renderTargetBright);
        const passReady = compile(passScene);
        renderer.setRenderTarget(null);
        for (const t of [filmTex, glowTex]) renderer.initTexture(t);
        Promise.all([sceneReady, passReady])
          .finally(() => quad.dispose())
          .then(() => whenQuiet(firstDraw));
      } catch {
        renderer.setRenderTarget(null);
      }
    };
    // The GPU still allocates the full-size buffers and finalises each program on its first real
    // draw, so draw one complete frame (every part shown) off screen while the page is quiet.
    const firstDraw = () => {
      if (!disposed && !running) {
        const hidden = [filament, bulbGlass, atmosphere, bubble, network].filter((o) => !o.visible);
        hidden.forEach((o) => (o.visible = true));
        composer.render();
        hidden.forEach((o) => (o.visible = false));
        needsDraw = true;
      }
      // the loading screen waits for this
      window.dispatchEvent(new Event('shards-ready'));
    };
    // run a job when the main thread is idle and the visitor isn't in the middle of scrolling
    let lastScroll = 0;
    const onScrollMark = () => (lastScroll = performance.now());
    window.addEventListener('scroll', onScrollMark, { passive: true });
    let quietTimer = 0;
    const whenQuiet = (job: () => void) => {
      const attempt = () => {
        if (disposed) return;
        if (performance.now() - lastScroll < 700) {
          quietTimer = window.setTimeout(attempt, 350);
          return;
        }
        if ('requestIdleCallback' in window) window.requestIdleCallback(job, { timeout: 2000 });
        else job();
      };
      attempt();
    };
    // early: the loading screen covers this work
    const warmTimer = window.setTimeout(() => whenQuiet(warmUp), 300);

    return () => {
      disposed = true;
      window.clearTimeout(warmTimer);
      window.clearTimeout(quietTimer);
      window.removeEventListener('scroll', onScrollMark);
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('site-overlay', onCover);
      scene.traverse((o) => {
        if (o instanceof THREE.Sprite) (o.material as THREE.Material).dispose();
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments || o instanceof THREE.Points) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
        }
      });
      scene.environment?.dispose();
      filmTex.dispose();
      glowTex.dispose();
      shard.dispose();
      composer.dispose();
      renderer.dispose();
      // free the context now (see GLSlot)
      renderer.forceContextLoss();
    };
  }, [sectionRef]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
