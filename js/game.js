(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const bgm = document.getElementById("bgm");

  const FORMS = [
    { key: "base", aura: [210, 225, 255], scale: 1.0, shake: 3.2, ms: 3400 },
    { key: "ssj", aura: [255, 208, 36], scale: 1.02, shake: 5.2, ms: 3600 },
    { key: "ssj2", aura: [255, 220, 55], scale: 1.03, shake: 7.4, ms: 3600, lightning: true },
    { key: "ssj3", aura: [255, 232, 74], scale: 1.04, shake: 9.0, ms: 4000, lightning: true },
    { key: "ssj4", aura: [230, 42, 28], scale: 1.05, shake: 10.5, ms: 4000 },
    { key: "god", aura: [255, 58, 18], scale: 1.03, shake: 11.5, ms: 4200, fire: true },
    { key: "blue", aura: [48, 186, 255], scale: 1.04, shake: 12.5, ms: 4500 },
  ];

  const FINALS = {
    ui: { key: "ui", aura: [232, 242, 255], scale: 1.04, shake: 8.0, silver: true },
    ue: { key: "ue", aura: [186, 48, 255], scale: 1.05, shake: 15.0 },
  };

  const images = {};
  const audio = {};
  const loops = {};
  let audioCtx = null;
  let musicGain = null;
  let musicHooked = false;
  const MUSIC_GAIN = 4.5;
  const SFX_SCALE = 0.16;
  const MAX_PARTICLES = 70;
  const MAX_ROCKS = 14;
  const MAX_LINES = 12;

  let W = 0;
  let H = 0;
  let dpr = 1;
  let last = 0;
  let fade = 1;
  let flash = 0;
  let shake = 0;
  let chargeT = 0;
  let formIndex = 0;
  let state = "load";
  let charging = false;
  let finalKey = null;
  let tapCount = 0;
  let tapTimer = 0;
  let charBox = { x: 0, y: 0, w: 0, h: 0 };
  let choiceBoxes = { ui: null, ue: null };
  let transforming = false;
  let unlocked = false;
  let holding = false;
  let holdStart = 0;
  let holdTimer = 0;
  let camZoom = 1;
  let camTarget = 1;
  let stopGlow = 0;
  let skyFade = 0;
  let lines = [];
  let rocks = [];
  let cracks = [];
  let particles = [];
  let bolts = [];
  let rings = [];
  let orbSparks = [];
  let gesture = [];
  let drawing = false;
  let blast = null;
  let glass = [];
  let glassLife = 0;
  let blastCd = 0;

  function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "") ||
      (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 920);
  }

  function form() {
    if (finalKey) return FINALS[finalKey];
    return FORMS[formIndex];
  }

  function viewSize() {
    const vv = window.visualViewport;
    return {
      w: vv ? vv.width : window.innerWidth,
      h: vv ? vv.height : window.innerHeight,
      x: vv ? vv.offsetLeft : 0,
      y: vv ? vv.offsetTop : 0,
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const v = viewSize();
    W = Math.max(1, Math.floor(v.w * dpr));
    H = Math.max(1, Math.floor(v.h * dpr));
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = `${v.w}px`;
    canvas.style.height = `${v.h}px`;
    canvas.style.left = `${v.x}px`;
    canvas.style.top = `${v.y}px`;
  }

  function safePad() {
    const cs = getComputedStyle(document.documentElement);
    const n = (name) => parseFloat(cs.getPropertyValue(name)) || 0;
    return {
      t: n("--sat") * dpr,
      b: n("--sab") * dpr,
      l: n("--sal") * dpr,
      r: n("--sar") * dpr,
    };
  }

  function metrics() {
    const portrait = W < H;
    const phone = Math.min(W, H) / dpr < 760 || isMobile();
    const pad = safePad();
    const ground = H - Math.max(pad.b + 10 * dpr, portrait ? H * 0.07 : H * 0.085);
    return {
      portrait,
      phone,
      pad,
      ground,
      charH: portrait ? 0.5 : 0.66,
      charMaxW: portrait ? W * 0.68 : W * 0.3,
      tapPad: (phone ? 44 : 10) * dpr,
      tapMs: phone ? 480 : 380,
    };
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function loadAudio(src, loop = false) {
    const el = new Audio(src);
    el.preload = "auto";
    el.loop = loop;
    el.playsInline = true;
    return new Promise((resolve) => {
      const done = () => resolve(el);
      el.addEventListener("canplaythrough", done, { once: true });
      el.addEventListener("error", done, { once: true });
      setTimeout(done, 4000);
      el.load();
    });
  }

  function play(name, volume = 1, rate = 1) {
    const src = audio[name];
    if (!src || !unlocked) return null;
    const node = src.cloneNode();
    node.volume = Math.max(0, Math.min(1, volume * SFX_SCALE));
    node.playbackRate = rate;
    node.play().catch(() => {});
    return node;
  }

  function startLoop(name, volume = 0.4) {
    const src = name === "theme" ? audio.theme : audio[name];
    if (!src || !unlocked) return;
    src.loop = true;
    src.volume = name === "theme" ? 1 : Math.max(0, Math.min(1, volume));
    const p = src.play();
    if (p && p.catch) p.catch(() => {});
    loops[name] = src;
  }

  function setLoopVolume(name, volume) {
    if (loops[name] && name !== "theme") loops[name].volume = Math.max(0, Math.min(1, volume));
  }

  function stopLoop(name) {
    if (name === "theme") return;
    const src = loops[name];
    if (!src) return;
    src.pause();
    src.currentTime = 0;
    delete loops[name];
  }

  function duckMusic(on) {
    if (musicGain && audioCtx) {
      musicGain.gain.setTargetAtTime(on ? 2.4 : MUSIC_GAIN, audioCtx.currentTime, 0.06);
    } else if (audio.theme && !musicHooked) {
      audio.theme.volume = on ? 0.72 : 1;
    }
  }

  function boostMusicDesktop() {
    if (isMobile()) return;
    const src = audio.theme;
    if (!src) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    if (musicHooked) {
      if (musicGain) musicGain.gain.value = MUSIC_GAIN;
      return;
    }
    try {
      const node = audioCtx.createMediaElementSource(src);
      musicGain = audioCtx.createGain();
      musicGain.gain.value = MUSIC_GAIN;
      node.connect(musicGain);
      musicGain.connect(audioCtx.destination);
      musicHooked = true;
    } catch (_) {}
  }

  function playMusicNow() {
    const el = audio.theme || bgm;
    if (!el) return;
    audio.theme = el;
    el.loop = true;
    el.playsInline = true;
    el.setAttribute("playsinline", "true");
    el.muted = false;
    el.volume = 1;
    const kick = el.play();
    if (kick && kick.catch) {
      kick.catch(() => {
        el.muted = true;
        el.play()
          .then(() => {
            el.muted = false;
            el.volume = 1;
          })
          .catch(() => {});
      });
    }
    loops.theme = el;
    if (!isMobile()) boostMusicDesktop();
  }

  function goFullscreen() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (!req) return;
    const p = req.call(el);
    if (p && p.catch) p.catch(() => {});
  }

  function unlockAll() {
    if (!unlocked) {
      unlocked = true;
      if (window.AudioContext || window.webkitAudioContext) {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        audioCtx.resume().catch(() => {});
        const buf = audioCtx.createBuffer(1, 1, 22050);
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        src.connect(audioCtx.destination);
        try { src.start(0); } catch (_) {}
      }
      ["ki_scream", "ki_aura"].forEach((name) => {
        const a = audio[name];
        if (!a) return;
        a.volume = 0;
        a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = 1; }).catch(() => {});
      });
    }
    playMusicNow();
    goFullscreen();
  }

  function pointer(e) {
    const r = canvas.getBoundingClientRect();
    const src = e.changedTouches ? e.changedTouches[0] : e;
    return {
      x: ((src.clientX - r.left) * W) / r.width,
      y: ((src.clientY - r.top) * H) / r.height,
    };
  }

  function hit(box, p, pad = 0) {
    return (
      box &&
      p.x >= box.x - pad &&
      p.x <= box.x + box.w + pad &&
      p.y >= box.y - pad &&
      p.y <= box.y + box.h + pad
    );
  }

  function scream() {
    duckMusic(true);
    play("ki_scream", 0.1);
    setTimeout(() => duckMusic(false), 700);
  }

  function burst(kind, n) {
    const f = form();
    const [cr, cg, cb] = f.aura;
    const ground = metrics().ground;
    const box = charBox.w ? charBox : { x: W * 0.38, y: ground - H * 0.55, w: W * 0.24, h: H * 0.55 };
    const bodyCx = box.x + box.w / 2;
    const bodyCy = box.y + box.h * 0.48;
    const bodyW = Math.max(box.w, H * 0.16);
    const bodyH = Math.max(box.h, H * 0.4);
    const power = charging || state === "final" ? 1.3 : 1;

    for (let i = 0; i < n; i++) {
      if (kind === "dust") {
        const side = Math.random() < 0.5 ? -1 : 1;
        const dist = bodyW * (0.5 + Math.random() * 0.75);
        particles.push({
          kind, layer: "back",
          x: bodyCx + side * dist,
          y: ground - Math.random() * 16,
          vx: side * (3.5 + Math.random() * 9) * power,
          vy: -0.4 - Math.random() * 1.8,
          life: 1, decay: 0.012 + Math.random() * 0.014,
          size: 12 + Math.random() * 28,
          r: 118 + Math.random() * 36, g: 88 + Math.random() * 28, b: 52,
        });
      } else if (kind === "aura") {
        const ang = Math.random() * Math.PI * 2;
        const rx = bodyW * (0.4 + Math.random() * 0.14);
        const ry = bodyH * (0.44 + Math.random() * 0.1);
        particles.push({
          kind, layer: Math.random() < 0.5 ? "back" : "front",
          x: bodyCx + Math.cos(ang) * rx,
          y: bodyCy + Math.sin(ang) * ry,
          vx: Math.cos(ang) * 0.55,
          vy: -2.4 - Math.random() * 3.2,
          life: 1, decay: 0.016 + Math.random() * 0.012,
          size: 4 + Math.random() * 10,
          r: cr, g: cg, b: cb,
        });
      } else if (kind === "spark") {
        const ang = Math.random() * Math.PI * 2;
        particles.push({
          kind, layer: "front",
          x: bodyCx + Math.cos(ang) * bodyW * 0.35,
          y: bodyCy + Math.sin(ang) * bodyH * 0.4,
          vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
          life: 1, decay: 0.03 + Math.random() * 0.04,
          size: 2 + Math.random() * 4, r: 255, g: 255, b: 255,
        });
      } else if (kind === "fire") {
        const ang = Math.random() * Math.PI * 2;
        particles.push({
          kind, layer: Math.random() < 0.4 ? "back" : "front",
          x: bodyCx + Math.cos(ang) * bodyW * 0.4,
          y: bodyCy + Math.sin(ang) * bodyH * 0.45,
          vx: Math.cos(ang) * 0.8, vy: -3.2 - Math.random() * 4,
          life: 1, decay: 0.014 + Math.random() * 0.02,
          size: 9 + Math.random() * 18, r: 255, g: 70 + Math.random() * 90, b: 8,
        });
      } else if (kind === "dirt") {
        const side = Math.random() < 0.5 ? -1 : 1;
        const origin = blast ? W * 0.5 : bodyCx;
        const spread = blast ? W * 0.4 : bodyW;
        particles.push({
          kind, layer: Math.random() < 0.6 ? "back" : "front",
          x: origin + side * spread * (0.15 + Math.random()),
          y: ground - Math.random() * 12,
          vx: side * (6 + Math.random() * 16) * power,
          vy: -10 - Math.random() * 18,
          life: 1, decay: 0.01 + Math.random() * 0.012,
          size: 18 + Math.random() * 34,
          r: 108 + Math.random() * 38, g: 78 + Math.random() * 28, b: 46,
        });
      } else if (kind === "rock") {
        const side = Math.random() < 0.5 ? -1 : 1;
        const origin = blast ? W * 0.5 : bodyCx;
        const spread = blast ? W * 0.32 : bodyW;
        rocks.push({
          x: origin + side * spread * (0.2 + Math.random() * 0.8),
          y: ground + 8,
          vx: side * (4 + Math.random() * 12) * power,
          vy: -9 - Math.random() * 16,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.25,
          size: 8 + Math.random() * 24, life: 1,
        });
      }
    }
  }

  function spawnBolt() {
    const f = form();
    const ground = metrics().ground;
    const cx = W / 2;
    const top = ground - H * 0.72 * f.scale;
    const x = cx + (Math.random() - 0.5) * H * 0.2;
    const pts = [{ x, y: top + Math.random() * 40 }];
    let y = pts[0].y;
    while (y < ground - 20) {
      y += 16 + Math.random() * 26;
      pts.push({ x: pts[pts.length - 1].x + (Math.random() - 0.5) * 34, y });
    }
    bolts.push({ pts, life: 1, width: 1.6 + Math.random() * 2.6 });
  }

  function spawnRing() {
    rings.push({ r: 10, life: 1, grow: 6 + Math.random() * 5 });
  }

  function spawnLines(n) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      lines.push({
        ang, len: 40 + Math.random() * 120, dist: 40 + Math.random() * 80,
        life: 1, w: 1 + Math.random() * 2,
      });
    }
  }

  function makeCracks() {
    cracks = [];
    const cx = W / 2;
    const ground = metrics().ground;
    const n = 10 + formIndex * 3;
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI + (i / n) * Math.PI + (Math.random() - 0.5) * 0.4;
      cracks.push({ x: cx, y: ground, ang, len: H * (0.1 + Math.random() * 0.18 + formIndex * 0.014) });
    }
  }

  function canPowerCharge() {
    const k = form().key;
    return k === "blue" || k === "ui" || k === "ue";
  }

  function startCharge() {
    if (transforming || blast) return;
    if (charging) return;
    if (state !== "idle" && state !== "choose" && state !== "final") return;
    charging = true;
    chargeT = 0;
    if (canPowerCharge()) {
      if (form().key === "blue" && !finalKey) state = "choose";
      else if (finalKey) state = "final";
    } else {
      if (state !== "idle") { charging = false; return; }
      state = "charge";
    }
    shake = form().shake;
    makeCracks();
    spawnRing();
    spawnLines(18);
    burst("dust", 32);
    burst("aura", 46);
    burst("rock", 8);
    scream();
    startLoop("ki_aura", 0.12);
    play("whoosh_storm", 0.3);
    if (form().lightning) play("lightning", 0.3);
    if (form().fire) play("fire", 0.35);
  }

  function stopAtForm() {
    if (state === "load" || (state === "idle" && !charging)) return;
    charging = false;
    transforming = false;
    if (state !== "choose") state = "idle";
    shake = 1.5;
    stopGlow = 1;
    camTarget = 1;
    stopLoop("ki_aura");
    play("whoosh", 0.22);
  }

  function doTransform(nextIndex, toFinal) {
    if (transforming) return;
    transforming = true;
    charging = false;
    state = "transform";
    flash = 1;
    shake = 14;
    camTarget = 1.28;
    skyFade = 1;
    burst("spark", 90);
    burst("dust", 56);
    burst("rock", 18);
    spawnRing();
    spawnRing();
    spawnLines(40);
    scream();
    duckMusic(true);
    play("explosion", 0.5);
    play("impact", 0.42);
    play("whoosh_deep", 0.4);

    setTimeout(() => {
      transforming = false;
      camTarget = 1.04;
      duckMusic(false);
      if (toFinal) {
        finalKey = toFinal;
        formIndex = FORMS.length - 1;
        charging = holding;
        state = charging ? "final" : "idle";
        shake = form().shake;
        makeCracks();
        if (charging) startLoop("ki_aura", 0.16);
        else stopGlow = 1;
        return;
      }
      formIndex = nextIndex;
      charging = holding;
      if (charging) {
        state = "charge";
        chargeT = 0;
        shake = form().shake;
        makeCracks();
        scream();
        startLoop("ki_aura", 0.12 + formIndex * 0.01);
        if (form().lightning) play("lightning", 0.35);
        if (form().fire) play("fire", 0.4);
      } else {
        state = "idle";
        stopGlow = 1;
      }
    }, 220);
  }

  function explodeOrb(kind) {
    const box = choiceBoxes[kind];
    if (!box) return;
    for (let i = 0; i < 40; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 8;
      const rgb = kind === "ui" ? [236, 244, 255] : [176, 42, 255];
      orbSparks.push({
        x: box.cx, y: box.cy,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        life: 1, r: rgb[0], g: rgb[1], b: rgb[2], size: 3 + Math.random() * 6,
      });
    }
  }

  function resetAll() {
    formIndex = 0;
    finalKey = null;
    charging = false;
    holding = false;
    state = "idle";
    chargeT = 0;
    shake = 0;
    flash = 0;
    camZoom = 1;
    camTarget = 1;
    stopGlow = 0;
    skyFade = 0;
    particles = [];
    rocks = [];
    bolts = [];
    rings = [];
    cracks = [];
    lines = [];
    orbSparks = [];
    gesture = [];
    drawing = false;
    blast = null;
    glass = [];
    glassLife = 0;
    duckMusic(false);
    stopLoop("ki_aura");
    tapCount = 0;
    if (tapTimer) clearTimeout(tapTimer);
    tapTimer = 0;
  }

  function isCircle(pts) {
    if (!pts || pts.length < 12) return false;
    let sx = 0;
    let sy = 0;
    for (const p of pts) { sx += p.x; sy += p.y; }
    const cx = sx / pts.length;
    const cy = sy / pts.length;
    let minR = Infinity;
    let maxR = 0;
    let sumR = 0;
    for (const p of pts) {
      const r = Math.hypot(p.x - cx, p.y - cy);
      minR = Math.min(minR, r);
      maxR = Math.max(maxR, r);
      sumR += r;
    }
    const avgR = sumR / pts.length;
    if (avgR < Math.min(W, H) * 0.07) return false;
    if (maxR / Math.max(minR, 8) > 2.6) return false;
    const buckets = new Array(12).fill(0);
    for (const p of pts) {
      const a = Math.atan2(p.y - cy, p.x - cx);
      const i = Math.max(0, Math.min(11, Math.floor(((a + Math.PI) / (Math.PI * 2)) * 12)));
      buckets[i] = 1;
    }
    const filled = buckets.reduce((a, b) => a + b, 0);
    if (filled < 7) return false;
    const first = pts[0];
    const last = pts[pts.length - 1];
    return Math.hypot(first.x - last.x, first.y - last.y) < avgR * 0.75;
  }

  function makeGlass() {
    glass = [];
    const cx = W * 0.5;
    const cy = H * 0.46;
    for (let i = 0; i < 11; i++) {
      let x = cx + (Math.random() - 0.5) * W * 0.08;
      let y = cy + (Math.random() - 0.5) * H * 0.08;
      let a = (i / 11) * Math.PI * 2 + (Math.random() - 0.5) * 0.28;
      const segs = [{ x, y }];
      const len = Math.max(W, H) * (0.42 + Math.random() * 0.4);
      const steps = 8;
      for (let s = 0; s < steps; s++) {
        a += (Math.random() - 0.5) * 0.48;
        x += Math.cos(a) * (len / steps);
        y += Math.sin(a) * (len / steps);
        segs.push({ x, y });
      }
      glass.push({
        segs,
        delay: 0.05 + i * 0.07 + Math.random() * 0.05,
        grow: 0,
        speed: 0.85 + Math.random() * 0.45,
      });
    }
  }

  function fireBlast() {
    if (blast || charging || transforming || blastCd > 0 || state === "load") return;
    const f = form();
    const [r, g, b] = f.aura;
    blast = {
      t: 0, r, g, b, hit: false, launched: false,
      dirt: 0, pebbles: 0,
      sfx: [
        { t: 0, name: "charge_up", v: 4.2 },
        { t: 0.12, name: "whoosh", v: 2.8 },
        { t: 0.95, name: "whoosh_deep", v: 4.8 },
        { t: 1.05, name: "whoosh_wind", v: 3.2 },
        { t: 1.52, name: "explosion", v: 5.2 },
        { t: 1.62, name: "shockwave", v: 4.6 },
        { t: 1.70, name: "bass", v: 4.8 },
        { t: 1.80, name: "glass", v: 5.4 },
        { t: 1.90, name: "impact", v: 3.8 },
      ],
    };
    glassLife = 0;
    glass = [];
    camTarget = 1.08;
    shake = 2.4;
    duckMusic(true);
    startLoop("ki_aura", 0.1);
  }

  function playBlastSfx() {
    const q = blast && blast.sfx;
    if (!q || !q.length) return;
    if (blast.t >= q[0].t) {
      const s = q.shift();
      play(s.name, s.v);
    }
  }

  function updateBlast(dt) {
    if (blastCd > 0) blastCd = Math.max(0, blastCd - dt);
    if (!blast && glassLife > 0) {
      glassLife = Math.max(0, glassLife - dt * 0.4);
      if (glassLife <= 0) glass = [];
    }
    if (!blast) return;
    blast.t += dt;
    playBlastSfx();

    if (blast.t < 0.95) {
      shake = 2.2 + blast.t * 2.2;
      if (Math.random() < 0.35) burst("aura", 1);
    } else if (!blast.launched) {
      blast.launched = true;
      camTarget = 1.14;
      shake = 6;
      stopLoop("ki_aura");
      burst("aura", 4);
      burst("dust", 3);
    }

    if (blast.launched && !blast.hit) {
      shake = 6 + (blast.t - 0.95) * 4;
    }

    if (blast.t >= 1.52 && !blast.hit) {
      blast.hit = true;
      blast.hitAt = blast.t;
      camTarget = 1.18;
      shake = 11;
      glassLife = 1;
      makeGlass();
      blast.dirt = 18;
      blast.pebbles = 8;
      spawnLines(8);
    }

    if (blast.hit) {
      const age = blast.t - blast.hitAt;
      if (age < 0.22) flash = (age / 0.22) * 0.88;
      else if (age < 0.62) flash = 0.88;
      else if (age < 1.25) flash = 0.88 * (1 - (age - 0.62) / 0.63);
      if (blast.dirt > 0) {
        const n = Math.min(3, blast.dirt);
        burst("dirt", n);
        burst("dust", 2);
        blast.dirt -= n;
      }
      if (blast.pebbles > 0) {
        burst("rock", 1);
        blast.pebbles -= 1;
      }
      for (const g of glass) {
        g.delay -= dt;
        if (g.delay <= 0) g.grow = Math.min(1, g.grow + dt * g.speed);
      }
    }

    if (blast.t > 2.9) {
      duckMusic(false);
      blast = null;
      blastCd = 0.4;
      camTarget = 1;
    }
  }

  function resolveTaps() {
    const n = tapCount;
    tapCount = 0;
    tapTimer = 0;
    if (n >= 3) resetAll();
  }

  function onPointerDown(e) {
    e.preventDefault();
    unlockAll();
    const p = pointer(e);
    const m = metrics();

    if (state === "choose") {
      if (hit(choiceBoxes.ui, p, m.tapPad)) {
        drawing = false;
        explodeOrb("ui");
        doTransform(formIndex, "ui");
        return;
      }
      if (hit(choiceBoxes.ue, p, m.tapPad)) {
        drawing = false;
        explodeOrb("ue");
        doTransform(formIndex, "ue");
        return;
      }
    }

    if (hit(charBox, p, m.tapPad)) {
      drawing = false;
      holding = true;
      holdStart = performance.now();
      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        if (holding && !charging && (state === "idle" || state === "choose" || state === "final")) startCharge();
      }, 120);
      tapCount += 1;
      if (tapTimer) clearTimeout(tapTimer);
      tapTimer = setTimeout(resolveTaps, m.tapMs);
      return;
    }

    if (!charging && !transforming && !blast) {
      drawing = true;
      gesture = [p];
    }
  }

  function onPointerMove(e) {
    const p = pointer(e);
    const m = metrics();
    if (drawing && !charging) {
      const last = gesture[gesture.length - 1];
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 4 * dpr) gesture.push(p);
    }
    const over = hit(charBox, p, m.tapPad) ||
      (state === "choose" && (hit(choiceBoxes.ui, p, m.tapPad) || hit(choiceBoxes.ue, p, m.tapPad)));
    canvas.style.cursor = over ? "pointer" : "default";
  }

  function onPointerUp(e) {
    e.preventDefault();
    const dur = performance.now() - holdStart;
    holding = false;
    if (holdTimer) clearTimeout(holdTimer);
    if (drawing) {
      drawing = false;
      if (!charging && isCircle(gesture)) fireBlast();
      gesture = [];
      return;
    }
    if (dur >= 140 && tapCount < 3) {
      if (state === "charge" || state === "choose" || state === "final" || state === "transform") {
        stopAtForm();
      }
    }
  }

  function update(dt) {
    if (state === "load") return;
    fade = Math.max(0, fade - dt * 0.9);
    if (!blast) {
      flash = Math.max(0, flash - dt * 2.2);
    }
    stopGlow = Math.max(0, stopGlow - dt * 1.6);
    skyFade = Math.max(0.22, skyFade + ((charging || state === "final" ? 0.55 : 0.22) - skyFade) * dt * 3);
    camZoom += (camTarget - camZoom) * Math.min(1, dt * 6);
    if (state !== "transform") camTarget += (1 - camTarget) * dt * 1.8;
    const f = form();
    const intensity = charging ? Math.min(1, 0.25 + chargeT / (f.ms || 4000)) : 0.08;

    if (state === "charge" || state === "choose") {
      if (charging) {
        chargeT += dt * 1000;
        shake = f.shake * (0.55 + intensity);
        setLoopVolume("ki_aura", 0.1 + intensity * 0.08);
        if (Math.random() < 0.6) burst("dust", 2);
        if (Math.random() < 0.85) burst("aura", 4);
        if (Math.random() < 0.22) burst("spark", 2);
        if (Math.random() < 0.12) burst("rock", 1);
        if (f.lightning && Math.random() < (f.key === "ssj2" ? 0.16 : 0.08)) spawnBolt();
        if (f.fire && Math.random() < 0.55) burst("fire", 4);
        if (Math.random() < 0.05) spawnRing();
        if (Math.random() < 0.2) spawnLines(2);
      }
      if (state === "charge" && chargeT >= f.ms) {
        if (f.key === "blue") {
          state = "choose";
          charging = true;
        } else if (canPowerCharge()) {
          chargeT = Math.min(chargeT, f.ms);
        } else {
          doTransform(formIndex + 1);
        }
      }
    }

    if (state === "choose" && charging) {
      const cx = charBox.x + charBox.w / 2;
      const cy = charBox.y + charBox.h * 0.42;
      ["ui", "ue"].forEach((k) => {
        const o = choiceBoxes[k];
        if (!o) return;
        if (Math.random() < 0.5) {
          orbSparks.push({
            x: cx, y: cy,
            vx: (o.cx - cx) * 0.02, vy: (o.cy - cy) * 0.02,
            life: 1, size: 2 + Math.random() * 3,
            r: k === "ui" ? 236 : 176, g: k === "ui" ? 244 : 42, b: k === "ui" ? 255 : 255,
          });
        }
      });
    }

    if (state === "choose" && charging && canPowerCharge()) {
      chargeT = Math.min(chargeT, f.ms || 4500);
    }

    if (state === "final" && charging) {
      chargeT = Math.min(chargeT + dt * 1000, (f.ms || 4500));
      shake = f.shake * (0.55 + intensity);
      setLoopVolume("ki_aura", 0.1 + intensity * 0.08);
      if (Math.random() < 0.55) burst("dust", 2);
      if (Math.random() < 0.9) burst("aura", 4);
      if (Math.random() < 0.18) burst("spark", 3);
      if (f.silver && Math.random() < 0.08) spawnBolt();
      if (f.fire && Math.random() < 0.4) burst("fire", 3);
      if (Math.random() < 0.06) spawnRing();
      if (Math.random() < 0.15) spawnLines(2);
    }

    if (state === "idle" && Math.random() < 0.08) burst("dust", 1);

    for (const p of particles) {
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      if (p.kind === "dust" || p.kind === "dirt") { p.vy += 16 * dt; p.vx *= 0.986; }
      p.life -= p.decay * dt * 60;
    }
    if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
    particles = particles.filter((p) => p.life > 0);

    for (const r of rocks) {
      r.x += r.vx * dt * 60;
      r.y += r.vy * dt * 60;
      r.vy += 18 * dt;
      r.rot += r.vr;
      r.life -= 0.008 * dt * 60;
    }
    if (rocks.length > MAX_ROCKS) rocks.splice(0, rocks.length - MAX_ROCKS);
    rocks = rocks.filter((r) => r.life > 0 && r.y < H + 40);

    for (const b of bolts) b.life -= dt * 4.5;
    bolts = bolts.filter((b) => b.life > 0);
    for (const ring of rings) { ring.r += ring.grow * dt * 60; ring.life -= dt * 0.85; }
    rings = rings.filter((r) => r.life > 0);
    for (const ln of lines) { ln.dist += 280 * dt; ln.life -= dt * 2.2; }
    if (lines.length > MAX_LINES) lines.splice(0, lines.length - MAX_LINES);
    lines = lines.filter((ln) => ln.life > 0);
    for (const s of orbSparks) {
      s.x += s.vx * dt * 60;
      s.y += s.vy * dt * 60;
      s.life -= dt * 1.8;
    }
    orbSparks = orbSparks.filter((s) => s.life > 0);

    updateBlast(dt);
    shake *= 0.92;
  }

  function drawBackground() {
    const bg = images.bg;
    const scale = Math.max(W / bg.width, H / bg.height);
    const bw = bg.width * scale;
    const bh = bg.height * scale;
    ctx.drawImage(bg, (W - bw) / 2, (H - bh) / 2, bw, bh);
    const f = form();
    const [r, g, b] = f.aura;
    const power = charging || state === "final" || state === "transform" ? skyFade : 0.12;
    ctx.fillStyle = `rgba(${r},${g},${b},${0.06 + power * 0.16})`;
    ctx.fillRect(0, 0, W, H);
    const dark = charging || state === "choose" || state === "final" ? 0.22 + Math.min(chargeT / 6000, 0.22) : 0.08;
    ctx.fillStyle = `rgba(0,0,0,${dark})`;
    ctx.fillRect(0, 0, W, H);
  }

  function drawCracks() {
    if (!cracks.length) return;
    ctx.save();
    ctx.strokeStyle = "rgba(20,12,8,0.72)";
    ctx.lineWidth = 2 * dpr;
    ctx.lineCap = "round";
    for (const c of cracks) {
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      for (let i = 1; i <= 4; i++) {
        const t = i / 4;
        ctx.lineTo(c.x + Math.cos(c.ang) * c.len * t + (i % 2 ? 6 : -6), c.y + Math.sin(c.ang) * c.len * t * 0.25);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAura(box) {
    const f = form();
    const [r, g, b] = f.aura;
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h * 0.48;
    const t = performance.now();
    const pulse = 1 + Math.sin(t * 0.012) * 0.08;
    const power = charging || state === "final" ? 1 : 0.18;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 3; i >= 1; i--) {
      const rw = box.w * (0.48 + i * 0.16) * pulse * (0.9 + power * 0.25);
      const rh = box.h * (0.52 + i * 0.1) * pulse;
      const grd = ctx.createRadialGradient(cx, cy, Math.min(rw, rh) * 0.28, cx, cy, Math.max(rw, rh));
      grd.addColorStop(0, "rgba(0,0,0,0)");
      grd.addColorStop(0.42, `rgba(${r},${g},${b},${0.04 * power})`);
      grd.addColorStop(0.68, `rgba(${r},${g},${b},${(0.34 * power) / i})`);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (f.key === "blue" || f.silver) {
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.35 * power})`;
      ctx.lineWidth = 3 * dpr;
      ctx.beginPath();
      ctx.ellipse(cx, cy, box.w * 0.42 * pulse, box.h * 0.48 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRings(box) {
    const f = form();
    const [r, g, b] = f.aura;
    const cx = box.x + box.w / 2;
    const ground = box.y + box.h;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const ring of rings) {
      ctx.strokeStyle = `rgba(${r},${g},${b},${ring.life * 0.55})`;
      ctx.lineWidth = 3 * dpr * ring.life;
      ctx.beginPath();
      ctx.ellipse(cx, ground - 8, ring.r * 4.5, ring.r * 1.15, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLines() {
    if (!lines.length) return;
    const cx = W / 2;
    const cy = H * 0.45;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    for (const ln of lines) {
      ctx.globalAlpha = ln.life * 0.7;
      ctx.lineWidth = ln.w * dpr;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ln.ang) * ln.dist, cy + Math.sin(ln.ang) * ln.dist);
      ctx.lineTo(cx + Math.cos(ln.ang) * (ln.dist + ln.len), cy + Math.sin(ln.ang) * (ln.dist + ln.len));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles(layer) {
    ctx.save();
    for (const p of particles) {
      if ((p.layer || "front") !== layer) continue;
      ctx.globalAlpha = Math.max(0, p.life);
      if (p.kind === "dust" || p.kind === "dirt") {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = `rgba(${p.r | 0},${p.g | 0},${p.b | 0},${p.life * (p.kind === "dirt" ? 0.55 : 0.4)})`;
        ctx.fillRect(p.x - p.size, p.y - p.size * 0.42, p.size * 2, p.size * 0.84);
      } else {
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.life * 0.85})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawRocks() {
    for (const r of rocks) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.life);
      ctx.translate(r.x, r.y);
      ctx.rotate(r.rot);
      ctx.fillStyle = "#5a4636";
      ctx.beginPath();
      ctx.moveTo(-r.size, r.size * 0.3);
      ctx.lineTo(0, -r.size);
      ctx.lineTo(r.size, r.size * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawBolts() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const b of bolts) {
      ctx.strokeStyle = `rgba(255,255,210,${b.life})`;
      ctx.lineWidth = b.width * dpr;
      ctx.shadowColor = "#fff6a8";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(b.pts[0].x, b.pts[0].y);
      for (let i = 1; i < b.pts.length; i++) ctx.lineTo(b.pts[i].x, b.pts[i].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function spriteFor(key, useCharge) {
    const name = `${key}_${useCharge ? "charge" : "idle"}`;
    return images[name] || images[`${key}_idle`];
  }

  function layoutActor(img, cx, ground, height, maxW) {
    if (!img) return { x: cx, y: ground, w: 0, h: 0 };
    const t = performance.now();
    const breathe = 1 + Math.sin(t * 0.0032) * (charging ? 0.02 : 0.008);
    const squash = charging ? 1 + Math.sin(t * 0.018) * 0.012 : 1;
    let dh = height * breathe;
    let dw = dh * (img.width / img.height) * squash;
    const m = metrics();
    const margin = 18 * dpr * camZoom;
    const maxH = Math.max(40, ground - m.pad.t - margin);
    const maxSide = Math.max(40, W - m.pad.l - m.pad.r - margin * 2);
    const capW = Math.min(maxW || maxSide, maxSide);
    if (dh > maxH) { const s = maxH / dh; dh = maxH; dw *= s; }
    if (dw > capW) { const s = capW / dw; dw = capW; dh *= s; }
    return { x: cx - dw / 2, y: ground - dh, w: dw, h: dh };
  }

  function drawActor(img, box) {
    if (!img || !box || !box.w) return;
    if (charging || state === "transform" || state === "final") {
      const f = form();
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.22;
      ctx.drawImage(img, box.x - 10 * dpr, box.y, box.w, box.h);
      ctx.globalAlpha = 0.16;
      ctx.drawImage(img, box.x + 10 * dpr, box.y, box.w, box.h);
      ctx.fillStyle = `rgba(${f.aura[0]},${f.aura[1]},${f.aura[2]},0.12)`;
      ctx.restore();
    }
    ctx.drawImage(img, box.x, box.y, box.w, box.h);
    if (stopGlow > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = stopGlow * 0.45;
      ctx.drawImage(img, box.x, box.y, box.w, box.h);
      ctx.restore();
    }
  }

  function drawChoice() {
    const m = metrics();
    const t = performance.now();
    const pulse = 1 + Math.sin(t * 0.009) * 0.2;
    const r = (m.phone || m.portrait ? 36 : 46) * dpr;
    const cy = charBox.h ? charBox.y + charBox.h * 0.42 : H * 0.48;
    const leftX = m.pad.l + W * (m.portrait ? 0.16 : 0.2);
    const rightX = W - m.pad.r - W * (m.portrait ? 0.16 : 0.2);
    choiceBoxes.ui = { x: leftX - r * 1.7, y: cy - r * 1.7, w: r * 3.4, h: r * 3.4, cx: leftX, cy, r };
    choiceBoxes.ue = { x: rightX - r * 1.7, y: cy - r * 1.7, w: r * 3.4, h: r * 3.4, cx: rightX, cy, r };
    drawOrb(choiceBoxes.ui, [236, 244, 255], pulse);
    drawOrb(choiceBoxes.ue, [176, 42, 255], pulse);
  }

  function drawOrb(box, rgb, pulse) {
    const { cx, cy, r } = box;
    const rr = r * pulse;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const outer = ctx.createRadialGradient(cx, cy, 2, cx, cy, rr * 2.35);
    outer.addColorStop(0, "rgba(255,255,255,0.98)");
    outer.addColorStop(0.2, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.95)`);
    outer.addColorStop(0.55, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.38)`);
    outer.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.arc(cx, cy, rr * 2.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, rr * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fill();
    ctx.restore();
  }

  function drawOrbSparks() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const s of orbSparks) {
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.fillStyle = `rgba(${s.r},${s.g},${s.b},1)`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function blastBall() {
    const cx = charBox.x + charBox.w / 2;
    const cy = charBox.y + charBox.h * 0.42;
    const handX = cx + charBox.w * 0.22;
    if (blast.t < 0.95) {
      const p = blast.t / 0.95;
      return { x: handX, y: cy, rad: (14 + p * 52) * dpr, glow: 0.55 + p * 0.45 };
    }
    if (blast.t < 1.52) {
      const p = (blast.t - 0.95) / 0.57;
      return {
        x: handX + W * 0.26 * p,
        y: cy - H * 0.28 * p,
        rad: (66 + p * 28) * dpr,
        glow: 1,
      };
    }
    const p = Math.min(1, (blast.t - 1.52) / 0.32);
    return {
      x: handX + W * 0.26,
      y: cy - H * 0.28,
      rad: (90 + p * 240) * dpr,
      glow: Math.max(0, 1 - p),
    };
  }

  function drawBlast() {
    if (!blast) return;
    const [r, g, b] = [blast.r, blast.g, blast.b];
    const ball = blastBall();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const grd = ctx.createRadialGradient(ball.x, ball.y, 2, ball.x, ball.y, ball.rad);
    grd.addColorStop(0, `rgba(255,255,255,${0.95 * ball.glow})`);
    grd.addColorStop(0.32, `rgba(${r},${g},${b},${0.88 * ball.glow})`);
    grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGlass() {
    if (glassLife <= 0 || !glass.length) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, glassLife);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(8,10,16,0.9)";
    ctx.lineWidth = 2.6 * dpr;
    for (const g of glass) {
      if (!g.segs || g.grow <= 0.02) continue;
      const segs = g.segs;
      const last = 1 + (segs.length - 1) * g.grow;
      const n = Math.min(segs.length - 1, Math.floor(last));
      const frac = last - n;
      ctx.beginPath();
      ctx.moveTo(segs[0].x, segs[0].y);
      for (let i = 1; i <= n; i++) ctx.lineTo(segs[i].x, segs[i].y);
      if (n < segs.length - 1 && frac > 0) {
        const a = segs[n];
        const b = segs[n + 1];
        ctx.lineTo(a.x + (b.x - a.x) * frac, a.y + (b.y - a.y) * frac);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFlash() {
    if (flash <= 0) return;
    ctx.fillStyle = `rgba(255,255,255,${flash})`;
    ctx.fillRect(0, 0, W, H);
  }

  function drawVignette() {
    const grd = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.2, W / 2, H * 0.55, H * 0.85);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,0.48)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const sh = Math.min(shake, 6.5);
    const sx = (Math.random() - 0.5) * sh * dpr;
    const sy = (Math.random() - 0.5) * sh * dpr;
    ctx.translate(W / 2 + sx, H * 0.42 + sy);
    ctx.scale(camZoom, camZoom);
    ctx.translate(-W / 2, -H * 0.42);

    if (state === "load") {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      return;
    }

    const f = form();
    const m = metrics();
    const useCharge = charging || state === "final" || state === "transform" || !!blast;
    const img = spriteFor(f.key, useCharge);
    Object.assign(charBox, layoutActor(img, W / 2, m.ground, H * m.charH * f.scale, m.charMaxW));
    const lite = flash > 0.5;

    drawBackground();
    if (!lite) {
      drawCracks();
      drawLines();
      drawRings(charBox);
      drawAura(charBox);
    }
    drawParticles("back");
    drawActor(img, charBox);
    drawParticles("front");
    if (!lite) drawBolts();
    drawRocks();
    if (!lite) drawOrbSparks();
    if (state === "choose" && !lite) drawChoice();
    if (!lite || (blast && !blast.hit)) drawBlast();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!lite) drawVignette();
    drawFlash();
    drawGlass();
    if (fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${fade})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function loop(ts) {
    const dt = Math.min(0.033, (ts - last) / 1000 || 0.016);
    last = ts;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  async function boot() {
    audio.theme = bgm;
    if (bgm) {
      bgm.loop = true;
      bgm.playsInline = true;
      bgm.setAttribute("playsinline", "true");
      bgm.preload = "auto";
      bgm.volume = 1;
      bgm.load();
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", () => setTimeout(resize, 80));
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", resize);
      window.visualViewport.addEventListener("scroll", resize);
    }
    const block = (e) => e.preventDefault();
    canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
    canvas.addEventListener("pointerup", onPointerUp, { passive: false });
    canvas.addEventListener("pointercancel", onPointerUp, { passive: false });
    canvas.addEventListener("dblclick", block);
    document.addEventListener("touchmove", block, { passive: false });
    document.addEventListener("gesturestart", block);
    document.addEventListener("gesturechange", block);
    canvas.addEventListener("pointermove", onPointerMove, { passive: false });

    const spriteKeys = [
      "base_idle", "base_charge", "ssj_idle", "ssj_charge",
      "ssj2_idle", "ssj2_charge", "ssj3_idle", "ssj3_charge",
      "ssj4_idle", "ssj4_charge", "god_idle", "god_charge",
      "blue_idle", "blue_charge", "ui_idle", "ui_charge", "ue_idle", "ue_charge",
    ];
    const sfxKeys = [
      "charge_up", "charge_static", "hum", "hum_intense",
      "scream", "scream2", "roar", "roar2", "roar3",
      "impact", "explosion", "explosion2", "shockwave",
      "whoosh_storm", "whoosh_wind", "whoosh", "whoosh_deep",
      "fire", "electric", "lightning", "wind", "bass",
    ];

    const imgJobs = [loadImage("assets/bg/battlefield.png").then((img) => { images.bg = img; })];
    for (const key of spriteKeys) {
      imgJobs.push(loadImage(`assets/sprites/${key}.png`).then((img) => { images[key] = img; }));
    }
    const sndJobs = sfxKeys.map((key) =>
      loadAudio(`assets/sfx/${key}.mp3`, key === "hum" || key === "hum_intense").then((el) => { audio[key] = el; })
    );
    sndJobs.push(loadAudio("aura.mp3", true).then((el) => { audio.ki_aura = el; }));
    sndJobs.push(loadAudio("scream.mp3").then((el) => { audio.ki_scream = el; }));
    sndJobs.push(loadAudio("assets/sfx/glass.mp3").then((el) => { audio.glass = el; }));

    requestAnimationFrame(loop);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
    await Promise.all([...imgJobs, ...sndJobs]);
    state = "idle";
    fade = 1;
  }

  boot();
})();
