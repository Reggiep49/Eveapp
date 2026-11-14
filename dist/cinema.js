"use strict";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let sceneCleanup = null;
let currentScene = null;
let finishFinale = () => {};
let giftModel = null;
let soundEnabled = false;
let soundContext = null;

function cinemaLayers(asset) {
  return `<div class="cinema-art art-${asset}" aria-hidden="true"></div>
    <canvas class="cinema-particles" aria-hidden="true"></canvas><div class="cinema-shade" aria-hidden="true"></div>`;
}

function stopCinema() {
  sceneCleanup?.();
  sceneCleanup = null;
  currentScene = null;
  finishFinale = () => {};
}

function mountCinema(root, type) {
  const canvas = root.querySelector("canvas");
  const context = canvas.getContext("2d");
  const start = performance.now();
  const isFinale = type === "sent";
  const finaleActions = isFinale ? root.querySelector(".finale-actions") : null;
  const finaleCaption = isFinale ? root.querySelector(".finale-caption") : null;
  const finaleProgress = isFinale ? root.querySelector(".finale-progress") : null;
  const finaleSkip = isFinale ? root.querySelector(".finale-skip") : null;
  const finaleLine = isFinale ? root.querySelector("[data-finale-line]") : null;
  let ended = false;
  let raf;
  let finaleTimer;
  let viewWidth = 1;
  let viewHeight = 1;
  let cameraX = 0;
  let cameraY = 0;
  let targetX = 0;
  let targetY = 0;
  let previous = start;
  let dragStart = null;
  let showStage = -1;
  const snow = Array.from({ length: 112 }, () => ({
    x: Math.random(), y: Math.random(), z: Math.random(), seed: Math.random() * 8,
  }));
  const bursts = [
    { time: 2.85, x: .59, y: .46, hue: 45 }, { time: 3.23, x: .71, y: .28, hue: 165 },
    { time: 3.45, x: .82, y: .19, hue: 275 }, { time: 3.8, x: .50, y: .27, hue: 38 },
  ].map((burst) => ({ ...burst, rays: Array.from({ length: 48 }, (_, i) => ({
    angle: i * Math.PI * 2 / 48, speed: 52 + Math.random() * 190, light: 56 + Math.random() * 35,
  })) }));
  const resize = () => {
    viewWidth = Math.max(1, root.clientWidth);
    viewHeight = Math.max(1, root.clientHeight);
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = viewWidth * density;
    canvas.height = viewHeight * density;
    context?.setTransform(density, 0, 0, density, 0, 0);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(root);
  resize();

  currentScene = {
    pan(direction) {
      targetX = Math.max(-1, Math.min(1, targetX + direction * .57));
      if (reducedMotion.matches) root.style.setProperty("--camera-x", `${targetX * 32}px`);
      playHoliday("select");
    },
  };

  function point(event) {
    if (reducedMotion.matches || isFinale || event.pointerType === "touch") return;
    const rect = root.getBoundingClientRect();
    targetX = (event.clientX - rect.left) / viewWidth * 2 - 1;
    targetY = (event.clientY - rect.top) / viewHeight * 2 - 1;
  }

  function drag(event) {
    if (type === "village" && event.pointerType === "touch" && !event.target.closest("button")) dragStart = event.clientX;
  }

  function release(event) {
    if (dragStart === null) return;
    const delta = event.clientX - dragStart;
    dragStart = null;
    if (Math.abs(delta) > 25) currentScene?.pan(delta > 0 ? 1 : -1);
  }

  root.addEventListener("pointermove", point);
  root.addEventListener("pointerdown", drag);
  root.addEventListener("pointerup", release);

  finishFinale = (focus = false) => {
    if (!isFinale || ended) return;
    ended = true;
    clearTimeout(finaleTimer);
    root.classList.add("finale-done");
    finaleActions.inert = false;
    finaleCaption.removeAttribute("aria-hidden");
    finaleProgress.hidden = true;
    finaleSkip.hidden = true;
    announce(demoFinale ? "Sleigh flight preview complete." : "Santa got your letter. Your grown-up has a copy.");
    if (focus) root.querySelector("h1").focus({ preventScroll: true });
  };

  if (isFinale) {
    if (reducedMotion.matches) finishFinale();
    else {
      finaleCaption.setAttribute("aria-hidden", "true");
      finaleActions.inert = true;
      finaleTimer = setTimeout(() => finishFinale(), 5600);
    }
  }

  function draw(now) {
    const seconds = (now - start) / 1000;
    const delta = Math.min((now - previous) / 1000, .04);
    previous = now;
    cameraX += (targetX - cameraX) * .06;
    cameraY += (targetY - cameraY) * .06;
    root.style.setProperty("--camera-x", `${cameraX * 32}px`);
    root.style.setProperty("--camera-y", `${cameraY * 17}px`);
    if (isFinale && !ended) {
      const nextStage = seconds < 1.3 ? 0 : seconds < 2.8 ? 1 : 2;
      if (nextStage !== showStage) {
        showStage = nextStage;
        finaleLine.textContent = ["North Pole mailroom · Launching letter", "Reindeer flight path · Into the aurora", "Santa’s sleigh · Letter aboard"][nextStage];
      }
    }

    if (context) {
      context.clearRect(0, 0, viewWidth, viewHeight);
      for (const flake of snow) {
        flake.y = (flake.y + delta * (.024 + flake.z * .102)) % 1;
        const x = ((flake.x * viewWidth + Math.sin(seconds * .55 + flake.seed) * (4 + flake.z * 24) - cameraX * 21 * flake.z + viewWidth) % viewWidth);
        const y = flake.y * viewHeight;
        context.fillStyle = `rgba(218,238,255,${.15 + flake.z * .56})`;
        context.beginPath();
        context.arc(x, y, .65 + flake.z * flake.z * 2.8, 0, Math.PI * 2);
        context.fill();
      }
      if (isFinale && seconds < 6.8 && (!ended || seconds > 4.75)) drawBursts(seconds);
    }
    raf = requestAnimationFrame(draw);
  }

  function drawBursts(seconds) {
    context.save();
    context.globalCompositeOperation = "lighter";
    for (const burst of bursts) {
      const elapsed = seconds - burst.time;
      if (elapsed < 0 || elapsed > 2.3) continue;
      const weight = Math.max(0, 1 - elapsed / 2.3);
      const fall = elapsed * elapsed * 21;
      for (const ray of burst.rays) {
        const distance = Math.log1p(elapsed * 2) * ray.speed * Math.min(1, viewWidth / 760);
        const x = burst.x * viewWidth + Math.cos(ray.angle) * distance;
        const y = burst.y * viewHeight + Math.sin(ray.angle) * distance + fall;
        context.strokeStyle = `hsla(${burst.hue},100%,${ray.light}%,${weight})`;
        context.lineWidth = 1 + weight * 1.5;
        context.beginPath();
        context.moveTo(x - Math.cos(ray.angle) * (5 + weight * 18), y - Math.sin(ray.angle) * (5 + weight * 18));
        context.lineTo(x, y);
        context.stroke();
      }
    }
    context.restore();
  }

  if (!reducedMotion.matches) raf = requestAnimationFrame(draw);
  sceneCleanup = () => {
    cancelAnimationFrame(raf);
    clearTimeout(finaleTimer);
    observer.disconnect();
  };
}

function panCinema(direction) {
  currentScene?.pan(direction);
}

function inspectGift(action) {
  if (!giftModel) return;
  const zoom = dialog.querySelector('[data-action="inspect-zoom"]');
  if (action === "inspect-turn" || action === "inspect-left") {
    giftModel.turn(action === "inspect-turn" ? 1 : -1);
    return;
  }
  const enlarged = action === "inspect-zoom" && zoom.getAttribute("aria-pressed") !== "true";
  if (action === "inspect-reset") giftModel.reset();
  else giftModel.zoom(enlarged);
  zoom.setAttribute("aria-pressed", String(enlarged));
  zoom.setAttribute("aria-label", enlarged ? "Zoom out" : "Zoom in");
  zoom.textContent = enlarged ? "−" : "+";
}

function toggleAudio(button) {
  soundEnabled = !soundEnabled;
  button.setAttribute("aria-pressed", String(soundEnabled));
  button.textContent = soundEnabled ? "♫" : "♪";
  if (soundEnabled) playHoliday("select");
  else soundContext?.suspend().catch(() => {});
}

function playHoliday(cue, finale = false) {
  if (!soundEnabled || (finale && reducedMotion.matches)) return;
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  try {
    soundContext ||= new Audio();
    const notes = cue === "send"
      ? [[.07, 52], [.42, 59], [.75, 64], [1.1, 67], [1.45, 71], [1.8, 76], [2.18, 79], [2.52, 83], [2.88, 88], [3.12, 76], [3.12, 83], [3.12, 91], [3.45, 95], [3.85, 88]]
      : [[0, 76], [.13, 83], [.27, 88]];
    soundContext.resume().then(() => {
      if (!soundEnabled) return;
      const now = soundContext.currentTime + .04;
      for (const [delay, pitch] of notes) {
        const bell = soundContext.createOscillator();
        const gain = soundContext.createGain();
        const time = now + delay;
        bell.type = "sine";
        bell.frequency.value = 440 * 2 ** ((pitch - 69) / 12);
        gain.gain.setValueAtTime(.0001, time);
        gain.gain.exponentialRampToValueAtTime(.095, time + .018);
        gain.gain.exponentialRampToValueAtTime(.0001, time + .85);
        bell.connect(gain).connect(soundContext.destination);
        bell.start(time);
        bell.stop(time + .87);
      }
    }).catch(() => {});
  } catch {
    soundEnabled = false;
  }
}
