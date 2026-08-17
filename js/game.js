(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const bgm = document.getElementById("bgm");

  const FORM_LIB = {
    base: { key: "base", aura: [210, 225, 255], scale: 1.0, shake: 3.2, ms: 3400 },
    ssj: { key: "ssj", aura: [255, 208, 36], scale: 1.02, shake: 5.2, ms: 3600 },
    ssj2: { key: "ssj2", aura: [255, 220, 55], scale: 1.03, shake: 7.4, ms: 3600, lightning: true },
    ssj3: { key: "ssj3", aura: [255, 232, 74], scale: 1.04, shake: 9.0, ms: 4000, lightning: true },
    ssj4: { key: "ssj4", aura: [230, 42, 28], scale: 1.05, shake: 10.5, ms: 4000 },
    god: { key: "god", aura: [255, 58, 18], scale: 1.03, shake: 11.5, ms: 4200, fire: true },
    blue: { key: "blue", aura: [48, 186, 255], scale: 1.04, shake: 12.5, ms: 4500 },
    bluefp: { key: "bluefp", aura: [40, 70, 255], scale: 1.07, shake: 14.5, ms: 4500, lightning: true },
    kk20: { key: "kk20", aura: [255, 48, 58], scale: 1.07, shake: 16.5, ms: 4500, fire: true, lightning: true },
    ui: { key: "ui", aura: [232, 242, 255], scale: 1.04, shake: 8.0, silver: true },
    ue: { key: "ue", aura: [186, 48, 255], scale: 1.05, shake: 15.0 },
    rose: { key: "rose", aura: [255, 72, 168], scale: 1.04, shake: 13.2 },
    legend: { key: "legend", aura: [86, 255, 78], scale: 1.16, shake: 20.0, lightning: true },
    beast: { key: "beast", aura: [248, 220, 255], scale: 1.14, shake: 18.0, lightning: true },
    mystic: { key: "mystic", aura: [255, 246, 214], scale: 1.06, shake: 14.0, ms: 4200, silver: true },
    c1: { key: "c1", aura: [140, 190, 90], scale: 1.0, shake: 4.0, ms: 3400 },
    c2: { key: "c2", aura: [120, 210, 80], scale: 1.06, shake: 6.2, ms: 3600 },
    c3: { key: "c3", aura: [90, 230, 110], scale: 1.08, shake: 9.0, ms: 4000 },
    cultra: { key: "cultra", aura: [255, 228, 70], scale: 1.14, shake: 18.0, lightning: true },
    f1: { key: "f1", aura: [186, 150, 220], scale: 0.92, shake: 3.4, ms: 3200 },
    f2: { key: "f2", aura: [170, 130, 210], scale: 1.12, shake: 6.0, ms: 3400 },
    f3: { key: "f3", aura: [160, 120, 200], scale: 1.08, shake: 7.5, ms: 3600 },
    ffinal: { key: "ffinal", aura: [210, 200, 230], scale: 1.0, shake: 9.0, ms: 3800 },
    f100: { key: "f100", aura: [255, 90, 90], scale: 1.08, shake: 12.0, ms: 4000 },
    golden: { key: "golden", aura: [255, 210, 50], scale: 1.06, shake: 14.0, ms: 4200, fire: true },
    fblack: { key: "fblack", aura: [210, 198, 255], scale: 1.12, shake: 19.0, lightning: true, silver: true },
    fat: { key: "fat", aura: [255, 150, 200], scale: 1.08, shake: 4.2, ms: 3400 },
    super: { key: "super", aura: [255, 90, 170], scale: 1.12, shake: 8.0, ms: 3800 },
    buuhan: { key: "buuhan", aura: [255, 186, 220], scale: 1.14, shake: 12.0, ms: 4200 },
    kid: { key: "kid", aura: [255, 70, 110], scale: 0.82, shake: 18.0, lightning: true },
  };

  const ROSTER = [
    { id: "broly", forms: ["base", "ssj", "ssj2", "ssj3", "ssj4"], supreme: "legend" },
    { id: "sbroly", forms: ["base", "ssj"], supreme: "legend" },
    { id: "goku", forms: ["base", "ssj", "ssj2", "ssj3", "ssj4", "god", "blue", "kk20"], supreme: "ui" },
    { id: "vegeta", forms: ["base", "ssj", "ssj2", "ssj3", "ssj4", "god", "blue", "bluefp"], supreme: "ue" },
    { id: "black", forms: ["base"], supreme: "rose" },
    { id: "gohan", forms: ["base", "ssj", "ssj2", "mystic"], supreme: "beast" },
    { id: "cell", forms: ["c1", "c2", "c3"], supreme: "cultra" },
    { id: "frieza", forms: ["f1", "f2", "f3", "ffinal", "f100", "golden"], supreme: "fblack" },
    { id: "buu", forms: ["fat", "super", "buuhan"], supreme: "kid" },
  ];

  const SAIYANS = new Set(["broly", "sbroly", "goku", "vegeta", "black", "gohan"]);

  const STAGE = {
    broly: "bg",
    sbroly: "bg",
    goku: "bg",
    vegeta: "bg",
    gohan: "bg",
    black: "bg_city",
    cell: "bg_ring",
    frieza: "bg_namek",
    buu: "bg_hell",
  };

  const images = {};
  const audio = {};
  const loops = {};
  let audioCtx = null;
  let musicGain = null;
  let musicHooked = false;
  let auraGain = null;
  const auraHookedEls = new Set();
  const MUSIC_TRACKS = ["music.mp3", "music2.mp3", "music3.mp3"];
  const MUSIC_GAIN = 4.2;
  const MUSIC_VOL = 1;
  const AURA_GAIN = 1.65;
  const AURA_VOL = 0.72;
  const ROSE_AURA_GAIN = 3.6;
  const ROSE_AURA_VOL = 1;
  let musicIndex = 0;
  let musicBound = false;
  let musicSkip = 0;
  const SFX_SCALE = 0.28;
  const MAX_PARTICLES = 110;
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
  let selected = null;
  let formIndex = 0;
  let state = "load";
  let charging = false;
  let finalKey = null;
  let tapCount = 0;
  let tapTimer = 0;
  let charBox = { x: 0, y: 0, w: 0, h: 0 };
  let energyWaves = [];
  let flashRgb = null;
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
  let blastCd = 0;

  function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "") ||
      (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 920);
  }

  function charData() {
    return ROSTER.find((c) => c.id === selected) || ROSTER[0];
  }

  function forms() {
    return charData().forms.map((k) => FORM_LIB[k]).filter(Boolean);
  }

  function form() {
    if (finalKey && FORM_LIB[finalKey]) return FORM_LIB[finalKey];
    const list = forms();
    return list[formIndex] || list[0] || FORM_LIB.base;
  }

  function spriteName(formKey, pose) {
    if (selected === "broly") return `${formKey}_${pose}`;
    return `${selected}_${formKey}_${pose}`;
  }

  function spriteFile(formKey, pose) {
    return `assets/sprites/${spriteName(formKey, pose)}.png`;
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

  const NO_BUZZ = new Set(["hum", "hum_intense", "charge_static"]);

  function play(name, volume = 1, rate = 1) {
    if (NO_BUZZ.has(name)) return null;
    const src = audio[name];
    if (!src || !unlocked) return null;
    const node = src.cloneNode();
    node.loop = false;
    node.volume = Math.max(0, Math.min(1, volume * SFX_SCALE));
    node.playbackRate = rate;
    node.play().catch(() => {});
    return node;
  }

  function playFull(name, volume = 1, rate = 1) {
    if (NO_BUZZ.has(name)) return null;
    const src = audio[name];
    if (!src || !unlocked) return null;
    const node = src.cloneNode();
    node.loop = false;
    node.volume = Math.max(0, Math.min(1, volume));
    node.playbackRate = rate;
    node.play().catch(() => {});
    return node;
  }

  function playSupremeBurst() {
    duckMusic(true, 0.32);
    playFull("shockwave", 1);
    playFull("whoosh_storm", 1);
    playFull("whoosh_deep", 1);
    playFull("explosion", 1);
    playFull("explosion2", 0.92);
    playFull("bass", 1);
    playFull("impact", 0.95);
    playFull("wind", 0.8);
    playFull("roar2", 0.72);
    setTimeout(() => {
      playFull("shockwave", 0.85);
      playFull("whoosh_deep", 0.8);
      playFull("bass", 0.9);
    }, 90);
  }

  let auraCue = 0;

  function cueAuraFromBuffer() {
    if (!audioCtx || !audio.ki_aura) return;
    try {
      fetch("aura.mp3")
        .then((r) => r.arrayBuffer())
        .then((buf) => audioCtx.decodeAudioData(buf.slice(0)))
        .then((audioBuf) => {
          const data = audioBuf.getChannelData(0);
          const sr = audioBuf.sampleRate;
          const step = Math.max(1, Math.floor(sr * 0.01));
          const limit = Math.min(data.length, sr * 8);
          for (let i = 0; i < limit; i += step) {
            let peak = 0;
            const end = Math.min(data.length, i + step);
            for (let j = i; j < end; j++) {
              const v = Math.abs(data[j]);
              if (v > peak) peak = v;
            }
            if (peak > 0.03) {
              auraCue = Math.max(0, i / sr);
              break;
            }
          }
        })
        .catch(() => {});
    } catch (_) {}
  }

  function auraKey() {
    return form().key === "rose" ? "ki_aura_rose" : "ki_aura";
  }

  function auraVolFor(key) {
    return key === "ki_aura_rose" ? ROSE_AURA_VOL : AURA_VOL;
  }

  function startLoop(name, volume = 0.4) {
    if (NO_BUZZ.has(name)) return;
    const src = name === "theme" ? audio.theme : audio[name];
    if (!src || !unlocked) return;
    src.loop = true;
    src.volume = name === "theme" ? 1 : Math.max(0, Math.min(1, volume));
    if (name === "ki_aura" || name === "ki_aura_rose") {
      try { src.currentTime = name === "ki_aura" ? auraCue : 0; } catch (_) {}
    }
    const p = src.play();
    if (p && p.catch) p.catch(() => {});
    loops[name] = src;
  }

  function kickAura(volume, forceKey) {
    if (!unlocked) return;
    const key = forceKey || auraKey();
    if (!audio[key]) return;
    const other = key === "ki_aura_rose" ? "ki_aura" : "ki_aura_rose";
    stopLoop(other);
    boostAuraDesktop(audio[key]);
    duckMusic(true);
    startLoop(key, auraVolFor(key));
    play("whoosh_storm", 0.5);
  }

  function setLoopVolume(name, volume) {
    if (loops[name] && name !== "theme") loops[name].volume = Math.max(0, Math.min(1, volume));
  }

  function setAuraVolume() {
    const key = auraKey();
    setLoopVolume(key, auraVolFor(key));
  }

  function stopLoop(name) {
    if (name === "theme") return;
    const src = loops[name] || audio[name];
    if (!src) {
      delete loops[name];
      return;
    }
    src.loop = false;
    src.pause();
    try { src.currentTime = 0; } catch (_) {}
    delete loops[name];
  }

  function stopAuraLoops() {
    stopLoop("ki_aura");
    stopLoop("ki_aura_rose");
  }

  function silenceBuzz() {
    ["hum", "hum_intense", "charge_static", "electric"].forEach((name) => {
      const src = audio[name];
      if (!src) return;
      src.loop = false;
      src.volume = 0;
      src.pause();
      try { src.currentTime = 0; } catch (_) {}
      delete loops[name];
    });
  }

  function syncPowerLoops() {
    if (charging || transforming || state === "transform" || !!blast) {
      duckMusic(true);
      const key = auraKey();
      const other = key === "ki_aura_rose" ? "ki_aura" : "ki_aura_rose";
      stopLoop(other);
      startLoop(key, auraVolFor(key));
      return;
    }
    stopAuraLoops();
    silenceBuzz();
    duckMusic(false);
  }

  function duckMusic(on, amount = 0.88) {
    try {
      if (musicGain && audioCtx) {
        musicGain.gain.setTargetAtTime(on ? MUSIC_GAIN * amount : MUSIC_GAIN, audioCtx.currentTime, 0.06);
      } else if (audio.theme && !musicHooked) {
        audio.theme.volume = on ? MUSIC_VOL * Math.max(0.3, amount) : MUSIC_VOL;
      }
    } catch (_) {}
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
      try { if (musicGain) musicGain.gain.value = MUSIC_GAIN; } catch (_) {}
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

  function boostAuraDesktop(el) {
    const src = el || audio[auraKey()];
    if (!src) return;
    const isRose = src === audio.ki_aura_rose;
    if (isMobile() && !isRose) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    const gainVal = isRose ? ROSE_AURA_GAIN : AURA_GAIN;
    if (!auraGain) {
      auraGain = audioCtx.createGain();
      auraGain.gain.value = gainVal;
      auraGain.connect(audioCtx.destination);
    } else {
      try { auraGain.gain.value = gainVal; } catch (_) {}
    }
    if (auraHookedEls.has(src)) return;
    try {
      const node = audioCtx.createMediaElementSource(src);
      node.connect(auraGain);
      auraHookedEls.add(src);
    } catch (_) {}
  }

  function pickMusicIndex(avoid = -1) {
    const opts = [];
    for (let i = 0; i < MUSIC_TRACKS.length; i++) if (i !== avoid) opts.push(i);
    if (!opts.length) return 0;
    return opts[Math.floor(Math.random() * opts.length)];
  }

  function playTrack(index) {
    const el = audio.theme || bgm;
    if (!el) return;
    audio.theme = el;
    const n = MUSIC_TRACKS.length;
    musicIndex = ((index % n) + n) % n;
    const src = MUSIC_TRACKS[musicIndex];
    el.loop = false;
    el.muted = false;
    el.volume = MUSIC_VOL;
    const cur = (el.getAttribute("src") || el.src || "").replace(/\\/g, "/");
    const start = () => {
      const kick = el.play();
      if (kick && kick.catch) {
        kick.catch(() => {
          el.muted = true;
          el.play()
            .then(() => { el.muted = false; el.volume = MUSIC_VOL; })
            .catch(() => {
              musicSkip += 1;
              if (musicSkip < MUSIC_TRACKS.length) playTrack(pickMusicIndex(musicIndex));
            });
        });
      }
    };
    if (!cur.endsWith(src)) {
      el.src = src;
      el.addEventListener("canplay", start, { once: true });
    } else {
      try { el.currentTime = 0; } catch (_) {}
      start();
    }
    musicSkip = 0;
    loops.theme = el;
  }

  function nextMusic() {
    playTrack(pickMusicIndex(musicIndex));
  }

  function bindMusic(el) {
    if (!el || musicBound) return;
    musicBound = true;
    el.loop = false;
    el.addEventListener("ended", nextMusic);
    el.addEventListener("error", () => {
      musicSkip += 1;
      if (unlocked && musicSkip < MUSIC_TRACKS.length) nextMusic();
    });
  }

  function playMusicNow() {
    const el = audio.theme || bgm;
    if (!el) return;
    audio.theme = el;
    el.playsInline = true;
    el.setAttribute("playsinline", "true");
    bindMusic(el);
    if (!el.paused && !el.ended) {
      if (!isMobile()) boostMusicDesktop();
      return;
    }
    playTrack(pickMusicIndex(musicIndex));
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
      ["ki_scream", "ki_aura", "ki_aura_rose"].forEach((name) => {
        const a = audio[name];
        if (!a) return;
        a.volume = 0;
        a.play().then(() => {
          a.pause();
          a.currentTime = name === "ki_aura" ? auraCue : 0;
          a.volume = 1;
        }).catch(() => {});
      });
      silenceBuzz();
      cueAuraFromBuffer();
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

  let screamNodes = [];

  function musicBusy() {
    return charging || transforming || state === "transform" || !!blast;
  }

  function rumble(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (_) {}
  }

  function scream() {
    if (!SAIYANS.has(selected)) return;
    if (!charging && state !== "transform") return;
    duckMusic(true);
    const node = play("ki_scream", 0.48);
    if (node) screamNodes.push(node);
    setTimeout(() => {
      if (!musicBusy()) duckMusic(false);
    }, 700);
  }

  function raceCry() {
    if (SAIYANS.has(selected)) {
      scream();
      return;
    }
    if (selected === "frieza") {
      play("roar", 0.42);
      play("whoosh_deep", 0.35);
      return;
    }
    if (selected === "cell") {
      play("roar2", 0.5);
      play("electric", 0.22);
      return;
    }
    if (selected === "buu") {
      play("roar3", 0.48);
    }
  }

  function stopScream() {
    for (const node of screamNodes) {
      try {
        node.pause();
        node.currentTime = 0;
      } catch (_) {}
    }
    screamNodes = [];
    const src = audio.ki_scream;
    if (src) {
      src.pause();
      try { src.currentTime = 0; } catch (_) {}
    }
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
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const up = Math.max(0, -Math.sin(ang));
        const env = 0.78 + up * 0.5;
        const feetY = box.y + box.h * 0.92;
        const midY = box.y + box.h * 0.55;
        const rx = bodyW * (0.42 + Math.random() * 0.12) * env;
        const ry = bodyH * (0.48 + Math.random() * 0.1) * env;
        particles.push({
          kind, layer: Math.random() < 0.55 ? "back" : "front",
          x: bodyCx + Math.cos(ang) * rx,
          y: midY + Math.sin(ang) * ry * 0.85 + (1 - up) * (feetY - midY) * 0.15,
          vx: Math.cos(ang) * 0.35,
          vy: -2.8 - Math.random() * 3.6 - up * 1.4,
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

  function isFinalForm() {
    return !!finalKey;
  }

  function isAtBase() {
    return !finalKey && formIndex === 0;
  }

  function startCharge() {
    if (transforming || blast) return;
    if (charging) return;
    if (state !== "idle" && state !== "final") return;
    charging = true;
    chargeT = 0;
    if (isFinalForm()) state = "final";
    else state = "charge";
    shake = form().shake;
    makeCracks();
    spawnRing();
    spawnLines(18);
    burst("dust", 32);
    burst("aura", 46);
    burst("rock", 8);
    raceCry();
    kickAura(AURA_VOL);
    rumble([18, 30, 40]);
    if (form().lightning) play("lightning", 0.3);
    if (form().fire) play("fire", 0.35);
  }

  function stopAtForm() {
    if (state === "load" || (state === "idle" && !charging)) return;
    charging = false;
    transforming = false;
    if (state !== "select") state = "idle";
    shake = 1.5;
    stopGlow = 1;
    camTarget = 1;
    stopScream();
    syncPowerLoops();
    play("whoosh", 0.22);
  }

  function doTransform(nextIndex, toFinal) {
    if (transforming) return;
    transforming = true;
    charging = false;
    state = "transform";
    flash = 1;
    if (toFinal && FORM_LIB[toFinal]) {
      flashRgb = FORM_LIB[toFinal].aura;
      flash = isEpicFinal(toFinal) ? 1 : 0.8;
    }
    const epic = isEpicFinal(toFinal);
    shake = epic ? 22 : 14;
    camTarget = epic ? 1.42 : 1.28;
    skyFade = 1;
    burst("spark", epic ? 120 : 90);
    burst("dust", epic ? 70 : 56);
    burst("rock", epic ? 26 : 18);
    spawnRing();
    spawnRing();
    if (epic) {
      spawnRing();
      spawnLines(56);
      burst("aura", 40);
      play("explosion2", 0.7);
      play("bass", 0.85);
      play("roar3", 0.55);
    } else {
      spawnLines(40);
    }
    raceCry();
    rumble(epic ? [40, 40, 80, 40, 120] : [30, 40, 70]);
    duckMusic(true, toFinal ? 0.32 : 0.88);
    kickAura(AURA_VOL, toFinal === "rose" ? "ki_aura_rose" : undefined);
    if (toFinal) playSupremeBurst();
    else {
      play("explosion", epic ? 0.85 : 0.5);
      play("impact", epic ? 0.7 : 0.42);
      play("whoosh_deep", epic ? 0.7 : 0.4);
    }

    setTimeout(() => {
      transforming = false;
      camTarget = epic ? 1.08 : 1.04;
      if (toFinal) {
        finalKey = toFinal;
        formIndex = Math.max(0, forms().length - 1);
        charging = holding;
        state = charging ? "final" : "idle";
        shake = form().shake;
        makeCracks();
        energyWaves = [];
        if (charging) {
          duckMusic(true);
          setAuraVolume(AURA_VOL);
        } else {
          stopGlow = 1;
          stopScream();
          syncPowerLoops();
        }
        return;
      }
      formIndex = nextIndex;
      charging = holding;
      if (charging) {
        state = "charge";
        chargeT = 0;
        shake = form().shake;
        makeCracks();
        raceCry();
        duckMusic(true);
        setAuraVolume(AURA_VOL);
        if (form().lightning) play("lightning", 0.35);
        if (form().fire) play("fire", 0.4);
      } else {
        state = "idle";
        stopAuraLoops();
        stopGlow = 1;
        stopScream();
        duckMusic(false);
      }
    }, epic ? 520 : 220);
  }

  function goToSelect() {
    resetAll();
    selected = null;
    state = "select";
    fade = 1;
    rumble([12, 40, 12]);
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
    energyWaves = [];
    flashRgb = null;
    gesture = [];
    drawing = false;
    blast = null;
    duckMusic(false);
    stopAuraLoops();
    silenceBuzz();
    stopScream();
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

  function blastProfile() {
    const f = form();
    const [ar, ag, ab] = f.aura;
    if (selected === "goku") return { kind: "beam", r: 70, g: 170, b: 255, lift: 0.2 };
    if (selected === "vegeta") return { kind: "galick", r: 168, g: 62, b: 255, lift: 0.42 };
    if (selected === "gohan") return { kind: "masenko", r: 255, g: 210, b: 70, lift: 0.12 };
    if (selected === "broly" || selected === "sbroly") return { kind: "cannon", r: 110, g: 255, b: 70, lift: 0.1 };
    if (selected === "black") return { kind: "slash", r: 255, g: 72, b: 168, lift: 0.22 };
    if (selected === "cell") return { kind: "spiral", r: 255, g: 228, b: 70, lift: 0.06 };
    if (selected === "frieza") return { kind: "deathball", r: 90, g: 40, b: 170, lift: 0.34 };
    if (selected === "buu") return { kind: "blob", r: 255, g: 110, b: 190, lift: 0.16 };
    return { kind: "ball", r: ar, g: ag, b: ab, lift: 0.28 };
  }

  function fireBlast() {
    if (blast || charging || transforming || blastCd > 0 || state === "load") return;
    const p = blastProfile();
    blast = {
      t: 0, kind: p.kind, r: p.r, g: p.g, b: p.b, lift: p.lift,
      hit: false, launched: false,
      dirt: 0, pebbles: 0,
      sfx: [
        { t: 0, name: "charge_up", v: 1 },
        { t: 0.12, name: "whoosh", v: 0.9 },
        { t: 0.95, name: "whoosh_deep", v: 1 },
        { t: 0.98, name: "whoosh_storm", v: 1 },
        { t: 1.05, name: "whoosh_wind", v: 0.92 },
        { t: 1.52, name: "explosion", v: 1 },
        { t: 1.54, name: "explosion2", v: 0.95 },
        { t: 1.62, name: "shockwave", v: 1 },
        { t: 1.70, name: "bass", v: 1 },
        { t: 1.82, name: "impact", v: 0.95 },
      ],
    };
    camTarget = 1.08;
    shake = 2.4;
    rumble(20);
    duckMusic(true, 0.32);
    kickAura(AURA_VOL);
  }

  function playBlastSfx() {
    const q = blast && blast.sfx;
    if (!q || !q.length) return;
    if (blast.t >= q[0].t) {
      const s = q.shift();
      playFull(s.name, s.v);
    }
  }

  function updateBlast(dt) {
    if (blastCd > 0) blastCd = Math.max(0, blastCd - dt);
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
      stopAuraLoops();
      rumble(30);
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
      blast.dirt = 18;
      blast.pebbles = 8;
      rumble([50, 30, 90]);
      burst("aura", 8);
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
    if (n < 3) return;
    if (isAtBase()) goToSelect();
    else resetAll();
  }

  function onPointerDown(e) {
    e.preventDefault();
    unlockAll();
    const p = pointer(e);
    const m = metrics();

    if (state === "load") return;
    if (state === "select") {
      const id = pickSelect(p);
      if (id) selectCharacter(id);
      return;
    }

    if (hit(charBox, p, m.tapPad)) {
      drawing = false;
      holding = true;
      holdStart = performance.now();
      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        if (holding && !charging && (state === "idle" || state === "final")) startCharge();
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
    if (state === "select") {
      const over = !!pickSelect(p);
      canvas.style.cursor = over ? "pointer" : "default";
      return;
    }
    if (drawing && !charging) {
      const last = gesture[gesture.length - 1];
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 4 * dpr) gesture.push(p);
    }
    const over = hit(charBox, p, m.tapPad);
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
      if (state === "charge" || state === "final" || state === "transform") {
        stopAtForm();
      }
    }
  }

  function update(dt) {
    if (state === "load" || state === "select") {
      fade = Math.max(0, fade - dt * 0.9);
      return;
    }
    if (!charging && state !== "transform" && screamNodes.length) stopScream();
    silenceBuzz();
    if (!charging && state !== "transform" && !blast) {
      stopAuraLoops();
    }
    fade = Math.max(0, fade - dt * 0.9);
    if (!blast) {
      flash = Math.max(0, flash - dt * 2.2);
      if (flash <= 0) flashRgb = null;
    }
    stopGlow = Math.max(0, stopGlow - dt * 1.6);
    skyFade = Math.max(0.22, skyFade + ((charging || isFinalForm() ? 0.55 : 0.22) - skyFade) * dt * 3);
    camZoom += (camTarget - camZoom) * Math.min(1, dt * 6);
    if (state !== "transform") camTarget += (1 - camTarget) * dt * 1.8;
    const f = form();
    const intensity = charging ? Math.min(1, 0.25 + chargeT / (f.ms || 4000)) : 0.08;

    if (state === "charge") {
      if (charging) {
        chargeT += dt * 1000;
        shake = f.shake * (0.55 + intensity);
        setAuraVolume(AURA_VOL);
        if (Math.random() < 0.6) burst("dust", 2);
        if (Math.random() < 0.85) burst("aura", 4);
        if (Math.random() < 0.22) burst("spark", 2);
        if (Math.random() < 0.12) burst("rock", 1);
        if (f.lightning && Math.random() < (f.key === "ssj2" ? 0.16 : 0.08)) spawnBolt();
        if (f.fire && Math.random() < 0.55) burst("fire", 4);
        if (Math.random() < 0.05) spawnRing();
        if (Math.random() < 0.2) spawnLines(2);
      }
      if (state === "charge" && chargeT >= (f.ms || 4000)) {
        if (isFinalForm()) {
          chargeT = Math.min(chargeT, f.ms);
        } else if (formIndex >= forms().length - 1) {
          doTransform(formIndex, charData().supreme);
        } else {
          doTransform(formIndex + 1);
        }
      }
    }

    if (state === "final" && charging) {
      chargeT = Math.min(chargeT + dt * 1000, (f.ms || 4500));
      shake = f.shake * (0.55 + intensity);
      setAuraVolume(AURA_VOL);
      if (Math.random() < 0.55) burst("dust", 2);
      if (Math.random() < 1) burst("aura", isEpicFinal(f.key) ? 12 : 8);
      if (Math.random() < 0.22) burst("spark", 3);
      if ((f.silver || f.key === "rose" || isEpicFinal(f.key)) && Math.random() < (isEpicFinal(f.key) ? 0.2 : 0.1)) spawnBolt();
      if (f.fire && Math.random() < 0.4) burst("fire", 3);
      if (Math.random() < 0.1) spawnRing();
      if (Math.random() < 0.22) spawnLines(3);
    }

    if (isFinalForm() && !charging && (state === "idle" || state === "final")) {
      const legend = isEpicFinal(f.key);
      if (Math.random() < (legend ? 0.95 : 0.75)) burst("aura", legend ? 5 : 3);
      if (Math.random() < (legend ? 0.28 : 0.16)) spawnRing();
      if (Math.random() < (legend ? 0.32 : 0.2)) spawnLines(legend ? 3 : 2);
      if ((f.silver || f.key === "rose" || f.key === "ue" || legend) && Math.random() < (legend ? 0.14 : 0.08)) spawnBolt();
    }

    if (state === "idle" && !isFinalForm() && Math.random() < 0.08) burst("dust", 1);

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
    if (orbSparks.length > 90) orbSparks.splice(0, orbSparks.length - 90);
    orbSparks = orbSparks.filter((s) => s.life > 0);
    for (const w of energyWaves) {
      w.r += w.grow * dt * 60;
      w.life -= dt * 0.7;
    }
    if (energyWaves.length > 8) energyWaves.splice(0, energyWaves.length - 8);
    energyWaves = energyWaves.filter((w) => w.life > 0);

    updateBlast(dt);
    shake *= 0.92;
  }

  function drawBackground() {
    const key = state === "select" ? "bg" : (STAGE[selected] || "bg");
    const bg = images[key] || images.bg;
    if (!bg) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      return;
    }
    const scale = Math.max(W / bg.width, H / bg.height);
    const bw = bg.width * scale;
    const bh = bg.height * scale;
    ctx.drawImage(bg, (W - bw) / 2, (H - bh) / 2, bw, bh);
    if (state === "select") {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, W, H);
      return;
    }
    const f = form();
    const [r, g, b] = f.aura;
    const power = charging || isFinalForm() || state === "transform" ? skyFade : 0.12;
    ctx.fillStyle = `rgba(${r},${g},${b},${0.06 + power * 0.16})`;
    ctx.fillRect(0, 0, W, H);
    const dark = charging || isFinalForm() ? 0.22 + Math.min(chargeT / 6000, 0.22) : 0.08;
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

  function auraEnvelope(ang) {
    const up = -Math.sin(ang);
    const side = Math.abs(Math.cos(ang));
    let env = 0.9;
    if (up > 0) env += up * 0.52;
    else env += up * 0.06;
    env += side * 0.05;
    return Math.max(0.78, env);
  }

  function auraSpike(ang, t, layer) {
    const up = Math.max(0, -Math.sin(ang));
    const down = Math.max(0, Math.sin(ang));
    const phase = t * 0.012 + layer * 1.15;
    const a = Math.abs(Math.sin(ang * 10 + phase));
    const b = Math.abs(Math.sin(ang * 18 + phase * 1.35 + 0.6));
    const c = Math.abs(Math.sin(ang * 6 + phase * 0.55));
    const sharp = Math.pow(a * b, 0.32) * (0.1 + up * 0.34) + Math.pow(c, 2.2) * 0.07;
    return sharp * (1 - down * 0.7);
  }

  function traceAuraPath(cx, cy, rx, ry, t, layer, steps) {
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const ang = -Math.PI + (i / steps) * Math.PI * 2;
      const m = auraEnvelope(ang) * (1 + auraSpike(ang, t, layer));
      const x = cx + Math.cos(ang) * rx * m;
      const y = cy + Math.sin(ang) * ry * m;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawAura(box) {
    const f = form();
    const [r, g, b] = f.aura;
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h * 0.56;
    const t = performance.now();
    const pulse = 1 + Math.sin(t * 0.014) * 0.045;
    const supreme = isFinalForm();
    const legendary = isEpicFinal(f.key);
    const power = charging
      ? (legendary ? 2.15 : supreme ? 1.75 : 1.12)
      : (legendary ? 1.15 : supreme ? 0.88 : 0.16);
    const boost = legendary ? (charging ? 1.55 : 1.22) : supreme ? (charging ? 1.38 : 1.12) : 1;
    const layers = charging || supreme ? 4 : 2;
    const rx = box.w * 0.7 * pulse * boost * (0.92 + power * 0.12);
    const ry = box.h * 0.7 * pulse * boost * (0.92 + power * 0.12);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = layers; i >= 1; i--) {
      const scale = 0.72 + i * 0.14;
      const flicker = 1 + Math.sin(t * 0.02 + i) * (charging ? 0.05 : 0.025);
      const aShell = ((supreme ? 0.42 : 0.28) * power) / (i * 0.85);
      const grd = ctx.createRadialGradient(cx, cy, Math.min(rx, ry) * 0.18, cx, cy, Math.max(rx, ry) * scale);
      grd.addColorStop(0, "rgba(0,0,0,0)");
      grd.addColorStop(0.32, `rgba(${r},${g},${b},${0.04 * power})`);
      grd.addColorStop(0.58, `rgba(${r},${g},${b},${aShell * 0.7})`);
      grd.addColorStop(0.82, `rgba(${r},${g},${b},${aShell})`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grd;
      traceAuraPath(cx, cy, rx * scale * flicker, ry * scale * flicker, t, i, 72);
      ctx.fill();
    }
    if (charging || supreme) {
      ctx.fillStyle = `rgba(255,255,255,${0.07 * power})`;
      traceAuraPath(cx, cy, rx * 0.62, ry * 0.58, t * 1.1, 2, 48);
      ctx.fill();
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
    const pose = useCharge ? "charge" : "idle";
    const name = spriteName(key, pose);
    return images[name] || images[spriteName(key, "idle")] || images[`${key}_${pose}`] || images[`${key}_idle`];
  }

  function fitSprite(img, height, maxW) {
    if (!img || !img.width) return { w: 0, h: 0 };
    let dh = height;
    let dw = dh * (img.width / img.height);
    const m = metrics();
    const margin = 18 * dpr * camZoom;
    const maxH = Math.max(40, m.ground - m.pad.t - margin);
    const maxSide = Math.max(40, W - m.pad.l - m.pad.r - margin * 2);
    const capW = Math.min(maxW || maxSide, maxSide);
    if (dh > maxH) { const s = maxH / dh; dh = maxH; dw *= s; }
    if (dw > capW) { const s = capW / dw; dw = capW; dh *= s; }
    return { w: dw, h: dh };
  }

  function motionBox(size) {
    const t = performance.now();
    const breathe = 1 + Math.sin(t * 0.0032) * (charging ? 0.02 : 0.008);
    const squash = charging ? 1 + Math.sin(t * 0.018) * 0.012 : 1;
    const h = size.h * breathe;
    const w = size.w * squash;
    return { x: W / 2 - w / 2, y: metrics().ground - h, w, h };
  }

  function layoutChar(key, useCharge) {
    const m = metrics();
    const f = form();
    const idleImg = spriteFor(key, false);
    const img = spriteFor(key, useCharge);
    const baseH = H * m.charH * f.scale;
    const idleFit = fitSprite(idleImg, baseH, m.charMaxW);
    if (!useCharge || !img || img === idleImg) return { img: idleImg, box: motionBox(idleFit) };
    const roomW = Math.max(40, W - m.pad.l - m.pad.r - 24 * dpr);
    let chargeFit = fitSprite(img, idleFit.h, roomW);
    if (idleFit.h > 0 && chargeFit.h > 0 && chargeFit.h < idleFit.h) {
      const s = idleFit.h / chargeFit.h;
      let w = chargeFit.w * s;
      let h = chargeFit.h * s;
      const maxH = Math.max(40, m.ground - m.pad.t - 18 * dpr);
      const s2 = Math.min(1, maxH / h, roomW / w);
      chargeFit = { w: w * s2, h: h * s2 };
    }
    return { img, box: motionBox(chargeFit) };
  }

  function drawActor(img, box) {
    if (!img || !box || !box.w) return;
    ctx.drawImage(img, box.x, box.y, box.w, box.h);
    if (stopGlow > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = stopGlow * 0.45;
      ctx.drawImage(img, box.x, box.y, box.w, box.h);
      ctx.restore();
    }
  }

  function isEpicFinal(k) {
    return k === "legend" || k === "beast" || k === "ue" || k === "ui" || k === "cultra" || k === "fblack" || k === "rose" || k === "kid";
  }

  function layoutSelect() {
    const ids = ROSTER.map((c) => c.id);
    const m = metrics();
    const cols = 4;
    const rows = Math.ceil(ids.length / cols);
    const inner = Math.max(1, W - m.pad.l - m.pad.r);
    const r = Math.min(inner / (cols * 2.4), H * 0.1, 70 * dpr);
    const gapX = inner / cols;
    const gapY = r * 2.55;
    const startY = H * 0.46 - ((rows - 1) * gapY) / 2;
    return ids.map((id, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const lastRow = row === rows - 1;
      const count = lastRow ? ids.length - row * cols : cols;
      const rowInner = lastRow && count < cols ? gapX * count : inner;
      const rowLeft = lastRow && count < cols ? m.pad.l + (inner - rowInner) / 2 : m.pad.l;
      const cx = rowLeft + (rowInner / count) * (col + 0.5);
      const cy = startY + row * gapY;
      return { id, cx, cy, r };
    });
  }

  function pickSelect(p) {
    let best = null;
    let bestD = Infinity;
    for (const o of layoutSelect()) {
      const d = Math.hypot(p.x - o.cx, p.y - o.cy);
      if (d <= o.r * 1.2 && d < bestD) {
        best = o.id;
        bestD = d;
      }
    }
    return best;
  }

  function drawSelect() {
    const t = performance.now();
    const pulse = 1 + Math.sin(t * 0.004) * 0.04;
    for (const o of layoutSelect()) {
      const img = images[`portrait_${o.id}`];
      const rr = o.r * pulse;
      ctx.save();
      ctx.beginPath();
      ctx.arc(o.cx, o.cy, rr + 6 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,210,70,0.28)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(o.cx, o.cy, rr, 0, Math.PI * 2);
      ctx.clip();
      if (img) {
        const s = rr * 2.15;
        ctx.drawImage(img, o.cx - s / 2, o.cy - s / 2, s, s);
      } else {
        ctx.fillStyle = "#111";
        ctx.fillRect(o.cx - rr, o.cy - rr, rr * 2, rr * 2);
      }
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.arc(o.cx, o.cy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,220,90,0.95)";
      ctx.lineWidth = 3 * dpr;
      ctx.stroke();
      ctx.restore();
    }
  }

  async function selectCharacter(id) {
    if (!id || selected || state !== "select") return;
    selected = id;
    formIndex = 0;
    finalKey = null;
    charging = false;
    fade = 1;
    await loadCharSprites(id);
    state = "idle";
    shake = 0;
    camTarget = 1;
  }

  async function loadCharSprites(id) {
    const c = ROSTER.find((x) => x.id === id);
    if (!c) return;
    const keys = [...c.forms, c.supreme];
    const jobs = [];
    for (const k of keys) {
      for (const pose of ["idle", "charge"]) {
        const name = id === "broly" ? `${k}_${pose}` : `${id}_${k}_${pose}`;
        if (images[name]) continue;
        jobs.push(
          loadImage(`assets/sprites/${name}.png`).then((img) => { images[name] = img; }).catch(() => {})
        );
      }
    }
    if (jobs.length) await Promise.all(jobs);
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

  function drawEnergyWaves() {
    if (!energyWaves.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const w of energyWaves) {
      const [r, g, b] = w.rgb;
      const grd = ctx.createRadialGradient(w.x, w.y, 4, w.x, w.y, w.r);
      grd.addColorStop(0, `rgba(255,255,255,${0.22 * w.life})`);
      grd.addColorStop(0.35, `rgba(${r},${g},${b},${0.38 * w.life})`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function blastOrigin() {
    const cx = charBox.x + charBox.w / 2;
    const cy = charBox.y + charBox.h * 0.42;
    const masenko = blast && blast.kind === "masenko";
    return {
      cx,
      cy,
      handX: cx + charBox.w * (masenko ? 0 : 0.22),
      handY: masenko ? charBox.y + charBox.h * 0.2 : cy,
    };
  }

  function blastBall() {
    const o = blastOrigin();
    const lift = blast.lift || 0.28;
    if (blast.t < 0.95) {
      const p = blast.t / 0.95;
      return { x: o.handX, y: o.handY, rad: (14 + p * 52) * dpr, glow: 0.55 + p * 0.45, p: 0 };
    }
    if (blast.t < 1.52) {
      const p = (blast.t - 0.95) / 0.57;
      return {
        x: o.handX + W * 0.3 * p,
        y: o.handY - H * lift * p,
        rad: (66 + p * 28) * dpr,
        glow: 1,
        p,
      };
    }
    const p = Math.min(1, (blast.t - 1.52) / 0.32);
    return {
      x: o.handX + W * 0.3,
      y: o.handY - H * lift,
      rad: (90 + p * 240) * dpr,
      glow: Math.max(0, 1 - p),
      p: 1 + p,
    };
  }

  function fillGlow(x, y, rad, r, g, b, a) {
    const grd = ctx.createRadialGradient(x, y, 2, x, y, rad);
    grd.addColorStop(0, `rgba(${Math.min(255, r + 80)},${Math.min(255, g + 80)},${Math.min(255, b + 80)},${0.95 * a})`);
    grd.addColorStop(0.28, `rgba(${r},${g},${b},${0.9 * a})`);
    grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBlast() {
    if (!blast) return;
    const { r, g, b, kind } = blast;
    const ball = blastBall();
    const o = blastOrigin();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    if (kind === "beam" || kind === "galick" || kind === "masenko" || kind === "cannon" || kind === "spiral") {
      if (blast.t < 0.95) {
        fillGlow(ball.x, ball.y, ball.rad, r, g, b, ball.glow);
      } else {
        const ang = Math.atan2(ball.y - o.handY, ball.x - o.handX);
        const len = Math.max(40, Math.hypot(ball.x - o.handX, ball.y - o.handY) + ball.rad * 0.4);
        const thick = (kind === "cannon" ? 48 : kind === "spiral" ? 10 : kind === "galick" ? 28 : 22) * dpr;
        const boom = blast.t >= 1.52 ? 1 + (blast.t - 1.52) * 5 : 1;
        ctx.translate(o.handX, o.handY);
        ctx.rotate(ang);
        const grd = ctx.createLinearGradient(0, 0, len, 0);
        grd.addColorStop(0, `rgba(255,255,255,${0.95 * ball.glow})`);
        grd.addColorStop(0.18, `rgba(${r},${g},${b},${0.92 * ball.glow})`);
        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.ellipse(len * 0.5, 0, len * 0.5, thick * boom, 0, 0, Math.PI * 2);
        ctx.fill();
        if (kind === "spiral") {
          ctx.strokeStyle = `rgba(255,255,210,${0.7 * ball.glow})`;
          ctx.lineWidth = 2 * dpr;
          ctx.beginPath();
          for (let i = 0; i <= 18; i++) {
            const t = i / 18;
            const x = t * len;
            const y = Math.sin(t * 14 + blast.t * 18) * thick * 1.6;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
    } else if (kind === "slash") {
      if (blast.t < 0.95) {
        fillGlow(ball.x, ball.y, ball.rad * 0.7, r, g, b, ball.glow);
      } else {
        ctx.translate(o.cx, o.cy);
        ctx.rotate(-0.55 + ball.p * 0.35);
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.9 * ball.glow})`;
        ctx.lineWidth = 18 * dpr * (blast.t >= 1.52 ? 2.4 : 1);
        ctx.beginPath();
        ctx.arc(0, 0, ball.rad * 1.4, -0.9, 1.4);
        ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${0.7 * ball.glow})`;
        ctx.lineWidth = 6 * dpr;
        ctx.stroke();
      }
    } else {
      fillGlow(ball.x, ball.y, ball.rad * (kind === "deathball" ? 1.15 : 1), r, g, b, ball.glow);
      if (kind === "blob" && blast.t > 0.4) {
        fillGlow(ball.x - ball.rad * 0.35, ball.y + ball.rad * 0.2, ball.rad * 0.45, r, g, b, ball.glow * 0.7);
        fillGlow(ball.x + ball.rad * 0.3, ball.y - ball.rad * 0.15, ball.rad * 0.38, r, g, b, ball.glow * 0.6);
      }
    }

    ctx.restore();
  }

  function drawFlash() {
    if (flash <= 0) return;
    if (blast) {
      ctx.fillStyle = `rgba(${blast.r},${blast.g},${blast.b},${flash})`;
    } else if (flashRgb) {
      ctx.fillStyle = `rgba(${flashRgb[0]},${flashRgb[1]},${flashRgb[2]},${flash})`;
    } else {
      ctx.fillStyle = `rgba(255,255,255,${flash})`;
    }
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

    if (state === "select") {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      drawBackground();
      drawSelect();
      drawVignette();
      if (fade > 0) {
        ctx.fillStyle = `rgba(0,0,0,${fade})`;
        ctx.fillRect(0, 0, W, H);
      }
      return;
    }

    const f = form();
    const useCharge = charging || state === "final" || state === "transform" || !!blast;
    const posed = layoutChar(f.key, useCharge);
    const img = posed.img;
    Object.assign(charBox, posed.box);
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
    drawEnergyWaves();
    drawBlast();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!lite) drawVignette();
    drawFlash();
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
      bgm.loop = false;
      bgm.playsInline = true;
      bgm.setAttribute("playsinline", "true");
      bgm.preload = "auto";
      bgm.volume = MUSIC_VOL;
      bindMusic(bgm);
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

    const imgJobs = [
      loadImage("assets/bg/battlefield.png").then((img) => { images.bg = img; }),
      loadImage("assets/bg/namek.png").then((img) => { images.bg_namek = img; }).catch(() => {}),
      loadImage("assets/bg/ring.png").then((img) => { images.bg_ring = img; }).catch(() => {}),
      loadImage("assets/bg/city.png").then((img) => { images.bg_city = img; }).catch(() => {}),
      loadImage("assets/bg/hell.png").then((img) => { images.bg_hell = img; }).catch(() => {}),
    ];
    for (const c of ROSTER) {
      imgJobs.push(
        loadImage(`assets/portraits/${c.id}.png`).then((img) => { images[`portrait_${c.id}`] = img; }).catch(() => {})
      );
    }
    const sfxKeys = [
      "charge_up",
      "scream", "scream2", "roar", "roar2", "roar3",
      "impact", "explosion", "explosion2", "shockwave",
      "whoosh_storm", "whoosh_wind", "whoosh", "whoosh_deep",
      "fire", "electric", "lightning", "wind", "bass",
    ];

    const sndJobs = sfxKeys.map((key) =>
      loadAudio(`assets/sfx/${key}.mp3`).then((el) => { audio[key] = el; })
    );
    sndJobs.push(loadAudio("aura.mp3", true).then((el) => { audio.ki_aura = el; }));
    sndJobs.push(loadAudio("aurarose.mp3", true).then((el) => { audio.ki_aura_rose = el; }));
    sndJobs.push(loadAudio("scream.mp3").then((el) => { audio.ki_scream = el; }));

    requestAnimationFrame(loop);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
    await Promise.all([...imgJobs, ...sndJobs]);
    state = "select";
    fade = 1;
  }

  boot();
})();
