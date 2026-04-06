/**
 * NV Energy Solar — scroll-driven canvas (skill: video-to-website)
 */
const FRAME_COUNT = 192;
const FRAME_SPEED = 2.0;
const IMAGE_SCALE = 0.86;

const frameUrl = (i) =>
  `frames/nv-energy-solar-frame-${String(i + 1).padStart(4, "0")}.webp`;

const canvas = document.getElementById("canvas");
const canvasWrap = document.getElementById("canvas-wrap");
const scrollContainer = document.getElementById("scroll-container");
const heroSection = document.getElementById("hero-standalone");
const loader = document.getElementById("loader");
const loaderFill = document.getElementById("loader-bar-fill");
const loaderPercent = document.getElementById("loader-percent");

const ctx = canvas.getContext("2d", { alpha: false });
const frames = new Array(FRAME_COUNT);

let currentFrame = -1;
let bgColor = "#000000";
let sampleCanvas;
let sampleCtx;

function sampleBgColor(img) {
  if (!img?.naturalWidth) return "#000000";
  if (!sampleCanvas) {
    sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = sampleCanvas.height = 4;
    sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  }
  sampleCtx.drawImage(img, 0, 0, 4, 4);
  const d = sampleCtx.getImageData(0, 0, 1, 1).data;
  return `rgb(${d[0]},${d[1]},${d[2]})`;
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawFrame(currentFrame >= 0 ? currentFrame : 0);
}

function drawFrame(index) {
  const i = Math.max(0, Math.min(FRAME_COUNT - 1, index));
  const img = frames[i];
  if (!img || !img.complete || img.naturalWidth === 0) return;

  if (i % 20 === 0) {
    bgColor = sampleBgColor(img);
  }

  const cw = window.innerWidth;
  const ch = window.innerHeight;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

function loadFrames(onProgress) {
  return new Promise((resolve) => {
    let loaded = 0;
    const report = () => {
      loaded++;
      const p = loaded / FRAME_COUNT;
      onProgress?.(p);
      if (loaded === FRAME_COUNT) resolve();
    };

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      let done = false;
      const once = () => {
        if (done) return;
        done = true;
        report();
      };
      img.onload = once;
      img.onerror = once;
      if (i < 10) img.fetchPriority = "high";
      img.src = frameUrl(i);
      frames[i] = img;
      if (img.complete && img.naturalWidth > 0) once();
    }
  });
}

function positionScrollSections() {
  document.querySelectorAll(".scroll-section").forEach((section) => {
    const enter = parseFloat(section.dataset.enter) / 100;
    const leave = parseFloat(section.dataset.leave) / 100;
    const mid = (enter + leave) / 2;
    section.style.top = `${mid * 100}%`;
  });
}

function setupSectionAnimation(section) {
  const type = section.dataset.animation;
  const persist = section.dataset.persist === "true";
  const enter = parseFloat(section.dataset.enter) / 100;
  const leave = parseFloat(section.dataset.leave) / 100;

  const children = section.querySelectorAll(
    ".section-label, .section-heading, .section-body, .section-note, .cta-button, .stat"
  );
  if (!children.length) return { tl: null, enter, leave, persist };

  const tl = gsap.timeline({ paused: true });

  switch (type) {
    case "fade-up":
      tl.from(children, {
        y: 50,
        opacity: 0,
        stagger: 0.12,
        duration: 0.9,
        ease: "power3.out",
      });
      break;
    case "slide-left":
      tl.from(children, {
        x: -80,
        opacity: 0,
        stagger: 0.14,
        duration: 0.9,
        ease: "power3.out",
      });
      break;
    case "slide-right":
      tl.from(children, {
        x: 80,
        opacity: 0,
        stagger: 0.14,
        duration: 0.9,
        ease: "power3.out",
      });
      break;
    case "scale-up":
      tl.from(children, {
        scale: 0.85,
        opacity: 0,
        stagger: 0.12,
        duration: 1.0,
        ease: "power2.out",
      });
      break;
    case "rotate-in":
      tl.from(children, {
        y: 40,
        rotation: 3,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: "power3.out",
      });
      break;
    case "stagger-up":
      tl.from(children, {
        y: 60,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "power3.out",
      });
      break;
    case "clip-reveal":
      tl.from(children, {
        clipPath: "inset(100% 0 0 0)",
        opacity: 0,
        stagger: 0.15,
        duration: 1.2,
        ease: "power4.inOut",
      });
      break;
    default:
      tl.from(children, {
        y: 40,
        opacity: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: "power3.out",
      });
  }

  return { tl, enter, leave, persist };
}

function initDarkOverlay(overlayEl, enter, leave) {
  const fadeRange = 0.04;
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      let o = 0;
      if (p >= enter - fadeRange && p <= enter) {
        o = (p - (enter - fadeRange)) / fadeRange;
      } else if (p > enter && p < leave) {
        o = 0.9;
      } else if (p >= leave && p <= leave + fadeRange) {
        o = 0.9 * (1 - (p - leave) / fadeRange);
      } else if (p > leave + fadeRange) {
        o = 0;
      }
      overlayEl.style.opacity = String(o);
    },
  });
}

function initHeroTransition() {
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      if (heroSection) {
        heroSection.style.opacity = String(Math.max(0, 1 - p * 15));
      }
      const wipeProgress = Math.min(1, Math.max(0, (p - 0.01) / 0.06));
      const radius = wipeProgress * 75;
      canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;
    },
  });
}

function initMarquee() {
  document.querySelectorAll(".marquee-wrap").forEach((wrap) => {
    const text = wrap.querySelector(".marquee-text");
    if (!text) return;
    const speed = parseFloat(wrap.dataset.scrollSpeed) || -25;
    gsap.to(text, {
      xPercent: speed,
      ease: "none",
      scrollTrigger: {
        trigger: scrollContainer,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        let op = 0;
        if (p > 0.12 && p < 0.88) {
          const a = Math.min(1, (p - 0.12) / 0.08);
          const b =
            p > 0.8 ? Math.max(0, 1 - (p - 0.8) / 0.08) : 1;
          op = Math.min(a, b) * 0.85;
        }
        wrap.style.opacity = String(op);
      },
    });
  });
}

function initStatCounters() {
  document.querySelectorAll(".stat-number").forEach((el) => {
    const target = parseFloat(el.dataset.value);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const section = el.closest(".scroll-section");
    if (!section) return;

    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: "power1.out",
      scrollTrigger: {
        trigger: section,
        start: "top 78%",
        end: "top 40%",
        toggleActions: "play none none reverse",
      },
      onUpdate: () => {
        el.textContent =
          decimals === 0
            ? String(Math.round(obj.val))
            : obj.val.toFixed(decimals);
      },
    });
  });
}

async function boot() {
  gsap.registerPlugin(ScrollTrigger);

  positionScrollSections();

  await loadFrames((p) => {
    const pct = Math.round(p * 100);
    if (loaderFill) loaderFill.style.width = `${pct}%`;
    if (loaderPercent) loaderPercent.textContent = `${pct}%`;
  });

  if (loader) loader.classList.add("is-hidden");

  resizeCanvas();
  window.addEventListener("resize", () => {
    resizeCanvas();
    ScrollTrigger.refresh();
  });

  const LenisCtor = window.Lenis;
  if (typeof LenisCtor === "function") {
    const lenis = new LenisCtor({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  } else {
    window.addEventListener("scroll", () => ScrollTrigger.update(), {
      passive: true,
    });
  }

  const sectionStates = [];
  document.querySelectorAll(".scroll-section").forEach((section) => {
    const cfg = setupSectionAnimation(section);
    if (cfg.tl) {
      sectionStates.push({
        section,
        tl: cfg.tl,
        enter: cfg.enter,
        leave: cfg.leave,
        persist: cfg.persist,
        persistLocked: false,
      });
    }
  });

  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      const accelerated = Math.min(p * FRAME_SPEED, 1);
      const index = Math.min(
        Math.floor(accelerated * FRAME_COUNT),
        FRAME_COUNT - 1
      );
      if (index !== currentFrame) {
        currentFrame = index;
        requestAnimationFrame(() => drawFrame(currentFrame));
      }

      sectionStates.forEach((st) => {
        const { tl, enter, leave, persist } = st;
        if (!tl) return;
        if (persist && p >= leave) st.persistLocked = true;
        if (persist && st.persistLocked) {
          tl.progress(1);
          return;
        }
        let local;
        if (p < enter) local = 0;
        else if (p > leave) local = 0;
        else local = (p - enter) / (leave - enter);
        tl.progress(local);
      });
    },
  });

  initDarkOverlay(document.getElementById("dark-overlay"), 0.62, 0.82);
  initHeroTransition();
  initMarquee();
  initStatCounters();

  ScrollTrigger.refresh();
  drawFrame(0);
}

boot().catch(console.error);
