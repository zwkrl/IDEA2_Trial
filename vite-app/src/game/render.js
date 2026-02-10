// src/game/render.js
import { ingredientPool } from "./data.js";

export function drawBackground(ctx, canvas, assets) {
  if (assets.bg) ctx.drawImage(assets.bg, 0, 0, canvas.width, canvas.height);
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
  ctx.fillStyle = "#111";
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
