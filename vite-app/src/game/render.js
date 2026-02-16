// src/game/render.js
import { ingredientPool } from "./data.js";

/* ===================== BACKGROUND ===================== */

export function drawBackground(ctx, canvas, assets) {
  if (assets.bg) {
    ctx.drawImage(assets.bg, 0, 0, canvas.width, canvas.height);
    return;
  }

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#0b0d12");
  grad.addColorStop(1, "#14253a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#1f3a5f";
  for (let i = 0; i < 10; i++) {
    const w = 120 + i * 30;
    const h = 60 + i * 20;
    ctx.fillRect(80 + i * 110, 60 + i * 22, w, h);
  }
  ctx.restore();
}

/* ===================== LANDING ===================== */

export function drawLanding(ctx, canvas, titleTime) {
  ctx.save();
  ctx.textAlign = "center";

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  const panelW = Math.min(980, canvas.width - 80);
  const panelH = 240;
  const panelX = (canvas.width - panelW) / 2;
  const panelY = canvas.height / 2 - 200;
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Courier New";
  ctx.fillText("Fast hands. Bold flavors. Press START GAME to begin.", canvas.width / 2, canvas.height / 2 - 30);

  ctx.fillStyle = "#d7d7d7";
  ctx.font = "18px Courier New";
  ctx.fillText("You will pick a dish with Q W E R before the timer starts.", canvas.width / 2, canvas.height / 2 + 10);

  ctx.restore();
}

export function drawTitle(ctx, canvas, titleTime) {
  const bounce = Math.sin(titleTime) * 10;
  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 70px Courier New";
  ctx.textAlign = "center";
  ctx.fillText("FRANTIC HERITAGE COOKING", canvas.width / 2, canvas.height / 2 - 120 + bounce);
  ctx.font = "24px Courier New";
}

/* ===================== TOP HUD STACK ===================== */

function getHudBox(canvas) {
  const w = Math.min(980, canvas.width - 80);
  const x = (canvas.width - w) / 2;
  return { x, w };
}

export function drawDishInfo(ctx, canvas, game, yTop = 18) {
  if (!game.currentDish) return 0;

  const title = `${game.currentDish.name} (${game.currentDish.culture})`;
  const subtitle =
    (game.uniqueDishesCompleted && typeof game.uniqueDishesCompleted.size === "number")
      ? `Unique dishes completed: ${game.uniqueDishesCompleted.size}/${game.dishesToWin}`
      : "";

  const { x: bannerX, w: bannerW } = getHudBox(canvas);
  const bannerH = subtitle ? 92 : 76;
  const bannerY = yTop;

  const cx = canvas.width / 2;
  const titleY = bannerY + 38;
  const subtitleY = bannerY + 74;

  ctx.save();

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(bannerX, bannerY, bannerW, bannerH);

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = "bold 44px Courier New";
  ctx.lineWidth = 6;

  ctx.shadowColor = "rgba(255, 224, 102, 0.90)";
  ctx.shadowBlur = 14;

  ctx.strokeStyle = "rgba(0,0,0,0.85)";
  ctx.strokeText(title, cx, titleY);

  ctx.fillStyle = "#ffe066";
  ctx.fillText(title, cx, titleY);

  if (subtitle) {
    ctx.shadowBlur = 0;
    ctx.font = "bold 18px Courier New";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(subtitle, cx, subtitleY);
  }

  ctx.restore();
  return bannerH;
}

export function drawHeroAlert(ctx, canvas, alertState, y = 120) {
  if (alertState.ttl <= 0 || !alertState.text) return 0;

  const { x, w } = getHudBox(canvas);
  const h = 56;

  ctx.save();
  ctx.fillStyle = alertState.color;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.strokeRect(x, y, w, h);

  ctx.font = "bold 24px Courier New";
  ctx.textAlign = "center";
  ctx.fillStyle = "#111";
  ctx.fillText(alertState.text, canvas.width / 2, y + 36);
  ctx.restore();

  return h;
}

export function drawTopStack(ctx, canvas, game, alertState) {
  const gap = 12;
  let y = 18;

  const h1 = drawDishInfo(ctx, canvas, game, y);
  if (h1 > 0) y += h1 + gap;

  const h2 = drawHeroAlert(ctx, canvas, alertState, y);
  if (h2 > 0) y += h2 + gap;

  return y;
}

/* ===================== COMBO BANNER ===================== */

export function drawComboFlames(ctx, canvas, game, y) {
  if (game.combo < 3) return 0;

  const { x, w } = getHudBox(canvas);
  const h = 44;
  const boxY = y ?? 0;

  ctx.save();
  ctx.fillStyle = "rgba(255, 140, 0, 0.78)";
  ctx.fillRect(x, boxY, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.strokeRect(x, boxY, w, h);

  ctx.font = "bold 30px Courier New";
  ctx.textAlign = "center";
  ctx.fillStyle = "#111";
  ctx.fillText("COMBO!", canvas.width / 2, boxY + 30);
  ctx.restore();

  return h;
}

/* ===================== PLATE + ADDED INGREDIENT STRIP ===================== */

export function drawPlate(ctx, canvas, game, assets, uiTopY = null) {
  if (!assets?.plate) return;

  // --- Plate image ---
  const cx = canvas.width / 2 + (game.shakeOffsetX || 0);
  const cy = canvas.height / 2 + 80 + (game.shakeOffsetY || 0);
  ctx.drawImage(assets.plate, cx - 200, cy - 130, 400, 260); // [web:12]

  // --- Draw placed ingredient icons ON the plate ---
  const placed = Array.isArray(game.plateIcons) ? game.plateIcons : [];
  if (placed.length > 0) {
    const now = performance.now();

    // plate area (rough ellipse region)
    const plateCenterX = cx;
    const plateCenterY = cy + 10;
    const rx = 130;
    const ry = 65;

    const icon = 100;

    // draw last N so it doesn't overcrowd
    const lastN = placed.slice(Math.max(0, placed.length - 14));

    for (let i = 0; i < lastN.length; i++) {
      const ing = lastN[i].ing;
      const img = assets?.[ingredientPool[ing]?.sprite];
      if (!img) continue;

      // deterministic-ish scatter (stable per index)
      const a = (i * 1.7) % (Math.PI * 2);
      const r = 0.25 + 0.65 * ((i * 37) % 100) / 100;

      const px = plateCenterX + Math.cos(a) * rx * r;
      const py = plateCenterY + Math.sin(a) * ry * r;

      // tiny pop animation for newest ones (~250ms)
      const age = Math.max(0, now - (lastN[i].t || now));
      const pop = age < 250 ? (1.15 - 0.15 * (age / 250)) : 1.0;

      const w = icon * pop;
      const h = icon * pop;

      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.drawImage(img, px - w / 2, py - h / 2, w, h); // [web:12]
      ctx.restore();
    }
  }

  // --- Build list of needed ingredients (need > 0) for the progress strip ---
  const entries = Object.entries(game.ingCounts || {});
  const rows = [];
  for (const [ing, v] of entries) {
    const need = Math.max(0, Number(v?.need) || 0);
    const done = Math.max(0, Number(v?.done) || 0);
    if (need <= 0) continue;
    rows.push({ ing, need, done });
  }
  if (rows.length === 0) return;

  // --- Align strip to hero width ---
  const hudW = Math.min(980, canvas.width - 80);
  const hudX = (canvas.width - hudW) / 2;

  const iconSize = 46;
  const gap = 14;
  const maxPerRow = 6;

  const total = rows.length;
  const cols = Math.min(maxPerRow, total);
  const rowCount = Math.ceil(total / cols);

  const stripW = cols * iconSize + (cols - 1) * gap;
  const stripH = rowCount * iconSize + (rowCount - 1) * gap;

  const startX = hudX + (hudW - stripW) / 2;
  const startY = (uiTopY != null) ? (uiTopY + 12) : (cy + 120);

  // panel
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(startX - 18, startY - 16, stripW + 36, stripH + 32);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  ctx.strokeRect(startX - 18, startY - 16, stripW + 36, stripH + 32);
  ctx.restore();

  // chips
  for (let i = 0; i < total; i++) {
    const { ing, need, done } = rows[i];
    const complete = done >= need;
    const started = done > 0;

    const r = Math.floor(i / cols);
    const c = i % cols;

    const x = startX + c * (iconSize + gap);
    const y = startY + r * (iconSize + gap);

    const img = assets?.[ingredientPool[ing]?.sprite];

    ctx.save();

    if (complete) {
      ctx.fillStyle = "rgba(128,255,114,0.18)";
      ctx.shadowColor = "rgba(128,255,114,0.55)";
      ctx.shadowBlur = 12;
    } else if (started) {
      ctx.fillStyle = "rgba(255,224,102,0.16)";
      ctx.shadowColor = "rgba(255,224,102,0.45)";
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.shadowBlur = 0;
    }

    ctx.fillRect(x - 6, y - 6, iconSize + 12, iconSize + 12);
    ctx.strokeStyle = "rgba(255,255,255,0.20)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 6, y - 6, iconSize + 12, iconSize + 12);

    ctx.shadowBlur = 0;

    if (img) ctx.drawImage(img, x, y, iconSize, iconSize); // [web:12]
    else {
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(x, y, iconSize, iconSize);
    }

    const badgeW = 44;
    const badgeH = 18;
    const bx = x + iconSize - badgeW + 8;
    const by = y - 10;

    ctx.save();
    ctx.fillStyle = complete
      ? "rgba(128,255,114,0.95)"
      : started
        ? "rgba(255,224,102,0.95)"
        : "rgba(255,255,255,0.22)";
    ctx.fillRect(bx, by, badgeW, badgeH);
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.strokeRect(bx, by, badgeW, badgeH);

    ctx.fillStyle = complete || started ? "#111" : "#fff";
    ctx.font = "bold 12px Courier New";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.min(done, need)}/${need}`, bx + badgeW / 2, by + badgeH / 2);
    ctx.restore();

    ctx.restore();
  }
}

/* ===================== DISH SELECT ===================== */

export function drawDishSelect(ctx, canvas, options, keyLabels, assets) {
  const count = Math.min(4, options.length);
  if (count === 0) return;

  const pad = 26;
  const panelW = Math.min(1400, canvas.width - 80);
  const cardW = (panelW - pad * (count - 1)) / count;
  const cardH = 320;
  const startX = (canvas.width - panelW) / 2;
  const startY = canvas.height / 2 - 120;

  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 36px Courier New";
  ctx.fillText("CHOOSE YOUR DISH", canvas.width / 2, startY - 46);

  ctx.fillStyle = "#d7d7d7";
  ctx.font = "18px Courier New";
  ctx.fillText("Press Q W E R", canvas.width / 2, startY - 16);

  for (let i = 0; i < count; i++) {
    const dish = options[i];
    const x = startX + i * (cardW + pad);
    const y = startY;

    drawPanel(ctx, x, y, cardW, cardH, 0.7);

    ctx.fillStyle = "#ffe066";
    ctx.font = "bold 22px Courier New";
    ctx.fillText(`${keyLabels[i]}`, x + cardW / 2, y + 34);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Courier New";
    ctx.fillText(dish.name, x + cardW / 2, y + 80);

    ctx.fillStyle = "#d7d7d7";
    ctx.font = "16px Courier New";
    ctx.fillText(dish.culture, x + cardW / 2, y + 108);

    const iconSize = 60;
    const iconPad = 10;
    const rowY = y + 140;
    const totalIcons = Math.min(4, dish.ingredients.length);
    const iconsW = totalIcons * iconSize + (totalIcons - 1) * iconPad;
    let iconX = x + (cardW - iconsW) / 2;

    for (let k = 0; k < totalIcons; k++) {
      const ing = dish.ingredients[k];
      const img = assets[ingredientPool[ing]?.sprite];
      if (img) ctx.drawImage(img, iconX, rowY, iconSize, iconSize);
      iconX += iconSize + iconPad;
    }

    ctx.fillStyle = "#a7c7ff";
    ctx.font = "14px Courier New";
    ctx.fillText("Pick to start cooking", x + cardW / 2, y + cardH - 28);
  }

  ctx.restore();
}

/* ===================== SCAN SCREEN ===================== */

export function drawScanScreen(ctx, canvas, scanState, assets) {
  if (!scanState || !scanState.ingredients || scanState.ingredients.length === 0) return;

  const ingredients = scanState.ingredients;
  const count = ingredients.length;

  const pad = 22;
  const panelW = Math.min(1200, canvas.width - 100);
  const cardW = Math.min(180, (panelW - pad * (count - 1)) / count);
  const cardH = 210;
  const startX = (canvas.width - (cardW * count + pad * (count - 1))) / 2;
  const startY = canvas.height / 2 - cardH / 2 - 20;

  ctx.save();
  ctx.textAlign = "center";

  // Title panel (same color as cards)
  const titlePanelW = Math.min(680, canvas.width - 120);
  const titlePanelH = 60;
  const titlePanelX = (canvas.width - titlePanelW) / 2;
  const titlePanelY = startY - 84;
  drawPanel(ctx, titlePanelX, titlePanelY, titlePanelW, titlePanelH, 0.68);

  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 36px Courier New";
  ctx.fillText("SCAN THESE INGREDIENTS", canvas.width / 2, titlePanelY + 40);

  for (let i = 0; i < count; i++) {
    const ing = ingredients[i];
    const x = startX + i * (cardW + pad);
    const y = startY;

    const status = scanState.statusByIng?.[ing] || "pending";
    const strokeColor = status === "correct"
      ? "rgba(128, 255, 114, 0.95)"
      : status === "wrong"
        ? "rgba(255, 89, 94, 0.95)"
        : "rgba(255,255,255,0.22)";

    drawPanel(ctx, x, y, cardW, cardH, 0.68);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 3, y + 3, cardW - 6, cardH - 6);

    const iconSize = Math.min(90, cardW - 40);
    const img = assets[ingredientPool[ing]?.sprite];
    if (img) ctx.drawImage(img, x + (cardW - iconSize) / 2, y + 26, iconSize, iconSize);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Courier New";
    ctx.fillText(ing.toUpperCase(), x + cardW / 2, y + cardH - 46);

    ctx.fillStyle = "#a7c7ff";
    ctx.font = "14px Courier New";
    const label = status === "correct" ? "OK" : status === "wrong" ? "WRONG" : " ";
    ctx.fillText(label, x + cardW / 2, y + cardH - 22);
  }

  ctx.restore();
}

/* ===================== INSTRUCTIONS ===================== */

function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width <= maxWidth) line = test;
    else { if (line) lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const lines = wrapLines(ctx, text, maxWidth);
  lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lineHeight));
  return lines.length;
}

function drawPanel(ctx, x, y, w, h, alpha = 0.62) {
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

export function drawCookBar(ctx, canvas, game, step, y = canvas.height - 260) {
  const w = Math.min(760, canvas.width - 80);
  const h = 20;
  const x = (canvas.width - w) / 2;

  const p = Math.max(0, Math.min(1.15, game.stepProgress));
  ctx.fillStyle = "#222";
  ctx.fillRect(x, y, w, h);

  const clamp = (v) => Math.max(0, Math.min(1.15, v));
  const win = step.stirPerfectWindow;

  if (win) {
    const sx0 = x + clamp(win[0]) * w;
    const sx1 = x + clamp(win[1]) * w;
    ctx.fillStyle = "rgba(128,255,114,0.28)";
    ctx.fillRect(sx0, y, Math.max(2, sx1 - sx0), h);
  }

  const fillW = Math.min(1.0, p) * w;
  ctx.fillStyle = "#4cc9f0";
  ctx.fillRect(x, y, fillW, h);

  ctx.strokeStyle = "#fff";
  ctx.strokeRect(x, y, w, h);
}

export function drawInstructions(ctx, canvas, game, helpers) {
  const {
    currentStep,
    getNeededForStep,
    getDoneForStep,
    keyLabelForIngredient,
    assets
  } = helpers;

  if (!game.currentDish) return;
  const step = currentStep();
  if (!step) return;

  const panelW = Math.min(980, canvas.width - 80);
  const panelX = (canvas.width - panelW) / 2;
  const panelY = canvas.height - 220;
  const panelH = 170;

  drawPanel(ctx, panelX, panelY, panelW, panelH);

  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Header
  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px Courier New";
  ctx.fillText(`Step ${game.stepIndex + 1}/${game.steps.length}`, panelX + 18, panelY + 28);

  // Label
  ctx.font = "bold 24px Courier New";
  ctx.fillStyle = "#ffe066";
  const labelLines = drawWrappedText(ctx, step.label, panelX + 18, panelY + 58, panelW - 36, 28);
  const controlsY = panelY + 58 + labelLines * 28 + 8;

  // Countdown lock
  if (game.dishCountdown > 0) {
    ctx.fillStyle = "#fff";
    ctx.font = "16px Courier New";
    ctx.fillText(`Starting in ${game.dishCountdown}... (input locked)`, panelX + 18, controlsY);
    ctx.restore();
    return;
  }

  const drawIngredientKeyIcons = (step, y) => {
    const show = (step.uses && step.uses.length) ? step.uses : game.sequence;
    const items = show.slice(0, 4);
    if (items.length === 0) return;

    const iconSize = 46;
    const gap = 14;
    const totalW = items.length * iconSize + (items.length - 1) * gap;
    const startX = (canvas.width - totalW) / 2;

    for (let i = 0; i < items.length; i++) {
      const ing = items[i];
      const img = assets?.[ingredientPool[ing]?.sprite];

      const need = getNeededForStep(step, ing);
      const done = getDoneForStep(step, ing);
      const left = Math.max(0, need - done);

      const x = startX + i * (iconSize + gap);

      ctx.save();

      ctx.fillStyle = left === 0 ? "rgba(128,255,114,0.18)" : "rgba(255,255,255,0.10)";
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 2;
      ctx.fillRect(x - 6, y - 6, iconSize + 12, iconSize + 12);
      ctx.strokeRect(x - 6, y - 6, iconSize + 12, iconSize + 12);

      if (img) ctx.drawImage(img, x, y, iconSize, iconSize);
      else {
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(x, y, iconSize, iconSize);
      }

      // Key badge (top-left)
      const key = keyLabelForIngredient(ing);
      ctx.fillStyle = "rgba(255,224,102,0.95)";
      ctx.fillRect(x - 6, y - 6, 20, 18);
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.strokeRect(x - 6, y - 6, 20, 18);

      ctx.fillStyle = "#111";
      ctx.font = "bold 12px Courier New";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(key || "?"), x - 6 + 10, y - 6 + 9);

      // Remaining badge (top-right): xN
      const rw = 26;
      const rh = 18;
      ctx.fillStyle = left === 0 ? "rgba(128,255,114,0.95)" : "rgba(255,255,255,0.22)";
      ctx.fillRect(x + iconSize - rw + 6, y - 6, rw, rh);
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.strokeRect(x + iconSize - rw + 6, y - 6, rw, rh);

      ctx.fillStyle = left === 0 ? "#111" : "#fff";
      ctx.font = "bold 12px Courier New";
      ctx.fillText(`x${left}`, x + iconSize - rw / 2 + 6, y - 6 + rh / 2);

      ctx.restore();
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  };

  const drawCookComboIcons = (y) => {
    const seq = Array.isArray(game.cookSeq) ? game.cookSeq : [];
    if (seq.length === 0) return;

    const labels = { KeyQ: "Q", KeyW: "W", KeyE: "E", KeyR: "R" };

    const size = 44;
    const gap = 12;
    const totalW = seq.length * size + (seq.length - 1) * gap;
    const startX = (canvas.width - totalW) / 2;

    for (let i = 0; i < seq.length; i++) {
      const code = seq[i];
      const ch = labels[code] || "?";

      const done = !!game.cookIconsDone?.[i];
      const isNext = i === (game.cookSeqIndex | 0);

      let jx = 0, jy = 0;
      const jt = game.cookIconJitter?.[i] || 0;
      if (jt > 0) {
        jx = (Math.random() - 0.5) * 6;
        jy = (Math.random() - 0.5) * 6;
      }

      const x = startX + i * (size + gap) + jx;
      const by = y + jy;

      ctx.save();

      if (done) {
        ctx.fillStyle = "rgba(128,255,114,0.85)";
        ctx.shadowColor = "rgba(128,255,114,0.95)";
        ctx.shadowBlur = 14;
      } else if (isNext) {
        ctx.fillStyle = "rgba(255,224,102,0.92)";
        ctx.shadowColor = "rgba(255,224,102,0.95)";
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(x, by, size, size);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.strokeRect(x, by, size, size);

      ctx.shadowBlur = 0;
      ctx.fillStyle = done || isNext ? "#111" : "#fff";
      ctx.font = "bold 22px Courier New";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ch, x + size / 2, by + size / 2);

      ctx.restore();
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  };

  if (step.type === "prep" || step.type === "action") {
    ctx.fillStyle = "#d7d7d7";
    ctx.font = "16px Courier New";
    ctx.fillText(`ADD INGREDIENTS (QWER only): press the key shown on each icon.`, panelX + 18, controlsY);
    drawIngredientKeyIcons(step, controlsY + 18);
  } else if (step.type === "cook") {
    ctx.fillStyle = "#d7d7d7";
    ctx.font = "16px Courier New";
    ctx.fillText(`COOK (QWER only): hit the lit keys in order.`, panelX + 18, controlsY);

    const iconsY = controlsY + 18;
    drawCookComboIcons(iconsY);

    ctx.fillStyle = "#a7c7ff";
    ctx.font = "14px Courier New";
    ctx.fillText(`Sequences: ${game.cookCombosDone}/${game.cookCombosNeed}`, panelX + 18, iconsY + 58);

    drawCookBar(ctx, canvas, game, step, canvas.height - 250);
  } else if (step.type === "serve") {
    ctx.fillStyle = "#d7d7d7";
    ctx.font = "16px Courier New";
    ctx.fillText(`SERVE (QWER only): press W`, panelX + 18, controlsY);
  }

  ctx.restore();
}

/* ===================== END SCREENS ===================== */

export function drawGameOver(ctx, canvas) {
  ctx.fillStyle = "#fff";
  ctx.font = "bold 60px Courier New";
  ctx.textAlign = "center";
  ctx.fillText("TIME UP!", canvas.width / 2, canvas.height / 2);
}

export function drawWin(ctx, canvas) {
  ctx.fillStyle = "#fff";
  ctx.font = "bold 60px Courier New";
  ctx.textAlign = "center";
  ctx.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "24px Courier New";
  ctx.fillText("All unique dishes completed", canvas.width / 2, canvas.height / 2 + 30);
}
