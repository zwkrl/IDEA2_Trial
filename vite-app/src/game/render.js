// src/game/render.js
import { ingredientPool } from "./data.js";

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

export function drawLanding(ctx, canvas, titleTime) {
  const bounce = Math.sin(titleTime) * 8;

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

  /*ctx.fillStyle = "#ffe066";
  ctx.font = "bold 64px Courier New";
  ctx.fillText("FRANTIC HERITAGE COOKING", canvas.width / 2, canvas.height / 2 - 90 + bounce);*/

  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Courier New";
  ctx.fillText("Fast hands. Bold flavors. Press START GAME to begin.", canvas.width / 2, canvas.height / 2 - 30);

  ctx.fillStyle = "#d7d7d7";
  ctx.font = "18px Courier New";
  ctx.fillText("You will pick a dish with Q W E R before the timer starts.", canvas.width / 2, canvas.height / 2 + 10);

  ctx.restore();
}

export function drawHeroAlert(ctx, canvas, alertState) {
  if (alertState.ttl <= 0 || !alertState.text) return;

  const w = Math.min(980, canvas.width - 60);
  const h = 56;
  const x = (canvas.width - w) / 2;
  const y = 120;

  ctx.save();
  ctx.fillStyle = alertState.color;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.strokeRect(x, y, w, h);

  ctx.font = "bold 24px Courier New";
  ctx.textAlign = "center";
  ctx.fillStyle = "#111" ;
  ctx.fillText(alertState.text, canvas.width / 2, y + 36);
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
  ctx.fillStyle = game.stirredThisStep ? "#80ff72" : "#4cc9f0";
  ctx.fillRect(x, y, fillW, h);

  ctx.strokeStyle = "#fff";
  ctx.strokeRect(x, y, w, h);
}

export function drawPlate(ctx, canvas, game, assets) {
  if (!assets.plate) return;

  const cx = canvas.width / 2 + game.shakeOffsetX;
  const cy = canvas.height / 2 + 80 + game.shakeOffsetY;

  ctx.drawImage(assets.plate, cx - 200, cy - 130, 400, 260);

  const entries = Object.entries(game.ingCounts);
  let totalIcons = 0;
  for (const [, v] of entries) totalIcons += Math.max(0, v.done | 0);
  if (totalIcons <= 0) return;

  const maxIcons = 28;
  totalIcons = Math.min(totalIcons, maxIcons);

  const size = 120;

  let iconIndex = 0;
  for (const [ing, v] of entries) {
    const img = assets[ingredientPool[ing]?.sprite];
    if (!img) continue;

    const count = Math.min(v.done | 0, maxIcons - iconIndex);
    for (let k = 0; k < count; k++) {
      const t = iconIndex / Math.max(1, totalIcons);
      const angle = t * Math.PI * 2;

      const r1 = 85 + (iconIndex % 3) * 12;
      const r2 = 55 + ((iconIndex + 1) % 3) * 10;

      const x = Math.round(cx + Math.cos(angle) * r1 - size / 2);
      const y = Math.round(cy + Math.sin(angle) * r2 - size / 2);

      ctx.drawImage(img, x, y, size, size);

      iconIndex++;
      if (iconIndex >= totalIcons) return;
    }
  }
}

export function drawComboFlames(ctx, canvas, game) {
  if (game.combo < 3) return;
  ctx.fillStyle = "orange";
  ctx.font = "bold 40px Courier New";
  ctx.textAlign = "center";
  ctx.fillText("COMBO!", canvas.width / 2, 120);
}

export function drawDishInfo(ctx, canvas, game) {
  if (!game.currentDish) return;

  const title = `${game.currentDish.name} (${game.currentDish.culture})`;

  const haveProgress =
    game.uniqueDishesCompleted &&
    typeof game.uniqueDishesCompleted.size === "number" &&
    typeof game.dishesToWin === "number";

  const subtitle = haveProgress
    ? `Unique dishes completed: ${game.uniqueDishesCompleted.size}/${game.dishesToWin}`
    : "";

  const cx = canvas.width / 2;

  const titleY = 80;
  const subtitleY = titleY + 38;

  const bannerW = Math.min(980, canvas.width - 80);
  const bannerH = subtitle ? 92 : 76;
  const bannerX = (canvas.width - bannerW) / 2;
  const bannerY = titleY - 54;

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
}

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

export function drawScanScreen(ctx, canvas, scanState, assets) {
  if (!scanState || !scanState.ingredients || scanState.ingredients.length === 0) return;

  const ingredients = scanState.ingredients;
  const count = ingredients.length;

  const pad = 22;
  const panelW = Math.min(1200, canvas.width - 100);
  const cardW = Math.min(180, (panelW - pad * (count - 1)) / count);
  const cardH = 210;
  const startX = (canvas.width - (cardW * count + pad * (count - 1))) / 2;
  const startY = canvas.height / 2 - 170;

  ctx.save();
  ctx.textAlign = "center";

  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 36px Courier New";
  ctx.fillText("SCAN THESE INGREDIENTS", canvas.width / 2, startY - 46);

  ctx.fillStyle = "#d7d7d7";
  ctx.font = "18px Courier New";
  ctx.fillText("Type the ID and press ENTER", canvas.width / 2, startY - 16);

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
    if (img) {
      ctx.drawImage(img, x + (cardW - iconSize) / 2, y + 26, iconSize, iconSize);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Courier New";
    ctx.fillText(ing.toUpperCase(), x + cardW / 2, y + cardH - 46);

    ctx.fillStyle = "#a7c7ff";
    ctx.font = "14px Courier New";
    const label = status === "correct" ? "OK" : status === "wrong" ? "WRONG" : "ID: ____";
    ctx.fillText(label, x + cardW / 2, y + cardH - 22);
  }

  const inputY = startY + cardH + 30;
  const inputW = 360;
  const inputH = 54;
  const inputX = (canvas.width - inputW) / 2;

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(inputX, inputY, inputW, inputH);

  ctx.strokeStyle = scanState.inputColor || "rgba(255,255,255,0.35)";
  ctx.lineWidth = 3;
  ctx.strokeRect(inputX, inputY, inputW, inputH);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px Courier New";
  const inputText = scanState.input && scanState.input.length ? scanState.input : "";
  ctx.fillText(inputText, canvas.width / 2, inputY + 36);

  if (scanState.message) {
    ctx.fillStyle = scanState.messageColor || "#ffffff";
    ctx.font = "16px Courier New";
    ctx.fillText(scanState.message, canvas.width / 2, inputY + 78);
  }

  ctx.restore();
}

function drawPanel(ctx, x, y, w, h, alpha = 0.62) {
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

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

export function drawInstructions(ctx, canvas, game, helpers) {
  const {
    currentStep,
    getNeededForStep,
    getDoneForStep,
    keyLabelForIngredient
  } = helpers;

  if (!game.currentDish) return;
  const step = currentStep();
  if (!step) return;

  const panelW = Math.min(980, canvas.width - 80);
  const panelX = (canvas.width - panelW) / 2;
  const panelY = canvas.height - 190;
  const panelH = 130;

  drawPanel(ctx, panelX, panelY, panelW, panelH);

  ctx.textAlign = "left";
  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px Courier New";
  ctx.fillText(`Step ${game.stepIndex + 1}/${game.steps.length}`, panelX + 18, panelY + 28);

  ctx.font = "bold 24px Courier New";
  ctx.fillStyle = "#ffe066";
  const lines = drawWrappedText(ctx, step.label, panelX + 18, panelY + 58, panelW - 36, 28);

  ctx.font = "16px Courier New";
  ctx.fillStyle = "#d7d7d7";
  const controlsY = panelY + 58 + lines * 28 + 8;

  if (game.dishCountdown > 0) {
    ctx.fillStyle = "#fff";
    ctx.fillText(`Starting in ${game.dishCountdown}... (input locked)`, panelX + 18, controlsY);
    return;
  }

  if (step.type === "prep" || step.type === "action") {
    const show = (step.uses && step.uses.length) ? step.uses : game.sequence;
    const parts = [];

    for (const ing of show.slice(0, 4)) {
      const need = getNeededForStep(step, ing);
      const done = getDoneForStep(step, ing);
      const left = Math.max(0, need - done);
      parts.push(`${keyLabelForIngredient(ing)}=${ing.toUpperCase()} x${left}`);
    }

    ctx.fillText(`Remaining: ${parts.join("   ")}`, panelX + 18, controlsY);
  } else if (step.type === "cook") {
    ctx.fillText("Stir: HOLD SPACE in GREEN (middle 20%). Serve is next step.", panelX + 18, controlsY);
    drawCookBar(ctx, canvas, game, step, canvas.height - 250);
  } else if (step.type === "serve") {
    ctx.fillText("SERVE NOW: press ENTER", panelX + 18, controlsY);
  }
}

export function drawTitle(ctx, canvas, titleTime) {
  const bounce = Math.sin(titleTime) * 10;
  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 70px Courier New";
  ctx.textAlign = "center";
  ctx.fillText("FRANTIC HERITAGE COOKING", canvas.width / 2, canvas.height / 2 - 120 + bounce);
  ctx.font = "24px Courier New";
}

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
