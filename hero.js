/* Hero: the terminal field behind the name, and "Dodge the lasers", a small
   bullet-hell game in the same characters, framed in them too. Everything here is built by script,
   so without JS the hero is plain ink. Colours and the mono face come from tokens.css. */
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  if (!hero || !document.createElement("canvas").getContext) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tokens = getComputedStyle(document.documentElement);
  function tok(name) { return tokens.getPropertyValue(name).trim(); }
  var COLOR = {
    glyph: tok("--color-on-band"),
    muted: tok("--color-on-band-muted"),
    accent: tok("--color-accent")
  };
  var MONO = tok("--font-mono");

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function ramp(x, a, b) { return clamp((x - a) / (b - a), 0, 1); }

  // One switch for everything that moves on its own (the field and the game's demo),
  // so a single visible pause covers both. Off from the start under reduced motion.
  var ambientOn = !reduceMotion;
  var heroVisible = false;
  var ambientListeners = [];
  function setAmbient(on) {
    ambientOn = on;
    ambientListeners.forEach(function (fn) { fn(); });
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      ambientListeners.forEach(function (fn) { fn(); });
    }).observe(hero);
  } else {
    heroVisible = true;
  }

  /* ---------- The field: drifting characters on the hero's empty right side ---------- */

  var box = null;      // the game's box, once built; the field frames it and stops at its edge
  var field = { refresh: function () {} };

  (function () {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var RAMP = " .,:-=+*#", CW = 10, CH = 17;
    var w = 0, h = 0, dpr = 1, cols = 0, rows = 0, outline = null;
    var raf = 0, last = 0, t0 = performance.now(), elapsed = 0, wasRunning = false;

    canvas.className = "hero-field";
    canvas.setAttribute("aria-hidden", "true");
    hero.prepend(canvas);

    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      cols = Math.ceil(w / CW);
      rows = Math.ceil(h / CH);
      // The game box on the field's grid: its edge cells carry the frame
      outline = null;
      if (box) {
        var hr = hero.getBoundingClientRect(), br = box.getBoundingClientRect();
        outline = {
          l: Math.floor((br.left - hr.left) / CW),
          r: Math.ceil((br.right - hr.left) / CW) - 1,
          t: Math.floor((br.top - hr.top) / CH),
          b: Math.ceil((br.bottom - hr.top) / CH) - 1
        };
      }
    }

    function draw(t) {
      var narrow = w < 640;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.font = "13px " + MONO;
      ctx.textBaseline = "top";
      ctx.fillStyle = COLOR.glyph;
      for (var r = 0; r < rows; r++) {
        for (var q = 0; q < cols; q++) {
          if (outline && q >= outline.l && q <= outline.r && r >= outline.t && r <= outline.b) continue;
          var u = q / cols, v = r / rows;
          // Strongest on the empty right; never behind the paragraph or the buttons.
          var m = narrow ? ramp(u, 0.3, 0.8) * (1 - ramp(v, 0.2, 0.34)) : ramp(u, 0.45, 0.85);
          if (m <= 0) continue;
          var n = Math.sin(q * 0.21 + t * 0.32) + Math.sin(r * 0.29 - t * 0.23) + Math.sin((q + r) * 0.11 + t * 0.17);
          var val = (n + 3) / 6 * m;
          var i = Math.min(RAMP.length - 1, Math.floor(val * RAMP.length));
          if (i <= 0) continue;
          ctx.globalAlpha = 0.08 + val * 0.26;
          ctx.fillText(RAMP[i], q * CW, r * CH);
        }
      }
      // The frame, in the field's own characters
      if (outline) {
        ctx.globalAlpha = 0.5;
        for (var c = outline.l; c <= outline.r; c++) {
          var edge = c === outline.l || c === outline.r ? "+" : "-";
          ctx.fillText(edge, c * CW, outline.t * CH);
          ctx.fillText(edge, c * CW, outline.b * CH);
        }
        for (var s = outline.t + 1; s < outline.b; s++) {
          ctx.fillText("|", outline.l * CW, s * CH);
          ctx.fillText("|", outline.r * CW, s * CH);
        }
      }
      ctx.globalAlpha = 1;
    }

    function running() { return ambientOn && heroVisible; }
    function now() { return running() ? (performance.now() - t0) / 1000 : elapsed; }

    function frame(time) {
      raf = 0;
      if (!running()) return;
      if (time - last >= 66) { last = time; draw((time - t0) / 1000); }
      raf = requestAnimationFrame(frame);
    }

    function sync() {
      var run = running();
      if (run && !wasRunning) t0 = performance.now() - elapsed * 1000;
      if (!run && wasRunning) elapsed = (performance.now() - t0) / 1000;
      wasRunning = run;
      if (run && !raf) raf = requestAnimationFrame(frame);
    }

    size();
    draw(reduceMotion ? 6 : 0);
    field.refresh = function () { size(); draw(now()); };
    ambientListeners.push(sync);
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { size(); draw(now()); }).observe(hero);
    }
  })();

  /* ---------- Dodge the lasers ---------- */

  box = document.createElement("div");
  box.className = "dodge";
  box.setAttribute("role", "group");
  box.setAttribute("aria-label", "Dodge the lasers, a small game");
  box.innerHTML =
    '<div class="dodge-hud">' +
      '<span class="dodge-time">time 0.0s</span>' +
      '<span class="dodge-best"></span>' +
      '<button class="dodge-pause" type="button"></button>' +
    "</div>" +
    '<div class="dodge-stage" tabindex="-1">' +
      '<canvas aria-hidden="true"></canvas>' +
      '<div class="dodge-overlay">' +
        '<p class="dodge-hint"></p>' +
        '<button class="button button-primary dodge-start" type="button"></button>' +
      "</div>" +
    "</div>" +
    '<p class="visually-hidden" role="status" aria-live="polite"></p>';
  hero.appendChild(box);

  var stage = box.querySelector(".dodge-stage");
  var cv = stage.querySelector("canvas");
  var g = cv.getContext("2d");
  var overlay = box.querySelector(".dodge-overlay");
  var hintEl = box.querySelector(".dodge-hint");
  var startBtn = box.querySelector(".dodge-start");
  var timeEl = box.querySelector(".dodge-time");
  var bestEl = box.querySelector(".dodge-best");
  var pauseBtn = box.querySelector(".dodge-pause");
  var statusEl = box.querySelector("[role=status]");
  var statement = hero.querySelector(".hero-statement");

  var CW = 8, CH = 14, SPEED = 230;
  var W = 0, H = 0, dpr = 1, cols = 0, rows = 0;
  var mode = "attract"; // attract | play | paused | dead
  var P, hazards, clock, nextLaser, nextBullet, nextBurst, deadFor;
  var keys = {}, pointer = null, aiPick = 0, aiDir = [0, 0], hudTick = 0;
  var raf = 0, lastT = 0;
  var best = readBest();

  function readBest() {
    try { return parseFloat(localStorage.getItem("dodge-best")) || 0; } catch (e) { return 0; }
  }
  function saveBest(v) {
    try { localStorage.setItem("dodge-best", String(v)); } catch (e) { /* private mode */ }
  }

  function cellX(x) { return clamp(Math.floor(x / CW), 0, cols - 1); }
  function cellY(y) { return clamp(Math.floor(y / CH), 0, rows - 1); }

  function reset() {
    P = { x: Math.floor(cols / 2) * CW + CW / 2, y: Math.floor(rows / 2) * CH + CH / 2 };
    hazards = [];
    clock = 0;
    nextLaser = 1.4;
    nextBullet = 1.1;
    nextBurst = 9;
    deadFor = 0;
  }

  function difficulty() {
    return mode === "play" ? 1 + clock / 18 : 1.15;
  }

  function spawn(dt) {
    var d = difficulty();
    nextLaser -= dt;
    nextBullet -= dt;
    nextBurst -= dt;

    if (nextLaser <= 0) {
      var horiz = Math.random() < 0.5;
      var idx = horiz ? Math.floor(Math.random() * rows) : Math.floor(Math.random() * cols);
      if (Math.random() < 0.45) idx = horiz ? cellY(P.y) : cellX(P.x); // some lasers hunt you
      hazards.push({ k: "laser", h: horiz, i: idx, t: 0, warn: Math.max(0.5, 0.95 - clock * 0.006), fire: 0.28 });
      nextLaser = Math.max(0.3, 1.5 / d) * (0.7 + Math.random() * 0.6);
    }

    if (nextBullet <= 0) {
      var edge = Math.floor(Math.random() * 4), x, y;
      if (edge === 0) { x = -CW; y = Math.random() * H; }
      else if (edge === 1) { x = W + CW; y = Math.random() * H; }
      else if (edge === 2) { x = Math.random() * W; y = -CH; }
      else { x = Math.random() * W; y = H + CH; }
      var ax = P.x + (Math.random() - 0.5) * 90 - x, ay = P.y + (Math.random() - 0.5) * 70 - y;
      var len = Math.hypot(ax, ay) || 1, sp = 75 + 28 * d;
      hazards.push({ k: "bullet", x: x, y: y, vx: ax / len * sp, vy: ay / len * sp, ch: "*" });
      nextBullet = Math.max(0.07, 0.55 / d) * (0.6 + Math.random() * 0.8);
    }

    if (nextBurst <= 0) {
      var bx, by, tries = 0;
      do {
        bx = (2 + Math.random() * (cols - 4)) * CW;
        by = (2 + Math.random() * (rows - 4)) * CH;
        tries++;
      } while (Math.hypot(bx - P.x, by - P.y) < 90 && tries < 12);
      hazards.push({ k: "burst", x: bx, y: by, t: 0, warn: 0.7, n: 10 + Math.floor(d * 2) });
      nextBurst = Math.max(1.8, 5.5 / d) * (0.8 + Math.random() * 0.4);
    }
  }

  function hits(h) {
    var px = cellX(P.x), py = cellY(P.y);
    if (h.k === "laser") return h.t >= h.warn && (h.h ? py === h.i : px === h.i);
    if (h.k === "bullet") return Math.floor(h.x / CW) === px && Math.floor(h.y / CH) === py;
    return false;
  }

  function stepHazards(dt) {
    var keep = [];
    for (var n = 0; n < hazards.length; n++) {
      var h = hazards[n];
      if (h.k === "laser") {
        h.t += dt;
        if (h.t < h.warn + h.fire) keep.push(h);
      } else if (h.k === "burst") {
        h.t += dt;
        if (h.t >= h.warn) {
          var sp = 55 + 20 * difficulty(), off = Math.random() * Math.PI;
          for (var b = 0; b < h.n; b++) {
            var a = off + (b / h.n) * Math.PI * 2;
            keep.push({ k: "bullet", x: h.x, y: h.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.75, ch: "o" });
          }
        } else {
          keep.push(h);
        }
      } else {
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        if (h.x > -3 * CW && h.x < W + 3 * CW && h.y > -3 * CH && h.y < H + 3 * CH) keep.push(h);
      }
    }
    hazards = keep;
  }

  function moveBy(dx, dy, dt) {
    var len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    P.x = clamp(P.x + dx * SPEED * dt, CW / 2, W - CW / 2);
    P.y = clamp(P.y + dy * SPEED * dt, CH / 2, H - CH / 2);
  }

  function playerInput() {
    if (pointer) {
      var dx = pointer.x - P.x, dy = pointer.y - P.y, d = Math.hypot(dx, dy);
      return d < 4 ? [0, 0] : [dx / Math.max(d, 24), dy / Math.max(d, 24)];
    }
    var x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    var y = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    return [x, y];
  }

  // The demo player: looks a quarter second ahead and steps away from danger.
  function danger(x, y) {
    var cx = Math.floor(x / CW), cy = Math.floor(y / CH), score = 0;
    for (var n = 0; n < hazards.length; n++) {
      var h = hazards[n];
      if (h.k === "laser") {
        if (h.h ? cy === h.i : cx === h.i) score += 12 / (Math.max(0, h.warn - h.t) + 0.25);
      } else if (h.k === "bullet") {
        var fx = h.x + h.vx * 0.25, fy = h.y + h.vy * 0.25;
        var dist = Math.hypot((fx - x) / CW, (fy - y) / CH);
        if (dist < 3) score += 8 / (dist + 0.4);
      } else if (h.k === "burst") {
        var bd = Math.hypot((h.x - x) / CW, (h.y - y) / CH);
        if (bd < 5) score += 3 / (bd + 1);
      }
    }
    // Stay off the walls, where it gets cornered.
    score += Math.pow(Math.abs(x / W - 0.5) * 2, 4) * 3 + Math.pow(Math.abs(y / H - 0.5) * 2, 4) * 3;
    return score;
  }

  function aiInput(dt) {
    aiPick -= dt;
    if (aiPick <= 0) {
      aiPick = 0.1;
      var bestDir = [0, 0], bestScore = Infinity;
      for (var dx = -1; dx <= 1; dx++) {
        for (var dy = -1; dy <= 1; dy++) {
          var s = danger(P.x + dx * SPEED * 0.25, P.y + dy * SPEED * 0.25) + Math.random() * 0.4;
          if (s < bestScore) { bestScore = s; bestDir = [dx, dy]; }
        }
      }
      aiDir = bestDir;
    }
    return aiDir;
  }

  function step(dt) {
    if (mode === "dead") return;
    if (mode === "play") clock += dt;
    else clock += dt * 0.5;
    spawn(dt);
    stepHazards(dt);
    var dir = mode === "play" ? playerInput() : aiInput(dt);
    moveBy(dir[0], dir[1], dt);

    for (var n = 0; n < hazards.length; n++) {
      if (hits(hazards[n])) {
        if (mode === "play") return die();
        deadFor = 1.2; // the demo player dies quietly and starts over
        break;
      }
    }
  }

  function render() {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    g.font = "12px " + MONO;
    g.textBaseline = "top";

    // Faint terminal dot grid
    g.fillStyle = COLOR.muted;
    g.globalAlpha = 0.14;
    for (var r = 0; r < rows; r += 2) {
      for (var c = r % 4 === 0 ? 0 : 1; c < cols; c += 2) g.fillText(".", c * CW, r * CH);
    }

    for (var n = 0; n < hazards.length; n++) {
      var h = hazards[n];
      if (h.k === "laser") {
        var firing = h.t >= h.warn;
        g.fillStyle = COLOR.glyph;
        g.globalAlpha = firing ? 1 : (Math.floor(h.t * 12) % 2 ? 0.55 : 0.22);
        var ch = firing ? (h.h ? "=" : "|") : (h.h ? "-" : ":");
        if (h.h) { for (var q = 0; q < cols; q++) g.fillText(ch, q * CW, h.i * CH); }
        else { for (var s = 0; s < rows; s++) g.fillText(ch, h.i * CW, s * CH); }
      } else if (h.k === "burst") {
        g.fillStyle = COLOR.glyph;
        g.globalAlpha = Math.floor(h.t * 12) % 2 ? 0.9 : 0.35;
        g.fillText("+", Math.floor(h.x / CW) * CW, Math.floor(h.y / CH) * CH);
      } else {
        g.fillStyle = COLOR.glyph;
        g.globalAlpha = 0.95;
        g.fillText(h.ch, Math.floor(h.x / CW) * CW, Math.floor(h.y / CH) * CH);
      }
    }

    g.globalAlpha = 1;
    g.fillStyle = COLOR.accent;
    g.fillText(mode === "dead" || deadFor > 0 ? "X" : "@", cellX(P.x) * CW, cellY(P.y) * CH);
  }

  function hud(force) {
    hudTick -= 1;
    if (!force && hudTick > 0) return;
    hudTick = 6;
    timeEl.textContent = "time " + (mode === "play" || mode === "paused" || mode === "dead" ? clock : 0).toFixed(1) + "s";
    bestEl.textContent = best > 0 ? "best " + best.toFixed(1) + "s" : "";
  }

  function showOverlay(title, hint, action) {
    hintEl.textContent = title + ". " + hint;
    startBtn.innerHTML = '<svg class="icon" width="17" height="17" aria-hidden="true"><use href="#i-play"/></svg>' + action;
    overlay.hidden = false;
  }

  function syncPause() {
    if (mode === "play") pauseBtn.textContent = "Pause";
    else pauseBtn.textContent = ambientOn ? "Pause" : "Resume";
    pauseBtn.setAttribute("aria-label", mode === "play" ? "Pause the game" : (ambientOn ? "Pause the background animation" : "Resume the background animation"));
  }

  function running() {
    if (!heroVisible) return false;
    if (mode === "play") return true;
    return mode === "attract" && ambientOn;
  }

  function loop(now) {
    raf = 0;
    var dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    if (mode === "attract" && deadFor > 0) {
      deadFor -= dt;
      if (deadFor <= 0) reset();
    } else {
      step(dt);
    }
    render();
    hud(false);
    if (running()) raf = requestAnimationFrame(loop);
  }

  function kick() {
    if (!raf && running()) {
      lastT = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }

  function start() {
    reset();
    keys = {};
    pointer = null;
    mode = "play";
    overlay.hidden = true;
    box.classList.add("is-playing");
    statusEl.textContent = "Game started. Use the arrow keys or WASD.";
    stage.focus({ preventScroll: true });
    syncPause();
    hud(true);
    kick();
  }

  function pause() {
    if (mode !== "play") return;
    mode = "paused";
    keys = {};
    pointer = null;
    box.classList.remove("is-playing");
    showOverlay("Paused", "At " + clock.toFixed(1) + "s so far", "Resume");
    syncPause();
  }

  function resume() {
    mode = "play";
    overlay.hidden = true;
    box.classList.add("is-playing");
    stage.focus({ preventScroll: true });
    syncPause();
    kick();
  }

  function die() {
    mode = "dead";
    keys = {};
    pointer = null;
    box.classList.remove("is-playing");
    var record = clock > best;
    if (record) { best = clock; saveBest(best); }
    render();
    hud(true);
    showOverlay(
      "Hit at " + clock.toFixed(1) + "s",
      record ? "New best" : "Best " + best.toFixed(1) + "s",
      "Again"
    );
    statusEl.textContent = "Hit at " + clock.toFixed(1) + " seconds." + (record ? " New best." : " Best " + best.toFixed(1) + " seconds.");
    syncPause();
  }

  function toAttract() {
    mode = "attract";
    reset();
    showOverlay("Dodge the lasers", "Arrows or WASD, or drag on a phone", "Play");
    syncPause();
    render();
    hud(true);
    kick();
  }

  startBtn.addEventListener("click", function () {
    if (mode === "paused") resume();
    else start();
  });

  // Keep focus in the arena when the pause button is clicked mid-game.
  pauseBtn.addEventListener("mousedown", function (e) { if (mode === "play") e.preventDefault(); });
  pauseBtn.addEventListener("click", function () {
    if (mode === "play") pause();
    else setAmbient(!ambientOn);
  });

  var KEYMAP = {
    ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
    ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right"
  };

  stage.addEventListener("keydown", function (e) {
    if (mode === "play") {
      if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; e.preventDefault(); }
      else if (e.code === "Escape" || e.code === "KeyP") { pause(); e.preventDefault(); }
    } else if ((e.code === "Space" || e.code === "Enter") && e.target === stage) {
      e.preventDefault();
      if (mode === "paused") resume(); else start();
    }
  });
  stage.addEventListener("keyup", function (e) {
    if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false;
  });
  // Keys only reach the game while it has focus, so losing focus pauses it.
  stage.addEventListener("focusout", function (e) {
    if (mode === "play" && !box.contains(e.relatedTarget)) pause();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause();
  });

  function local(e) {
    var r = cv.getBoundingClientRect();
    return { x: clamp(e.clientX - r.left, 0, W), y: clamp(e.clientY - r.top, 0, H) };
  }
  stage.addEventListener("pointerdown", function (e) {
    if (mode !== "play" || e.target !== cv) return;
    stage.setPointerCapture(e.pointerId);
    pointer = local(e);
    e.preventDefault();
  });
  stage.addEventListener("pointermove", function (e) {
    if (pointer && mode === "play") pointer = local(e);
  });
  ["pointerup", "pointercancel"].forEach(function (type) {
    stage.addEventListener(type, function () { pointer = null; });
  });

  ambientListeners.push(function () {
    if (!heroVisible) pause();
    syncPause();
    kick();
  });

  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth;
    H = cv.clientHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cols = Math.max(8, Math.floor(W / CW));
    rows = Math.max(6, Math.floor(H / CH));
    // Beside the text on wide screens: the box starts level with the statement.
    hero.style.setProperty("--dodge-top", statement ? statement.offsetTop + "px" : "auto");
    if (P) {
      P.x = clamp(P.x, CW / 2, W - CW / 2);
      P.y = clamp(P.y, CH / 2, H - CH / 2);
    }
    field.refresh();
  }

  size();
  toAttract();
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function () {
      size();
      if (mode !== "play") render();
    });
    ro.observe(stage);
    ro.observe(hero);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { size(); render(); });
})();
