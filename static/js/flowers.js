/**
 * FlowerAnimation — Canvas-based lily of the valley (конвалія) animation module.
 *
 * Usage:
 *   FlowerAnimation.init('flowersCanvas');
 *   FlowerAnimation.start();
 *
 * Callbacks:
 *   FlowerAnimation.onGrowthComplete = () => { ... };
 */
const FlowerAnimation = (() => {
  /* ── colour palette ───────────────────────────────────────── */
  const C = {
    leafGreen:    '#7FB069',
    leafDark:     '#5C8A4D',
    stem:         '#6B9E5A',
    bellWhite:    '#FFFEF2',
    bellShadow:   '#E8E5D0',
    droplet:      'rgba(173, 216, 230, 0.7)',
    petal:        'rgba(255, 254, 242, 0.8)',
    bgFlowers:    ['#FFCDB2', '#FFB4A2', '#E8D5E3', '#B5EAD7', '#FFDAB9'],
  };

  /* ── state ────────────────────────────────────────────────── */
  let canvas, ctx;
  let W, H;
  let animId = null;
  let startTime = null;
  let growthDone = false;
  const GROWTH_MS = 3000;

  let plants = [];
  let droplets = [];
  let petals = [];
  let bgFlowers = [];

  let api = {};
  api.onGrowthComplete = null;

  /* ── helpers ──────────────────────────────────────────────── */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
  function randInt(lo, hi) { return Math.floor(rand(lo, hi + 1)); }
  function hexToRgb(hex) {
    const v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  /* ── plant data generation ────────────────────────────────── */
  function createPlants() {
    plants = [];
    const bushCount = W < 400 ? 2 : (W < 800 ? 4 : 6);
    const spacing = W / (bushCount + 1);

    for (let i = 0; i < bushCount; i++) {
      let bushBaseX;
      if (bushCount === 2) {
        bushBaseX = i === 0 ? W * 0.15 + rand(-10, 10) : W * 0.85 + rand(-10, 10);
      } else {
        bushBaseX = spacing * (i + 1) + rand(-spacing * 0.2, spacing * 0.2);
      }
      const bushBaseY = H;
      
      const stemCount = randInt(2, 4);
      for (let s = 0; s < stemCount; s++) {
        const baseX = bushBaseX + rand(-40, 40);
        const baseY = bushBaseY;
        const plantH = H * rand(0.45, 0.65) * (0.85 + s * 0.1);
        const swayPhase = rand(0, Math.PI * 2);
        const swaySpeed = rand(0.2, 0.4);
        const swayAmp = rand(2, 5);

        /* stem curve control points (arching to one side) */
        const archDir = Math.random() < 0.5 ? -1 : 1;
        const stemTopX = baseX + archDir * rand(15, 40);
        const stemTopY = baseY - plantH;
        const stemCp1 = { x: baseX + archDir * rand(5, 15), y: baseY - plantH * 0.4 };
        const stemCp2 = { x: stemTopX + archDir * rand(10, 30), y: baseY - plantH * 0.75 };

        /* leaves (2-3) */
        const leafCount = randInt(2, 3);
        const leaves = [];
        for (let l = 0; l < leafCount; l++) {
          const side = l === 0 ? -1 : (l === 1 ? 1 : (Math.random() < 0.5 ? -1 : 1));
          const leafLen = plantH * rand(0.55, 0.75);
          const leafWidth = leafLen * rand(0.13, 0.18);
          const leafAngle = side * rand(0.25, 0.55);
          const leafCurve = side * rand(0.1, 0.3);
          leaves.push({ side, len: leafLen, width: leafWidth, angle: leafAngle, curve: leafCurve });
        }

        /* branches (6-9) along the upper stem, each with 2-3 flowers */
        const branchCount = randInt(6, 9);
        const branches = [];
        for (let b = 0; b < branchCount; b++) {
          const t = 0.2 + (b / branchCount) * 0.7;          // position along stem
          const side = (b % 2 === 0) ? -1 : 1;              // alternate sides
          const branchLen = rand(30, 55) * (H / 600);       // branch length
          const sideSpread = side * rand(0.6, 1.4);         // how far sideways
          const downCurve = rand(0.5, 1.2);                 // how much it curves down
          const delayFrac = 0.5 + (b / branchCount) * 0.45;

          /* 2-3 flowers per branch at different positions for more spacing */
          const flowerCount = randInt(2, 3);
          const flowers = [];
          for (let f = 0; f < flowerCount; f++) {
            const posOnBranch = 0.35 + (f / flowerCount) * 0.6 + rand(-0.02, 0.02);
            const flowerSize = rand(8, 16) * (H / 600);     // varying sizes
            const hangAngle = rand(0.2, 1.0);                // hang downward
            flowers.push({ posOnBranch, size: flowerSize, hangAngle });
          }

          branches.push({ t, side, branchLen, sideSpread, downCurve, delayFrac, flowers });
        }

        plants.push({
          baseX, baseY, plantH,
          stemTopX, stemTopY, stemCp1, stemCp2, archDir,
          leaves, branches,
          swayPhase, swaySpeed, swayAmp,
        });
      }
    }
  }

  /* ── background flowers ───────────────────────────────────── */
  function createBgFlowers() {
    bgFlowers = [];
    const count = Math.max(15, Math.min(25, Math.round(W * H / 25000)));
    for (let i = 0; i < count; i++) {
      bgFlowers.push({
        x: rand(0, W),
        y: rand(H * 0.05, H * 0.95),
        r: rand(3, 7) * (H / 600),
        color: C.bgFlowers[i % C.bgFlowers.length],
        phase: rand(0, Math.PI * 2),
        speed: rand(0.3, 0.7),
        bobAmp: rand(2, 5),
        opacity: rand(0.25, 0.5),
        rotation: rand(0, Math.PI * 2),
        rotSpeed: rand(-0.2, 0.2),
      });
    }
  }

  /* ── point on cubic bezier ────────────────────────────────── */
  function bezierPt(p0, p1, p2, p3, t) {
    const it = 1 - t;
    return {
      x: it*it*it*p0.x + 3*it*it*t*p1.x + 3*it*t*t*p2.x + t*t*t*p3.x,
      y: it*it*it*p0.y + 3*it*it*t*p1.y + 3*it*t*t*p2.y + t*t*t*p3.y,
    };
  }
  function bezierTangent(p0, p1, p2, p3, t) {
    const it = 1 - t;
    return {
      x: 3*it*it*(p1.x-p0.x) + 6*it*t*(p2.x-p1.x) + 3*t*t*(p3.x-p2.x),
      y: 3*it*it*(p1.y-p0.y) + 6*it*t*(p2.y-p1.y) + 3*t*t*(p3.y-p2.y),
    };
  }

  /* ── draw leaf ────────────────────────────────────────────── */
  function drawLeaf(x, y, leaf, growth, sway) {
    const g = Math.min(1, growth * 1.3);            // leaves grow a bit faster
    if (g <= 0) return;
    const len = leaf.len * easeOut(g);
    const w = leaf.width * easeOut(g);
    const angle = leaf.angle + sway * 0.04;
    const curve = leaf.curve;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    /* leaf shape via bezier */
    const tipX = Math.sin(curve) * len * 0.3;
    const tipY = -len;
    const cp1L = { x: -w, y: -len * 0.35 };
    const cp2L = { x: tipX - w * 0.5, y: -len * 0.75 };
    const cp1R = { x: w, y: -len * 0.35 };
    const cp2R = { x: tipX + w * 0.5, y: -len * 0.75 };

    /* gradient fill */
    const grad = ctx.createLinearGradient(0, 0, tipX, tipY);
    grad.addColorStop(0, C.leafDark);
    grad.addColorStop(0.4, C.leafGreen);
    grad.addColorStop(1, C.leafDark);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(cp1L.x, cp1L.y, cp2L.x, cp2L.y, tipX, tipY);
    ctx.bezierCurveTo(cp2R.x, cp2R.y, cp1R.x, cp1R.y, 0, 0);
    ctx.fillStyle = grad;
    ctx.fill();

    /* central vein */
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(tipX * 0.5, -len * 0.5, tipX, tipY);
    ctx.strokeStyle = C.leafDark;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    ctx.stroke();

    /* side veins */
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 0.6;
    const veinCount = 5;
    for (let v = 1; v <= veinCount; v++) {
      const vt = v / (veinCount + 1);
      const vx = tipX * vt * 0.5;
      const vy = -len * vt;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.lineTo(vx - w * 0.6 * (1 - vt), vy - len * 0.06);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.lineTo(vx + w * 0.6 * (1 - vt), vy - len * 0.06);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    /* return leaf tip in world coords for droplets */
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return { x: x + tipX * cosA - tipY * sinA, y: y + tipX * sinA + tipY * cosA };
  }

  let cachedBellCanvas = null;

  function initCachedBell() {
    cachedBellCanvas = document.createElement('canvas');
    const s = 40; // render at a large fixed size
    const bw = s * 1.0;
    const bh = s * 1.3;
    const pad = s * 0.5; // padding for bezier and shadows
    cachedBellCanvas.width = bw * 2 + pad * 2;
    cachedBellCanvas.height = bh * 1.2 + pad * 2;
    const ctxC = cachedBellCanvas.getContext('2d');
    
    const cx = bw + pad;
    const cy = pad;

    ctxC.translate(cx, cy);

    /* gradient for bell */
    const grad = ctxC.createRadialGradient(0, s * 0.3, s * 0.1, 0, s * 0.3, bw * 1.1);
    grad.addColorStop(0, C.bellWhite);
    grad.addColorStop(0.6, C.bellWhite);
    grad.addColorStop(1, C.bellShadow);

    ctxC.beginPath();
    ctxC.moveTo(-bw * 0.2, 0);
    ctxC.bezierCurveTo(-bw * 0.25, bh * 0.25, -bw * 0.7, bh * 0.5, -bw * 0.6, bh * 0.85);
    const scallops = 6;
    for (let sc = 0; sc < scallops; sc++) {
      const fromX = lerp(-bw * 0.6, bw * 0.6, sc / scallops);
      const toX = lerp(-bw * 0.6, bw * 0.6, (sc + 1) / scallops);
      const midX = (fromX + toX) / 2;
      const dip = bh + Math.sin((sc + 0.5) / scallops * Math.PI) * s * 0.12;
      ctxC.quadraticCurveTo(midX, dip + s * 0.08, toX, bh * 0.85 + Math.sin((sc + 1) / scallops * Math.PI) * s * 0.04);
    }
    ctxC.bezierCurveTo(bw * 0.7, bh * 0.5, bw * 0.25, bh * 0.25, bw * 0.2, 0);
    ctxC.closePath();
    ctxC.fillStyle = grad;
    ctxC.fill();

    ctxC.strokeStyle = C.bellShadow;
    ctxC.lineWidth = 0.6;
    ctxC.stroke();

    ctxC.beginPath();
    ctxC.ellipse(0, bh * 0.12, bw * 0.15, bh * 0.15, 0, 0, Math.PI * 2);
    ctxC.fillStyle = 'rgba(232, 229, 208, 0.2)';
    ctxC.fill();

    ctxC.beginPath();
    ctxC.ellipse(-bw * 0.2, bh * 0.4, bw * 0.1, bh * 0.25, -0.2, 0, Math.PI * 2);
    ctxC.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctxC.fill();
  }

  /* ── draw bell flower (bigger, with proper shape) ─────────── */
  function drawBell(cx, cy, size, angle, bellGrowth) {
    if (bellGrowth <= 0) return;
    const s = size * easeOut(bellGrowth);

    if (!cachedBellCanvas) initCachedBell();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const scale = s / 40;
    const bw = 40 * 1.0;
    const pad = 40 * 0.5;
    
    const cw = cachedBellCanvas.width * scale;
    const ch = cachedBellCanvas.height * scale;
    
    // offset so the attachment point is at 0,0
    ctx.drawImage(cachedBellCanvas, -(bw + pad) * scale, -pad * scale, cw, ch);
    ctx.restore();
  }

  /* ── draw smooth branch curving downward ────────────────── */
  /* Returns an array of {x, y} for points along the branch at given t values */
  function drawBranchCurve(fromX, fromY, branch, growth, sway) {
    if (growth <= 0) return null;
    const g = easeOut(growth);

    /* branch curves to the side and downward */
    const sideways = branch.sideSpread * branch.branchLen * g;
    const downward = branch.downCurve * branch.branchLen * g;

    const endX = fromX + sideways + sway * 0.15;
    const endY = fromY + downward;

    /* control point: offset to create a smooth arc */
    const cpX = fromX + sideways * 0.6 + sway * 0.1;
    const cpY = fromY + downward * 0.25;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.quadraticCurveTo(cpX, cpY, endX, endY);
    ctx.strokeStyle = C.stem;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.stroke();

    /* return function to get point along the branch curve */
    return function(t) {
      const it = 1 - t;
      return {
        x: it * it * fromX + 2 * it * t * cpX + t * t * endX,
        y: it * it * fromY + 2 * it * t * cpY + t * t * endY,
      };
    };
  }

  /* ── draw stem ────────────────────────────────────────────── */
  function drawStem(plant, growth, sway) {
    const g = easeOut(Math.min(1, growth * 1.1));
    if (g <= 0) return;
    const p0 = { x: plant.baseX + sway, y: plant.baseY };
    const p1 = { x: plant.stemCp1.x + sway, y: lerp(plant.baseY, plant.stemCp1.y, g) };
    const p2 = { x: plant.stemCp2.x + sway * 1.1, y: lerp(plant.baseY, plant.stemCp2.y, g) };
    const p3 = { x: plant.stemTopX + sway * 1.2, y: lerp(plant.baseY, plant.stemTopY, g) };

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    ctx.strokeStyle = C.stem;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.stroke();

    return { p0, p1, p2, p3 };
  }

  /* ── particle: water droplets ─────────────────────────────── */
  function spawnDroplet(x, y) {
    droplets.push({
      x, y,
      vx: rand(-0.3, 0.3),
      vy: 0,
      r: rand(1.5, 3.5),
      life: 1,
      decay: rand(0.004, 0.008),
    });
  }
  function updateDroplets(dt) {
    for (let i = droplets.length - 1; i >= 0; i--) {
      const d = droplets[i];
      d.vy += 0.07;              // gravity
      d.vx += Math.sin(Date.now() * 0.001) * 0.01;  // wind drift
      d.x += d.vx;
      d.y += d.vy;
      d.life -= d.decay;
      if (d.life <= 0 || d.y > H + 10) droplets.splice(i, 1);
    }
  }
  function drawDroplets() {
    for (const d of droplets) {
      ctx.save();
      ctx.globalAlpha = d.life * 0.7;
      const grad = ctx.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.3, 0, d.x, d.y, d.r);
      grad.addColorStop(0, 'rgba(220, 240, 255, 0.9)');
      grad.addColorStop(1, C.droplet);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
  }

  /* ── particle: petals ─────────────────────────────────────── */
  function spawnPetal(x, y) {
    petals.push({
      x, y,
      vx: rand(-0.5, 0.5),
      vy: rand(0.2, 0.6),
      r: rand(2, 4.5),
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.02, 0.02),
      swayPhase: rand(0, Math.PI * 2),
      life: 1,
      decay: rand(0.002, 0.005),
    });
  }
  function updatePetals(dt) {
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      p.vy += 0.005;
      p.x += p.vx + Math.sin(p.swayPhase + Date.now() * 0.0008) * 0.4;
      p.y += p.vy;
      p.rot += p.rotSpeed;
      p.life -= p.decay;
      if (p.life <= 0 || p.y > H + 10) petals.splice(i, 1);
    }
  }
  function drawPetals() {
    for (const p of petals) {
      ctx.save();
      ctx.globalAlpha = p.life * 0.8;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.petal;
      ctx.fill();
      ctx.restore();
    }
  }

  /* ── background flowers ───────────────────────────────────── */
  function drawBgFlowers(time) {
    for (const f of bgFlowers) {
      const bx = f.x + Math.sin(f.phase + time * f.speed) * f.bobAmp;
      const by = f.y + Math.cos(f.phase + time * f.speed * 0.7) * f.bobAmp * 0.6;
      ctx.save();
      ctx.globalAlpha = f.opacity;
      ctx.translate(bx, by);
      ctx.rotate(f.rotation + time * f.rotSpeed);

      /* 5 petals */
      ctx.fillStyle = f.color;
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(
          Math.cos(a) * f.r * 0.7,
          Math.sin(a) * f.r * 0.7,
          f.r * 0.55, f.r * 0.3,
          a, 0, Math.PI * 2
        );
        ctx.fill();
      }
      /* center dot */
      ctx.beginPath();
      ctx.arc(0, 0, f.r * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,220,0.7)';
      ctx.fill();

      ctx.restore();
    }
  }

  /* ── droplet / petal spawn timers ─────────────────────────── */
  let lastDropletTime = 0;
  let lastPetalTime = 0;

  function trySpawnParticles(time, now) {
    if (!growthDone) return;
    /* ~1-2 droplets per second */
    if (now - lastDropletTime > rand(500, 1000)) {
      const plant = plants[randInt(0, plants.length - 1)];
      if (plant._leafTips && plant._leafTips.length) {
        const tip = plant._leafTips[randInt(0, plant._leafTips.length - 1)];
        if (tip) spawnDroplet(tip.x, tip.y);
      }
      lastDropletTime = now;
    }
    /* ~1 petal every 2-3 seconds */
    if (now - lastPetalTime > rand(2000, 3000)) {
      const plant = plants[randInt(0, plants.length - 1)];
      if (plant._bellPositions && plant._bellPositions.length) {
        const bp = plant._bellPositions[randInt(0, plant._bellPositions.length - 1)];
        if (bp) spawnPetal(bp.x, bp.y);
      }
      lastPetalTime = now;
    }
  }

  /* ── main draw ────────────────────────────────────────────── */
  function draw(timestamp) {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const growth = Math.min(1, elapsed / GROWTH_MS);      // 0 → 1 over 3 s
    const timeSec = elapsed / 1000;
    const now = Date.now();

    ctx.clearRect(0, 0, W, H);

    /* background flowers (behind plants) */
    drawBgFlowers(timeSec);

    /* each plant */
    for (const plant of plants) {
      const sway = Math.sin(timeSec * plant.swaySpeed + plant.swayPhase) * plant.swayAmp * (growthDone ? 1 : growth);

      /* draw leaves first (they sit at the base) */
      plant._leafTips = [];
      for (const leaf of plant.leaves) {
        const tip = drawLeaf(plant.baseX + sway * 0.3, plant.baseY, leaf, growth, sway);
        if (tip) plant._leafTips.push(tip);
      }

      /* draw stem */
      const stemPts = drawStem(plant, growth, sway);

      /* draw branches with multiple flowers */
      plant._bellPositions = [];
      if (stemPts) {
        for (const branch of plant.branches) {
          const brGrowth = Math.max(0, (growth - branch.delayFrac) / (1 - branch.delayFrac));
          if (brGrowth <= 0) continue;

          /* point on main stem where branch starts */
          const pt = bezierPt(stemPts.p0, stemPts.p1, stemPts.p2, stemPts.p3, branch.t);

          /* draw the smooth branch curve */
          const getPoint = drawBranchCurve(pt.x, pt.y, branch, brGrowth, sway);
          if (!getPoint) continue;

          /* draw 2-4 flowers along the branch */
          for (const flower of branch.flowers) {
            const fGrowth = Math.max(0, (brGrowth - flower.posOnBranch * 0.3) / (1 - flower.posOnBranch * 0.3));
            if (fGrowth <= 0) continue;

            const fp = getPoint(flower.posOnBranch * easeOut(brGrowth));
            /* flowers hang downward from the branch point */
            const bellAngle = flower.hangAngle * branch.side * 0.5
              + Math.sin(timeSec * 1.3 + branch.t * 4 + flower.posOnBranch * 3) * 0.06;
            drawBell(fp.x, fp.y, flower.size, bellAngle, fGrowth);
            plant._bellPositions.push({ x: fp.x, y: fp.y });
          }
        }
      }
    }

    /* particles */
    trySpawnParticles(timeSec, now);
    updateDroplets(timeSec);
    updatePetals(timeSec);
    drawDroplets();
    drawPetals();

    /* growth complete callback */
    if (!growthDone && growth >= 1) {
      growthDone = true;
      if (typeof api.onGrowthComplete === 'function') {
        api.onGrowthComplete();
      }
    }

    animId = requestAnimationFrame(draw);
  }

  /* ── sizing ───────────────────────────────────────────────── */
  function fitCanvas() {
    const parent = canvas.parentElement || document.body;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    W = rect.width;
    H = rect.height;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ── public API ───────────────────────────────────────────── */
  api.init = function (canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) throw new Error('FlowerAnimation: canvas #' + canvasId + ' not found');
    ctx = canvas.getContext('2d');
    fitCanvas();
    createPlants();
    createBgFlowers();
  };

  api.start = function () {
    startTime = null;
    growthDone = false;
    droplets = [];
    petals = [];
    lastDropletTime = Date.now();
    lastPetalTime = Date.now();
    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(draw);
  };

  api.stop = function () {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  };

  api.resize = function () {
    fitCanvas();
    createPlants();
    createBgFlowers();
    /* reset growth so the new layout plays the intro again — optional */
    startTime = null;
    growthDone = false;
    droplets = [];
    petals = [];
  };

  return api;
})();
