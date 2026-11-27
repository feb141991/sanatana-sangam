// Homepage moon hero: the 3D picture only. Bundled by scripts/moon-hero/build.mjs into
// public/assets/js/moon-hero.js, which public/landing.html loads after the page has finished
// loading. The chapter text and section links are handled by the small inline script in
// landing.html, which publishes the smoothed scroll position as window.__moonHero.p; this file
// reads it and draws. If this file never loads, the page still reads correctly.
//
// Calendar governance: the opening frame shows how much of the Moon is lit right now and
// whether it is waxing (astronomy, src/lib/moon-hero/astronomy.ts). No tithi is derived from
// it; the ring of lunar days is an illustrated month and its caption says so.

import {
  AdditiveBlending, BackSide, BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, Group,
  InstancedBufferAttribute, InstancedMesh, LineBasicMaterial, LineLoop, MathUtils, Mesh, MeshBasicMaterial,
  Object3D, PerspectiveCamera, Points, PointsMaterial, Raycaster, RepeatWrapping, Scene, ShaderMaterial,
  SphereGeometry, Sprite, SpriteMaterial, TorusGeometry, Vector2, Vector3, WebGLRenderer,
} from 'three';
import {
  illuminatedFraction, illustratedFraction, isWaxing, moonElongationDeg, tithiIndexForFraction, tithiLabel,
} from '../../src/lib/moon-hero/astronomy';

type HeroState = { p: number; still: boolean; visible: boolean };
declare global { interface Window { __moonHero?: HeroState } }

(function start() {
  const hero = document.getElementById('moon-hero');
  const state = window.__moonHero;
  if (!hero || !state) return;
  const stage = hero.querySelector<HTMLElement>('.mh-stage');
  const canvas = hero.querySelector<HTMLCanvasElement>('.mh-canvas');
  if (!stage || !canvas) return;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  } catch {
    return; // no WebGL: the CSS moon stays
  }

  // Phones and small laptops get a lighter picture: fewer polygons, a smaller texture, no relief.
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowPower = (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 2));

  const TAU = Math.PI * 2;
  const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  /* ---------- the Moon right now ---------- */
  const NOW = new Date();
  const nowElong = moonElongationDeg(NOW);
  const nowFrac = nowElong / 360;
  const nowLit = Math.round(illuminatedFraction(nowElong) * 100);
  const nowWaxing = isWaxing(nowElong);
  const REAL_UNTIL = 0.15;
  function moonFrac(p: number) {
    if (p > REAL_UNTIL) return illustratedFraction(p);
    const target = illustratedFraction(REAL_UNTIL);
    const end = target >= nowFrac ? target : target + 1; // always forward in time, through the new moon if needed
    return lerp(nowFrac, end, ss(0.04, REAL_UNTIL, p)) % 1;
  }

  /* ---------- scene ---------- */
  const scene = new Scene();
  scene.background = new Color();
  const camera = new PerspectiveCamera(35, 1, 0.1, 200);
  // page colours through the month: evening ink -> dusk rose -> cream paper
  const BG: [number, Color][] = [[0, '#161c2a'], [0.35, '#232b3d'], [0.55, '#a98f86'], [0.72, '#e8dac6'], [1, '#f3e9d9']]
    .map(([p, c]) => [p as number, new Color(c as string)]);
  const bgNow = new Color();
  function bgAt(p: number) {
    let i = 0; while (i < BG.length - 2 && p > BG[i + 1][0]) i++;
    return bgNow.copy(BG[i][1]).lerp(BG[i + 1][1], ss(BG[i][0], BG[i + 1][0], p));
  }

  function rng(seed: number) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function moonTexture() {
    const W = lowPower ? 1024 : 2048, H = W / 2, k = W / 2048;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d')!; const rnd = rng(11);
    g.fillStyle = '#c2c2c2'; g.fillRect(0, 0, W, H);
    for (let m = 0; m < 9; m++) { // maria: irregular dark seas from overlapping soft blobs
      const cx = rnd() * W, cy = H * (0.25 + rnd() * 0.5), sz = (90 + rnd() * 180) * k;
      for (let j = 0; j < 14; j++) {
        const x = cx + (rnd() - 0.5) * sz * 1.6, y = cy + (rnd() - 0.5) * sz, r = sz * (0.3 + rnd() * 0.5);
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, 'rgba(70,70,72,0.58)'); gr.addColorStop(1, 'rgba(78,78,78,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      }
    }
    const img = g.getImageData(0, 0, W, H), d = img.data; // fine speckle
    for (let i = 0; i < d.length; i += 4) { const v = (rnd() - 0.5) * 26; d[i] += v; d[i + 1] += v; d[i + 2] += v; }
    g.putImageData(img, 0, 0);
    for (let i = 0; i < 1400 * k; i++) { // craters: dark floor, soft bright rim, a few with rays
      const x = rnd() * W, y = rnd() * H, r = (1.5 + Math.pow(rnd(), 3.2) * 38) * Math.max(k, 0.6);
      g.fillStyle = `rgba(55,55,55,${0.2 + rnd() * 0.18})`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.strokeStyle = `rgba(255,255,255,${0.12 + rnd() * 0.16})`; g.lineWidth = Math.max(1, r * 0.14);
      g.beginPath(); g.arc(x - r * 0.12, y - r * 0.12, r * 0.92, Math.PI * 0.9, Math.PI * 1.9); g.stroke();
      if (r > 26 * k && rnd() > 0.5) {
        g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 2;
        for (let j = 0; j < 14; j++) {
          const a = rnd() * TAU, len = r * (3 + rnd() * 5);
          g.beginPath(); g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
        }
      }
    }
    const t = new CanvasTexture(cv); t.anisotropy = lowPower ? 2 : 8; t.wrapS = RepeatWrapping;
    return t;
  }

  const moonMat = new ShaderMaterial({
    uniforms: {
      uTex: { value: moonTexture() }, uLit: { value: new Color('#fffaf0') }, uDark: { value: new Color() },
      uEarth: { value: 0.028 }, uBump: { value: lowPower ? 0 : 0.05 },
    },
    vertexShader: /* glsl */`
      attribute float aPhase;
      varying vec3 vN; varying vec2 vUv; varying float vPhase; varying vec3 vPos;
      void main() {
        vUv = uv; vPhase = aPhase;
        mat4 m = modelMatrix * instanceMatrix;
        vec4 mv = viewMatrix * m * vec4(position, 1.0);
        vPos = mv.xyz;
        vN = normalize(mat3(viewMatrix * m) * normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uTex; uniform vec3 uLit; uniform vec3 uDark; uniform float uEarth; uniform float uBump;
      varying vec3 vN; varying vec2 vUv; varying float vPhase; varying vec3 vPos;
      vec3 bumped(vec3 n) { // relief from the crater texture, the method three.js uses for bumpMap
        if (uBump <= 0.0) return n;
        vec2 dx = dFdx(vUv), dy = dFdy(vUv);
        float h = texture2D(uTex, vUv).r;
        vec2 dH = uBump * vec2(texture2D(uTex, vUv + dx).r - h, texture2D(uTex, vUv + dy).r - h);
        vec3 sx = normalize(dFdx(vPos)), sy = normalize(dFdy(vPos));
        vec3 r1 = cross(sy, n), r2 = cross(n, sx);
        float det = dot(sx, r1);
        vec3 grad = sign(det) * (dH.x * r1 + dH.y * r2);
        return normalize(abs(det) * n - grad);
      }
      void main() {
        vec3 N0 = normalize(vN);
        vec3 N = bumped(N0);
        // Sun direction in view space: behind the Moon at new moon (phase 0), behind the viewer at full moon (phase PI).
        vec3 L = normalize(vec3(sin(vPhase), 0.0, -cos(vPhase)));
        float d = dot(N, L);
        float lit = smoothstep(-0.015, 0.07, d);
        float tex = texture2D(uTex, vUv).r;
        vec3 litCol = uLit * (0.36 + 0.66 * tex) * (0.76 + 0.24 * max(d, 0.0)); // wide enough that the seas still show at full moon
        vec3 darkCol = uDark * (0.9 + 0.2 * tex) + uLit * uEarth * tex * (0.6 + 0.4 * max(N0.z, 0.0)); // earthshine
        vec3 col = mix(darkCol, litCol, lit);
        col *= 1.0 - pow(1.0 - max(N0.z, 0.0), 4.0) * 0.16;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });

  const N = 30, RING = 1.9, SMALL = 0.13;
  const group = new Group(); scene.add(group);
  const sphere = lowPower ? new SphereGeometry(1, 48, 32) : new SphereGeometry(1, 96, 64);
  const moons = new InstancedMesh(sphere, moonMat, N + 1); // 0 = the large Moon, 1..30 = the ring
  const phaseAttr = new InstancedBufferAttribute(new Float32Array(N + 1), 1);
  sphere.setAttribute('aPhase', phaseAttr);
  for (let i = 0; i < N; i++) phaseAttr.array[i + 1] = ((i + 0.5) / N) * TAU;
  group.add(moons);
  const hullMat = new MeshBasicMaterial({ side: BackSide }); // a printed edge for each Moon
  const hull = new InstancedMesh(sphere, hullMat, N + 1); group.add(hull);

  const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 256;
  { const g = glowCanvas.getContext('2d')!, gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,246,226,1)'); gr.addColorStop(0.35, 'rgba(255,240,210,.35)'); gr.addColorStop(1, 'rgba(255,240,210,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }
  const glow = new Sprite(new SpriteMaterial({ map: new CanvasTexture(glowCanvas), transparent: true, depthWrite: false }));
  glow.position.set(0, 0, -1.2); glow.scale.setScalar(4.6); group.add(glow);

  const starGeo = new BufferGeometry();
  { const r = rng(5), pos: number[] = [];
    for (let i = 0; i < 420; i++) pos.push((r() - 0.5) * 60, (r() - 0.5) * 34, -18 - r() * 10);
    starGeo.setAttribute('position', new Float32BufferAttribute(pos, 3)); }
  const starMat = new PointsMaterial({ color: '#fdf3dc', size: 0.07, transparent: true, depthWrite: false, blending: AdditiveBlending });
  scene.add(new Points(starGeo, starMat));

  const orbit = new LineLoop(
    new BufferGeometry().setFromPoints(Array.from({ length: 180 }, (_, k) => {
      const a = (k / 180) * TAU; return new Vector3(Math.cos(a) * RING, Math.sin(a) * RING, -0.01);
    })),
    new LineBasicMaterial({ transparent: true, opacity: 0 }),
  );
  group.add(orbit);
  const marker = new Mesh(new TorusGeometry(SMALL * 1.65, 0.012, 8, 64), new MeshBasicMaterial({ color: '#d88a1c', transparent: true }));
  group.add(marker);

  const tmp = new Object3D();
  function setInstance(mesh: InstancedMesh, i: number, pos: Vector3, scale: number) {
    tmp.position.copy(pos); tmp.rotation.set(0, -0.6, 0); tmp.scale.setScalar(scale); tmp.updateMatrix();
    mesh.setMatrixAt(i, tmp.matrix);
  }

  /* ---------- words on the page ---------- */
  const labelsEl = hero.querySelector<HTMLElement>('.mh-labels');
  const labels = ([[29, 'Amavasya'], [14, 'Purnima'], [10, 'Shukla Ekadashi'], [25, 'Krishna Ekadashi']] as const).map(([i, t]) => {
    const el = document.createElement('span'); el.className = 'mh-label'; el.textContent = t; labelsEl?.appendChild(el); return { i, el };
  });
  const capTitle = hero.querySelector<HTMLElement>('.mh-cap-title');
  const capSub = hero.querySelector<HTMLElement>('.mh-cap-sub');
  const capNote = hero.querySelector<HTMLElement>('.mh-cap-note');
  let lastCap = '';

  /* ---------- layout ---------- */
  let W = 1, H = 1, wide = true;
  function resize() {
    W = canvas!.clientWidth || stage!.clientWidth; H = canvas!.clientHeight || window.innerHeight;
    renderer.setSize(W, H, false);
    // Side by side only on a wide, landscape screen; a portrait tablet uses the phone layout (text below the moon),
    // matching the hero's CSS media query and the inline script in landing.html.
    camera.aspect = W / H; wide = W >= 720 && W > H;
    camera.setViewOffset(W, H, wide ? -W * 0.22 : 0, wide ? 0 : H * 0.12, W, H);
    camera.updateProjectionMatrix();
  }

  /* ---------- draw ---------- */
  const v = new Vector3(), origin = new Vector3();
  const ringPos = Array.from({ length: N }, () => new Vector3());
  const ink = new Color('#3e2a1f'), cream = new Color('#faf6ef'), tmpC = new Color();
  const darkNight = new Color('#262d3e'), darkDay = new Color('#c4ad88');
  const hullNight = new Color('#39425a'), hullDay = new Color('#c9b391');
  const orbitNight = new Color('#c9cfdd'), orbitDay = new Color('#8e7868');
  const css = (c: Color) => `#${c.getHexString()}`;
  // The ring turns so the current lunar day sits at the bottom, which is the front once it tilts.
  const frontTurn = (idx: number) => -Math.PI / 2 - (Math.PI / 2 - ((idx + 0.5) / N) * TAU);
  let ringTurn = 0, curIdx = 0, reveal = 0;

  // Returns true while the ring is still turning toward its target, so the loop knows to keep drawing.
  function draw(p: number, settle: boolean): boolean {
    const bg = bgAt(p);
    (scene.background as Color).copy(bg);
    const day = ss(0.4, 0.75, p);
    const frac = moonFrac(p);
    phaseAttr.array[0] = frac * TAU; phaseAttr.needsUpdate = true;
    curIdx = tithiIndexForFraction(frac);

    moonMat.uniforms.uDark.value.copy(darkNight).lerp(darkDay, day);
    moonMat.uniforms.uEarth.value = lerp(0.028, 0.008, day); // linear light: small values brighten a lot on screen
    hullMat.color.copy(hullNight).lerp(hullDay, day);
    glow.material.opacity = lerp(0.42, 0.18, day) * (0.35 + 0.65 * Math.min(1, (1 - Math.cos(frac * TAU)) / 2 + 0.2));
    starMat.opacity = 0.85 * (1 - ss(0.3, 0.6, p));
    (orbit.material as LineBasicMaterial).color.copy(orbitNight).lerp(orbitDay, day);

    reveal = ss(0.12, 0.42, p);
    const want = frontTurn(curIdx) * ss(0.36, 0.5, p);
    const diff = Math.atan2(Math.sin(want - ringTurn), Math.cos(want - ringTurn));
    ringTurn += settle ? diff : diff * 0.08;
    const turning = !settle && Math.abs(diff) > 1e-4;

    setInstance(moons, 0, origin, 1); setInstance(hull, 0, origin, 1.012);
    for (let i = 0; i < N; i++) {
      const t = ss((i / N) * 0.75, (i / N) * 0.75 + 0.25, reveal);
      const th = Math.PI / 2 - ((i + 0.5) / N) * TAU + ringTurn;
      const rad = RING * lerp(0.62, 1, t);
      ringPos[i].set(Math.cos(th) * rad, Math.sin(th) * rad, lerp(-0.6, 0, t));
      const s = Math.max(SMALL * t, 1e-4);
      setInstance(moons, i + 1, ringPos[i], s); setInstance(hull, i + 1, ringPos[i], s * 1.07);
    }
    moons.instanceMatrix.needsUpdate = true; hull.instanceMatrix.needsUpdate = true;
    (orbit.material as LineBasicMaterial).opacity = 0.35 * reveal;
    marker.position.copy(ringPos[curIdx]); (marker.material as MeshBasicMaterial).opacity = reveal;

    const tilt = ss(0.72, 1, p);
    group.rotation.set(-1.05 * tilt, 0, 0); group.position.y = -0.6 * tilt;
    const tanH = Math.tan(MathUtils.degToRad(17.5));
    const fitZ = 2.25 / (tanH * Math.min(camera.aspect, 1.6));
    const zEnd = Math.max(wide ? 8.8 : 7.2, fitZ);
    const zStart = Math.max(5.4, 1.5 / (tanH * camera.aspect));
    camera.position.set(0, 0.25 * tilt, lerp(zStart, zEnd, ss(0.12, 0.42, p)) - 0.8 * tilt);
    camera.lookAt(0, -0.2 * tilt, 0);
    renderer.render(scene, camera);

    // Page colours follow the paper. Text switches from cream to ink while both chapters are faded out.
    const toInk = ss(0.47, 0.53, p), dark = toInk > 0.5;
    hero!.style.setProperty('--mh-bg', css(bg));
    hero!.style.setProperty('--mh-fg', css(tmpC.copy(cream).lerp(ink, toInk)));
    hero!.style.setProperty('--mh-fg-mid', dark ? 'rgba(62,42,31,.82)' : 'rgba(250,246,239,.82)');
    hero!.style.setProperty('--mh-fg-soft', dark ? 'rgba(62,42,31,.62)' : 'rgba(250,246,239,.62)');
    hero!.style.setProperty('--mh-kick', dark ? '#9f6314' : '#f0b25a');
    hero!.style.setProperty('--mh-btn-bg', dark ? '#3e2a1f' : '#faf6ef');
    hero!.style.setProperty('--mh-btn-fg', dark ? '#faf6ef' : '#3e2a1f');

    const real = p < REAL_UNTIL * 0.5 && !state!.still;
    const key = real ? 'real' : `t${curIdx}`;
    if (key !== lastCap && capTitle && capSub && capNote) {
      lastCap = key;
      if (real) {
        capTitle.textContent = 'The moon right now';
        capSub.textContent = `${nowLit}% lit, ${nowWaxing ? 'waxing' : 'waning'}`;
        capNote.textContent = ''; // founder decision 2026-11-27: no note under the real moon
      } else {
        const { name, line } = tithiLabel(curIdx);
        capTitle.textContent = name; capSub.textContent = line;
        capNote.textContent = 'An illustration of one lunar month, not tonight’s sky.';
      }
    }

    const emph = ss(0.45, 0.6, p) * (1 - ss(0.82, 0.95, p));
    group.updateMatrixWorld();
    for (const { i, el } of labels) {
      v.copy(ringPos[i]).multiplyScalar(1.22).applyMatrix4(group.matrixWorld).project(camera);
      el.style.left = `${(v.x * 0.5 + 0.5) * W}px`; el.style.top = `${(-v.y * 0.5 + 0.5) * H}px`;
      el.style.opacity = String((0.35 + 0.65 * emph) * reveal);
    }
    return turning;
  }

  /* ---------- hover or tap a Moon for its name ---------- */
  const tip = hero.querySelector<HTMLElement>('.mh-tip');
  const ray = new Raycaster(), ndc = new Vector2();
  function pick(ev: PointerEvent) {
    if (!tip) return;
    if (reveal < 0.9) { tip.style.opacity = '0'; return; }
    const r = canvas!.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    moons.computeBoundingSphere();
    const hit = ray.intersectObject(moons, false).find((h) => (h.instanceId ?? 0) > 0);
    if (!hit) { tip.style.opacity = '0'; canvas!.style.cursor = ''; return; }
    const { name, line } = tithiLabel((hit.instanceId as number) - 1);
    tip.textContent = ''; const s = document.createElement('strong'); s.textContent = name; tip.append(s, line);
    tip.style.left = `${ev.clientX - r.left}px`; tip.style.top = `${ev.clientY - r.top}px`;
    tip.style.opacity = '1'; canvas!.style.cursor = 'pointer';
  }
  canvas.addEventListener('pointermove', pick);
  canvas.addEventListener('pointerdown', pick);
  canvas.addEventListener('pointerleave', () => { if (tip) tip.style.opacity = '0'; });
  window.addEventListener('scroll', () => { if (tip) tip.style.opacity = '0'; }, { passive: true });

  /* ---------- run ---------- */
  const STILL_P = 0.68;
  resize();
  if (state.still) {
    draw(STILL_P, true);
    window.addEventListener('resize', () => { resize(); draw(STILL_P, true); });
  } else {
    window.addEventListener('resize', resize);
    draw(state.p, true);
    // Draw only while something moves: the scroll position (eased by the inline script) or the ring
    // settling. A page left still stops drawing, so an idle phone's graphics chip is not kept busy.
    let running = false, onScreen = true, lastP = -1;
    const tick = () => {
      if (!onScreen || document.hidden) { running = false; return; }
      const p = state.p;
      const turning = draw(p, false);
      if (!turning && p === lastP) { running = false; return; }
      lastP = p;
      requestAnimationFrame(tick);
    };
    const run = () => { if (!running) { running = true; requestAnimationFrame(tick); } };
    run();
    window.addEventListener('scroll', run, { passive: true });
    window.addEventListener('resize', run);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((e) => { onScreen = e[0].isIntersecting; if (onScreen) run(); }).observe(hero);
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); });
  }
  hero.classList.add('mh-ready');
})();
