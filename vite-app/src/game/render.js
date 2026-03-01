// src/game/render.js
import { ingredientPool } from "./data.js";

const KEY_TO_BUTTON_ASSET = {
  Q: "btn_q",
  W: "btn_w",
  E: "btn_e",
  R: "btn_r"
};

const CODE_TO_LABEL = {
  KeyQ: "Q",
  KeyW: "W",
  KeyE: "E",
  KeyR: "R"
};

function slugifyDishName(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function drawImageContain(ctx, img, x, y, w, h) {
  if (!img) return;
  const iw = Math.max(1, Number(img.width || 1));
  const ih = Math.max(1, Number(img.height || 1));
  const scale = Math.min(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawButtonIcon(ctx, assets, label, x, y, size, { glow = false } = {}) {
  const key = String(label || "").toUpperCase();
  const img = assets?.[KEY_TO_BUTTON_ASSET[key]];

  ctx.save();
  if (img) {
    if (glow) {
      ctx.shadowColor = "rgba(255,224,102,0.9)";
      ctx.shadowBlur = 12;
    }
    ctx.drawImage(img, x, y, size, size);
  } else {
    ctx.fillStyle = glow ? "rgba(255,224,102,0.92)" : "rgba(255,255,255,0.18)";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.strokeRect(x, y, size, size);
    ctx.fillStyle = glow ? "#111" : "#fff";
    ctx.font = `bold ${Math.max(14, Math.floor(size * 0.45))}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(key || "?", x + size / 2, y + size / 2);
  }
  ctx.restore();
}

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

export function drawLanding(ctx, canvas, titleTime, assets = {}, game = {}) {
  ctx.save();
  ctx.textAlign = "left";

  const logo = assets?.main_logo || assets?.["main-logo"];
  if (logo) {
    const bounce = Math.sin(titleTime) * 6;
    const maxW = Math.min(980, canvas.width - 80);
    const ratio = logo.height > 0 ? (logo.width / logo.height) : 2.4;
    const drawW = maxW;
    const drawH = drawW / Math.max(0.1, ratio);
    const x = (canvas.width - drawW) / 2;
    const y = Math.max(20, canvas.height * 0.16 + bounce);
    ctx.drawImage(logo, x, y, drawW, drawH);
  }

  const panelW = Math.min(420, canvas.width - 36);
  const panelH = Math.min(250, canvas.height - 36);
  const panelX = canvas.width - panelW - 18;
  const panelY = canvas.height - panelH - 18;

  ctx.fillStyle = "rgba(0,0,0,0.58)";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = "#a7c7ff";
  ctx.font = "bold 20px Courier New";
  ctx.fillText("LEADERBOARD", panelX + 16, panelY + 32);

  const rows = (Array.isArray(game.leaderboard) ? game.leaderboard : [])
    .slice()
    .sort((a, b) => (Number(b?.score || 0) - Number(a?.score || 0)))
    .slice(0, 5);
  ctx.fillStyle = "#fff";
  ctx.font = "16px Courier New";
  if (rows.length === 0) {
    ctx.fillText("No previous scores yet", panelX + 16, panelY + 64);
  } else {
    for (let i = 0; i < rows.length; i++) {
      const e = rows[i];
      const y = panelY + 64 + i * 34;
      const date = String(e?.date || "");
      const time = String(e?.time || "--:--");
      ctx.fillText(`${i + 1}. ${Number(e?.score || 0)}  ${date}${time ? ` ${time}` : ""}`, panelX + 16, y);
    }
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 22px Courier New";
  const promptY = canvas.height - 30;
  const icon = assets?.btn_q || assets?.["blue-btn"] || null;
  const iconSize = 50;
  const leftText = "PRESS";
  const rightText = "TO START";
  const leftW = ctx.measureText(leftText).width;
  const rightW = ctx.measureText(rightText).width;
  const totalW = leftW + 10 + iconSize + 10 + rightW;
  const startX = canvas.width / 2 - totalW / 2;

  if (icon) {
    ctx.fillText(leftText, startX + leftW / 2, promptY);
    ctx.drawImage(icon, startX + leftW + 10, promptY - iconSize + 6, iconSize, iconSize);
    ctx.fillText(rightText, startX + leftW + 10 + iconSize + 10 + rightW / 2, promptY);
  } else {
    ctx.fillText("PRESS Q TO START", canvas.width / 2, promptY);
  }

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
  const subtitle = "";

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

function drawSmashProcessVisual(ctx, canvas, ps, assets) {
  const areaW = Math.min(460, canvas.width - 120);
  const areaH = 210;
  const ax = (canvas.width - areaW) / 2;
  const ay = canvas.height / 2 - 70;

  const shell = assets?.smash_shell;
  const crack1 = assets?.smash_crack_1;
  const crack2 = assets?.smash_crack_2;
  const pestle = assets?.smash_pestle;
  const splat1 = assets?.smash_splat_1;
  const splat2 = assets?.smash_splat_2;

  const drawFxSprite = (img, x, y, w, h, alpha = 1) => {
    if (!img) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  };

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.strokeRect(ax, ay, areaW, areaH);

  const centerX = ax + areaW / 2;
  const centerY = ay + areaH * 0.62;
  const pulse = Math.max(0, Math.min(1, ps.smashPulse || 0));
  const crack = Math.max(0, Math.min(1, ps.smashCrack || 0));

  drawFxSprite(splat1, centerX - 112, centerY - 28, 224, 112, 1);
  if (splat2 && crack > 0.45) {
    drawFxSprite(splat2, centerX - 124, centerY - 34, 248, 124, 0.35 + 0.55 * crack);
  }

  if (shell) {
    ctx.drawImage(shell, centerX - 82, centerY - 56, 164, 108);
  } else {
    ctx.fillStyle = "#6f4b2e";
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 78, 44, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (crack > 0.2 && crack1) {
    drawFxSprite(crack1, centerX - 82, centerY - 56, 164, 108, Math.min(1, 0.4 + crack * 0.9));
  }
  if (crack > 0.65 && crack2) {
    drawFxSprite(crack2, centerX - 82, centerY - 56, 164, 108, Math.min(1, 0.15 + crack));
  }

  if (Array.isArray(ps.smashParticles)) {
    for (const p of ps.smashParticles) {
      const px = ax + p.xN * areaW;
      const py = ay + p.yN * areaH;
      const size = Math.max(10, p.size * areaW);
      const alpha = Math.max(0, Math.min(1, p.life));
      const img = assets?.[p.sprite];

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(px, py);
      ctx.rotate(p.rot || 0);
      if (img) {
        ctx.globalCompositeOperation = "screen";
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
      }
      else {
        ctx.fillStyle = "rgba(255,224,102,0.8)";
        ctx.fillRect(-size / 2, -size / 2, size, size * 0.35);
      }
      ctx.restore();
    }
  }

  const lift = 16 + pulse * 20;
  const tilt = -0.7 + pulse * 0.18;
  ctx.save();
  ctx.translate(centerX + 44, centerY - lift);
  ctx.rotate(tilt);
  if (pestle) {
    ctx.drawImage(pestle, -32, -128, 64, 174);
  } else {
    ctx.fillStyle = "#c8ccd1";
    ctx.fillRect(-10, -120, 20, 134);
  }
  ctx.restore();

  ctx.restore();
}

export function drawProcessOverlay(ctx, canvas, game, assets = null) {
  const ps = game.processMini;
  if (!ps || !ps.active) return;

  if (ps.mode === "smash") drawSmashProcessVisual(ctx, canvas, ps, assets);

  const meterW = Math.min(520, canvas.width - 120);
  const meterH = 18;
  const mx = (canvas.width - meterW) / 2;
  const my = canvas.height - 292;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(mx - 10, my - 34, meterW + 20, 64);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.strokeRect(mx - 10, my - 34, meterW + 20, 64);

  ctx.fillStyle = "#d7d7d7";
  ctx.font = "bold 14px Courier New";
  ctx.textAlign = "left";
  ctx.fillText(`Flavor Meter`, mx, my - 12);

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(mx, my, meterW, meterH);
  ctx.fillStyle = "rgba(128,255,114,0.92)";
  ctx.fillRect(mx, my, meterW * Math.max(0, Math.min(1, game.flavorMeter || 0)), meterH);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.strokeRect(mx, my, meterW, meterH);

  ctx.fillStyle = "#a7c7ff";
  ctx.fillText(`Streak ${ps.streak}  •  Beat ${ps.beats}/${ps.target}  •  Time ${ps.timeLeft.toFixed(1)}s`, mx, my + 38);

  if (ps.cueCode) {
    ctx.fillStyle = "rgba(255, 224, 102, 0.95)";
    ctx.font = "bold 18px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("REACT:", canvas.width / 2 - 30, my - 44);
    drawButtonIcon(ctx, assets || {}, CODE_TO_LABEL[ps.cueCode] || "?", canvas.width / 2 + 20, my - 68, 30, { glow: true });
  }

  if (ps.effectT > 0 && ps.effectText) {
    ctx.fillStyle = "rgba(255,255,255,0.90)";
    ctx.font = "bold 18px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(ps.effectText, canvas.width / 2, canvas.height / 2 - 156);
  }

  if (ps.smoke > 0) {
    ctx.fillStyle = `rgba(90, 90, 90, ${0.45 * ps.smoke})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (ps.spill > 0) {
    ctx.fillStyle = `rgba(255, 224, 102, ${0.22 * ps.spill})`;
    for (let i = 0; i < 9; i++) {
      const x = (i * 173 + 40) % canvas.width;
      const y = (i * 91 + 55) % canvas.height;
      ctx.fillRect(x, y, 28, 8);
    }
  }

  if (ps.burn > 0) {
    ctx.fillStyle = `rgba(255, 89, 94, ${0.2 * ps.burn})`;
    ctx.fillRect(0, canvas.height - 180, canvas.width, 180);
  }

  ctx.restore();
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
  const cardH = 400;
  const startX = (canvas.width - panelW) / 2;
  const startY = canvas.height / 2 - 120;

  ctx.save();

  // ================= HEADER LAYOUT =================
  const iconSize = 50;
  const iconGap = 12;
  const rowGap = 30;
  const paddingX = 40;
  const paddingY = 30;
  const headerGap = 40; // space between header and dish cards

  ctx.textAlign = "left";
  ctx.font = "18px Courier New";

  const pressText = "Press ";
  const pressWidth = ctx.measureText(pressText).width;
  const iconsWidth = iconSize * 4 + iconGap * 3;
  const contentWidth = pressWidth + 15 + iconsWidth;

  const headerWidth = Math.max(contentWidth, 360);
  const headerInnerHeight = 36 + rowGap + iconSize;
  const fullHeaderHeight = headerInnerHeight + paddingY * 2;

  // Anchor header ABOVE dish cards safely
  const headerBottomY = startY - headerGap;
  const headerCenterY = headerBottomY - fullHeaderHeight / 2;
  const headerCenterX = canvas.width / 2;

  const cardX = headerCenterX - headerWidth / 2 - paddingX;
  const cardY = headerCenterY - headerInnerHeight / 2 - paddingY;

  // ===== Draw Translucent Header Card =====
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(
    cardX,
    cardY,
    headerWidth + paddingX * 2,
    fullHeaderHeight
  );

  // ===== Draw Title =====
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 36px Courier New";

  const titleY = headerCenterY - rowGap / 2;
  ctx.fillText("CHOOSE YOUR DISH", headerCenterX, titleY);

  // ===== Draw Press + Icons Row =====
  ctx.font = "18px Courier New";
  ctx.textAlign = "left";

  const rowStartX = headerCenterX - contentWidth / 2;
  const iconY = titleY + rowGap;

  ctx.fillText(pressText, rowStartX, iconY + 24);

  let currentX = rowStartX + pressWidth + 15;
  for (let i = 0; i < 4; i++) {
    drawButtonIcon(ctx, assets, keyLabels[i], currentX, iconY, iconSize);
    currentX += iconSize + iconGap;
  }

  // ================= DISH CARDS =================
  for (let i = 0; i < count; i++) {
    const dish = options[i];
    const x = startX + i * (cardW + pad);
    const y = startY;

    drawPanel(ctx, x, y, cardW, cardH, 0.7);

    drawButtonIcon(
      ctx,
      assets,
      keyLabels[i],
      x + cardW / 2 - 20,
      y + 14,
      40,
      { glow: true }
    );

    ctx.textAlign = "center";

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Courier New";
    ctx.fillText(dish.name, x + cardW / 2, y + 80);

    ctx.fillStyle = "#d7d7d7";
    ctx.font = "16px Courier New";
    ctx.fillText(dish.culture, x + cardW / 2, y + 108);

    const dishKey = `dish_${slugifyDishName(dish.name)}`;
    const dishImg = assets[dishKey];
    const imageW = Math.max(120, cardW - 74);
    const imageH = 200;
    const imageX = x + (cardW - imageW) / 2;
    const imageY = y + 142;

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(imageX, imageY, imageW, imageH);
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.strokeRect(imageX, imageY, imageW, imageH);

    if (dishImg) {
      ctx.drawImage(dishImg, imageX + 2, imageY + 2, imageW - 4, imageH - 4);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "14px Courier New";
      ctx.fillText(
        "Dish image not found",
        x + cardW / 2,
        imageY + imageH / 2 + 4
      );
    }
    ctx.restore();

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
    assets,
    bottomUiTop = canvas.height
  } = helpers;

  if (!game.currentDish) return;
  const step = currentStep();
  if (!step) return;

  const panelW = Math.min(980, canvas.width - 80);
  const panelX = (canvas.width - panelW) / 2;
  const panelH = 170;
  const panelY = Math.max(130, Math.min(canvas.height - panelH - 12, bottomUiTop - panelH - 16));

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
      drawButtonIcon(ctx, assets, key, x - 16, y - 20, 24, { glow: left > 0 });

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

    const size = 44;
    const gap = 12;
    const totalW = seq.length * size + (seq.length - 1) * gap;
    const startX = (canvas.width - totalW) / 2;

    for (let i = 0; i < seq.length; i++) {
      const code = seq[i];
      const ch = CODE_TO_LABEL[code] || "?";

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
        ctx.fillStyle = "rgba(128,255,114,0.25)";
        ctx.fillRect(x - 2, by - 2, size + 4, size + 4);
      }
      drawButtonIcon(ctx, assets, ch, x, by, size, { glow: isNext || done });

      ctx.restore();
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  };

  if (step.type === "prep" || step.type === "action") {
    ctx.fillStyle = "#d7d7d7";
    ctx.font = "16px Courier New";
    ctx.fillText(`ADD INGREDIENTS: press the matching colored button shown on each icon.`, panelX + 18, controlsY);
    drawIngredientKeyIcons(step, controlsY + 18);
  } else if (step.type === "cook") {
    ctx.fillStyle = "#d7d7d7";
    ctx.font = "16px Courier New";
    ctx.fillText(`COOK: hit the lit colored buttons in order.`, panelX + 18, controlsY);

    const iconsY = controlsY + 18;
    drawCookComboIcons(iconsY);

    ctx.fillStyle = "#a7c7ff";
    ctx.font = "14px Courier New";
    ctx.fillText(`Sequences: ${game.cookCombosDone}/${game.cookCombosNeed}`, panelX + 18, iconsY + 58);

    drawCookBar(ctx, canvas, game, step, 168);
  } else if (step.type === "combo") {
    const ps = game.processMini || {};
    const seq = Array.isArray(ps.seq) ? ps.seq : [];
    ctx.fillStyle = "#d7d7d7";
    ctx.font = "16px Courier New";
    ctx.fillText(`COMBO PROCESS: follow rhythm and keep the streak alive.`, panelX + 18, controlsY);

    const size = 36;
    const gap = 10;
    const show = seq.slice(Math.max(0, (ps.index || 0) - 1), Math.max(0, (ps.index || 0) - 1) + 7);
    const totalW = show.length * size + Math.max(0, show.length - 1) * gap;
    let sx = canvas.width / 2 - totalW / 2;
    const sy = controlsY + 18;

    for (let i = 0; i < show.length; i++) {
      const globalIndex = Math.max(0, (ps.index || 0) - 1) + i;
      const code = show[i];
      const isNext = globalIndex === (ps.index || 0);
      const isDone = globalIndex < (ps.index || 0);

      ctx.save();
      if (isDone) {
        ctx.fillStyle = "rgba(128,255,114,0.22)";
        ctx.fillRect(sx - 2, sy - 2, size + 4, size + 4);
      }
      drawButtonIcon(ctx, assets, CODE_TO_LABEL[code] || "?", sx, sy, size, { glow: isDone || isNext });
      ctx.restore();

      sx += size + gap;
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#a7c7ff";
    ctx.font = "14px Courier New";
    ctx.fillText(`Beat ${ps.beats || 0}/${ps.target || 0} • Best streak ${ps.bestStreak || 0}`, panelX + 18, sy + 56);
  } else if (step.type === "serve") {
    ctx.fillStyle = "#d7d7d7";
    ctx.font = "16px Courier New";
    ctx.fillText(`SERVE: press`, panelX + 18, controlsY);
    drawButtonIcon(ctx, assets, "W", panelX + 220, controlsY - 20, 28, { glow: true });
  }

  ctx.restore();
}

export function drawBottomButtons(ctx, canvas, game, assets = {}, preview = null) {
  const keys = ["Q", "W", "E", "R"];
  const rowSize = 100;
  const rowGap = 20;
  const totalW = keys.length * rowSize + (keys.length - 1) * rowGap;
  const startX = canvas.width / 2 - totalW / 2;
  const rowY = canvas.height - rowSize - 12;

  ctx.save();
  const topY = rowY;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const code = `Key${key}`;
    const glow = Number(game?.keyGlow?.[code] || 0) > 0;
    drawButtonIcon(ctx, assets, key, startX + i * (rowSize + rowGap), rowY, rowSize, { glow });
  }

  ctx.restore();
  return topY;
}

export function drawTopSequencePreview(ctx, canvas, assets = {}, preview = null, yTop = 0) {
  const seq = Array.isArray(preview?.keys) ? preview.keys.slice(0, 8) : [];
  if (seq.length === 0) return 0;

  const pSize = 66;
  const pGap = 10;
  const pW = seq.length * pSize + (seq.length - 1) * pGap;
  const panelPadX = 14;
  const panelPadY = 14;
  const panelW = pW + panelPadX * 2;
  const panelH = pSize + panelPadY * 2 + 20;
  const panelX = canvas.width / 2 - panelW / 2;
  const panelY = yTop;
  const currentIndex = Number.isFinite(preview?.index) ? (preview.index | 0) : -1;

  ctx.save();
  ctx.fillStyle = "rgba(30,30,30,0.52)";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  const px = canvas.width / 2 - pW / 2;
  const py = panelY + panelPadY;
  for (let i = 0; i < seq.length; i++) {
    const x = px + i * (pSize + pGap);
    const isCurrent = i === currentIndex;
    const isDone = currentIndex > i;
    const key = String(seq[i] || "").toUpperCase();

    ctx.save();
    ctx.fillStyle = isCurrent ? "rgba(255,236,140,0.55)" : "rgba(255,255,255,0.08)";
    ctx.fillRect(x - 4, py - 4, pSize + 8, pSize + 8);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.strokeRect(x - 4, py - 4, pSize + 8, pSize + 8);
    if (isDone) {
      ctx.fillStyle = "rgba(128,255,114,0.16)";
      ctx.fillRect(x - 4, py - 4, pSize + 8, pSize + 8);
    }
    drawButtonIcon(ctx, assets, key, x, py, pSize, { glow: isCurrent || isDone });

    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(x + pSize - 20, py + pSize - 16, 18, 14);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px Courier New";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(key, x + pSize - 11, py + pSize - 9);
    ctx.restore();
  }

  if (currentIndex >= 0 && currentIndex < seq.length) {
    const nx = px + currentIndex * (pSize + pGap);
    ctx.fillStyle = "rgba(255,224,102,0.95)";
    ctx.fillRect(nx, py - 18, pSize, 14);
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.strokeRect(nx, py - 18, pSize, 14);
    ctx.fillStyle = "#111";
    ctx.font = "bold 10px Courier New";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("NEXT", nx + pSize / 2, py - 11);
  }
  ctx.restore();
  return panelH;
}

export function drawStep1Intro(ctx, canvas, step1, assets = {}) {
  const t = Number(step1?.introTimer || 0);
  const isChineseStep1 = String(step1?.mode || "") === "chinese-chop";
  const isLaksaStep1 = String(step1?.mode || "") === "laksa-paste";

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.68)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panelW = Math.min(900, canvas.width - 120);
  const panelH = 260;
  const panelX = (canvas.width - panelW) / 2;
  const panelY = canvas.height / 2 - panelH / 2;
  drawPanel(ctx, panelX, panelY, panelW, panelH, 0.7);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 44px Courier New";
  ctx.fillText(
    isChineseStep1
      ? "Step 1: Prep the Garlic and Ginger"
      : isLaksaStep1
        ? "Step 1: Make the Laksa Chili Paste"
        : "Step 1: Crack & Make Paste",
    canvas.width / 2,
    panelY + 76
  );

  ctx.fillStyle = "#d7d7d7";
  ctx.font = "20px Courier New";
  ctx.fillText(
    isChineseStep1
      ? "Cutting board ready. Start with garlic, then ginger."
      : isLaksaStep1
        ? "Mortar ready. Complete 3 chili combos to make the paste."
        : "Get ready to crack buah keluak and pound the paste!",
    canvas.width / 2,
    panelY + 124
  );

  const icon = isChineseStep1
    ? (assets?.garlic || assets?.ginger || assets?.smash_shell)
    : isLaksaStep1
      ? (assets?.laksa_mortar_empty || assets?.laksa_chillies || assets?.chili || assets?.smash_shell)
      : assets?.smash_shell;
  const bounce = Math.sin((step1?.animT || 0) * 5.2) * 10;
  const iconSize = 92;
  const ix = canvas.width / 2 - iconSize / 2;
  const iy = panelY + 148 + bounce;
  if (icon) {
    ctx.drawImage(icon, ix, iy, iconSize, (isChineseStep1 || isLaksaStep1) ? iconSize : iconSize * 0.72);
  } else {
    ctx.fillStyle = "#6f4b2e";
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, iy + iconSize * 0.35, 38, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#a7c7ff";
  ctx.font = "16px Courier New";
  ctx.fillText(`Starting in ${Math.max(0, Math.ceil(t))}...`, canvas.width / 2, panelY + panelH - 28);
  ctx.restore();
}

function getChineseChopSprite(assets, target, stage) {
  const safeStage = Math.max(0, Math.min(3, Number(stage || 0)));
  if (target === "ginger") {
    if (safeStage <= 0) return assets?.ginger || null;
    return assets?.[`chop_ginger_${safeStage}`] || assets?.ginger || null;
  }
  if (safeStage <= 0) return assets?.garlic || null;
  return assets?.[`chop_garlic_${safeStage}`] || assets?.garlic || null;
}

export function getStep2ButtonRects(canvas) {
  const bw = 250;
  const bh = 58;
  const gap = 24;
  const totalW = bw * 2 + gap;
  const startX = canvas.width / 2 - totalW / 2;
  const y = canvas.height - 140;

  return {
    paste: { x: startX, y, w: bw, h: bh },
    chicken: { x: startX + bw + gap, y, w: bw, h: bh }
  };
}

export function drawStep2Intro(ctx, canvas, step2, assets = {}) {
  const t = Number(step2?.introTimer || 0);
  const isChineseStep2 = String(step2?.mode || "") === "lor-braise";
  const isCurryFeng = String(step2?.dishName || "") === "CURRY FENG";
  const isCurryStep3Braise = isCurryFeng && String(step2?.braiseVariant || "") === "chili-pork";

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.74)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panelW = Math.min(920, canvas.width - 120);
  const panelH = 250;
  const panelX = (canvas.width - panelW) / 2;
  const panelY = canvas.height / 2 - panelH / 2;
  drawPanel(ctx, panelX, panelY, panelW, panelH, 0.74);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 44px Courier New";
  ctx.fillText(
    isChineseStep2 ? "Step 2: Add Chicken and Start the Braise" : "Step 2: Start Cooking the Chicken",
    canvas.width / 2,
    panelY + 88
  );

  ctx.fillStyle = "#d7d7d7";
  ctx.font = "20px Courier New";
  ctx.fillText(
    isChineseStep2
      ? (
        isCurryStep3Braise
          ? "Metal pot ready. Add chili, then pork."
          : (isCurryFeng ? "Metal pot ready. Add oil + chopped garlic/ginger, then chicken." : "Metal pot ready. Add oil + clove, then chicken.")
      )
      : "Prepare the pot, add paste, then add chicken.",
    canvas.width / 2,
    panelY + 138
  );

  if (isChineseStep2) {
    const pot = isCurryStep3Braise
      ? (assets?.step3_eurasian_pot_base || assets?.step3_eurasian_pot_chili || assets?.step2_pot)
      : isCurryFeng
      ? (assets?.step2_eurasian_fry_pan || assets?.step2_eurasian_fry_stage1 || assets?.step2_eurasian_fry_stage2 || assets?.step2_pot)
      : (assets?.step2_pot || assets?.step2_chinese_pot_stage1 || assets?.step2_chinese_pot_stage2);
    if (pot) {
      const pw = 280;
      const ph = 140;
      drawImageContain(ctx, pot, canvas.width / 2 - pw / 2, panelY + 186, pw, ph);
    }
  }

  ctx.fillStyle = "#a7c7ff";
  ctx.font = "16px Courier New";
  ctx.fillText(`Starting in ${Math.max(0, Math.ceil(t))}...`, canvas.width / 2, panelY + 192);

  ctx.restore();
}

export function drawStep2Gameplay(ctx, canvas, step2, assets = {}) {
  if (String(step2?.mode || "") === "lor-braise") {
    const isCurryFeng = String(step2?.dishName || "") === "CURRY FENG";
    const isCurryStep3Braise = isCurryFeng && String(step2?.braiseVariant || "") === "chili-pork";
    const stepTitle = isCurryFeng && !isCurryStep3Braise
      ? "Step 2: Fry the Aromatics Until Fragrant"
      : isCurryStep3Braise
      ? "Step 3: Add the Pork and Build the Curry"
      : "Step 2: Add Chicken and Start the Braise";
    const add1Label = isCurryStep3Braise ? "chili" : "clove";
    const add2Label = isCurryStep3Braise ? "pork" : "chicken";
    const phaseText = {
      addOilClove: isCurryFeng
        ? (isCurryStep3Braise ? "Complete sequence to add oil & chili" : "Complete sequence to add oil & chopped garlic/ginger")
        : "Complete sequence to add oil & clove",
      addOilCloveAnim: isCurryFeng
        ? (isCurryStep3Braise ? "Adding oil & chili..." : "Adding oil & chopped garlic/ginger...")
        : "Adding oil & clove...",
      addChicken: `Complete sequence to add ${add2Label} pieces`,
      addChickenAnim: `Adding ${add2Label} pieces...`,
      heat: "Tap in rhythm to keep ideal braise heat"
    }[step2?.phase] || "Start the braise";

    const hintText = {
      addOilClove: "Follow the Q/W/E/R sequence",
      addOilCloveAnim: isCurryFeng
        ? (isCurryStep3Braise ? "Oil and chili are pouring into the pot" : "Oil and chopped garlic/ginger are pouring into the pot")
        : "Oil and clove are pouring into the pot",
      addChicken: "Follow the Q/W/E/R sequence",
      addChickenAnim: `${add2Label[0].toUpperCase()}${add2Label.slice(1)} pieces are going into the pot`,
      heat: `Hold heat in green zone (${Math.max(0, Number(step2?.heatTimer || 0)).toFixed(1)}s)`
    }[step2?.phase] || "";

    const comboSeq = Array.isArray(step2?.comboSeq) ? step2.comboSeq : [];
    const comboIndex = Math.max(0, Number(step2?.comboIndex || 0));

    const potBase = isCurryStep3Braise
      ? (assets?.step3_eurasian_pot_base || assets?.step2_pot)
      : isCurryFeng
      ? (assets?.step2_eurasian_fry_pan || assets?.step2_pot)
      : assets?.step2_pot;
    const potStage1 = isCurryStep3Braise
      ? (assets?.step3_eurasian_pot_chili || assets?.step2_pot)
      : isCurryFeng
      ? (assets?.step2_eurasian_fry_stage1 || assets?.step2_chinese_pot_stage1 || assets?.step2_pot_paste)
      : (assets?.step2_chinese_pot_stage1 || assets?.step2_pot_paste);
    const potStage2 = isCurryStep3Braise
      ? (assets?.step3_eurasian_pot_pork || assets?.step2_pot)
      : isCurryFeng
      ? (assets?.step2_eurasian_fry_stage2 || assets?.step2_chinese_pot_stage2 || assets?.step2_pot_finished)
      : (assets?.step2_chinese_pot_stage2 || assets?.step2_pot_finished);
    const potFinal = isCurryStep3Braise
      ? (assets?.step3_eurasian_pot_pork || potStage2 || potStage1 || potBase)
      : isCurryFeng
      ? (assets?.step2_eurasian_fry_pan || potStage2 || potStage1 || potBase)
      : (assets?.step2_pot_finished || potStage2 || potStage1 || potBase);
    const oilBottle = isCurryStep3Braise
      ? (assets?.chili || assets?.step2_chinese_oil)
      : assets?.step2_chinese_oil;
    const aromatics = isCurryStep3Braise
      ? (assets?.pork || assets?.step2_chinese_clove)
      : isCurryFeng
      ? (assets?.step2_eurasian_chopped_garlic_ginger || assets?.step2_chinese_clove)
      : assets?.step2_chinese_clove;
    const chicken = isCurryStep3Braise
      ? (assets?.pork || assets?.chicken)
      : isCurryFeng
      ? (assets?.step2_eurasian_chopped_garlic_ginger || assets?.chicken)
      : assets?.chicken;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const instructionX = canvas.width / 2;
    const instructionY = canvas.height - 172;
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.fillRect(instructionX - 320, instructionY - 52, 640, 108);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.strokeRect(instructionX - 320, instructionY - 52, 640, 108);

    ctx.fillStyle = "#ffe066";
    ctx.font = "bold 30px Courier New";
    ctx.fillText(stepTitle, instructionX, instructionY - 20);

    ctx.fillStyle = "#d7d7d7";
    ctx.font = "19px Courier New";
    ctx.fillText(phaseText, instructionX, instructionY + 10);

    ctx.fillStyle = "#a7c7ff";
    ctx.font = "15px Courier New";
    ctx.fillText(hintText, instructionX, instructionY + 36);

    if ((step2?.phase === "addOilClove" || step2?.phase === "addChicken") && comboSeq.length) {
      const labels = { KeyQ: "Q", KeyW: "W", KeyE: "E", KeyR: "R" };
      const size = 68;
      const gap = 12;
      const shown = comboSeq.slice(0, Math.min(6, comboSeq.length));
      const totalW = shown.length * size + Math.max(0, shown.length - 1) * gap;
      const panelPad = 12;
      const seqPanelW = totalW + panelPad * 2;
      const seqPanelH = size + 28;
      const panelX = canvas.width / 2 - seqPanelW / 2;
      const panelY = 170;
      const sy = panelY + 14;

      ctx.fillStyle = "rgba(30,30,30,0.52)";
      ctx.fillRect(panelX, panelY, seqPanelW, seqPanelH);
      ctx.strokeStyle = "rgba(255,255,255,0.24)";
      ctx.strokeRect(panelX, panelY, seqPanelW, seqPanelH);

      let sx = panelX + panelPad;
      for (let i = 0; i < shown.length; i++) {
        const code = shown[i];
        const key = labels[code] || "?";
        const isDone = i < comboIndex;

        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(sx - 4, sy - 4, size + 8, size + 8);
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.strokeRect(sx - 4, sy - 4, size + 8, size + 8);
        if (isDone) {
          ctx.fillStyle = "rgba(128,255,114,0.16)";
          ctx.fillRect(sx - 4, sy - 4, size + 8, size + 8);
        }

        drawButtonIcon(ctx, assets, key, sx, sy, size, { glow: isDone });
        ctx.restore();
        sx += size + gap;
      }
    }

    const potCx = canvas.width / 2;
    const potCy = canvas.height / 2;
    const potW = 720;
    const potH = 360;
    const potX = potCx - potW / 2;
    const potY = potCy - potH / 2;

    const showStage1Pot = step2?.phase === "addChicken" || step2?.phase === "addChickenAnim";
    const showStage2Pot = step2?.phase === "heat";
    const potSprite = showStage2Pot
      ? (potStage2 || potFinal || potStage1 || potBase)
      : showStage1Pot
        ? (potStage1 || potStage2 || potBase)
        : (potBase || potStage1 || potStage2);

    if (potSprite) {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(potCx, potCy + potH * 0.45, potW * 0.4, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      drawImageContain(ctx, potSprite, potX, potY, potW, potH);
    }

    if (step2?.phase === "addOilCloveAnim") {
      const progress = 1 - Math.max(0, Math.min(1, Number(step2?.transitionT || 0) / 0.9));
      const ox = potX - 130 + progress * (potW * 0.46);
      const oy = potY - 55 + progress * 150;
      const cx = potX + potW + 18 - progress * (potW * 0.55);
      const cy = potY - 24 + progress * 138;

      if (oilBottle) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(-0.5 + progress * 0.35);
        ctx.drawImage(oilBottle, -88, -112, 176, 224);
        ctx.restore();
      }

      if (aromatics && (isCurryStep3Braise || !isCurryFeng)) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.4 + progress * 0.4);
        ctx.drawImage(aromatics, -74, -52, 148, 104);
        ctx.restore();
      }
    }

    if (step2?.phase === "addChickenAnim") {
      const progress = 1 - Math.max(0, Math.min(1, Number(step2?.transitionT || 0) / 0.9));
      const cx = potX - 110 + progress * (potW * 0.48);
      const cy = potY - 14 + progress * 140;

      if (chicken) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.35 + progress * 0.42);
        ctx.drawImage(chicken, -94, -64, 188, 128);
        ctx.restore();
      }
    }

    if (step2?.phase === "heat") {
      const t = step2?.animT || 0;
      for (let i = 0; i < 10; i++) {
        const bx = potX + 84 + ((i * 69 + t * 110) % (potW - 168));
        const by = potY + 220 - ((t * 50 + i * 13) % 70);
        const r = 2.4 + Math.sin(t * 8 + i * 0.7) * 1.2;
        ctx.fillStyle = "rgba(230, 240, 255, 0.76)";
        ctx.beginPath();
        ctx.arc(bx, by, Math.max(1.4, r), 0, Math.PI * 2);
        ctx.fill();
      }

      const heatLevel = Math.max(0, Math.min(1, Number(step2?.heatLevel || 0)));
      const heatMin = Math.max(0, Math.min(1, Number(step2?.heatIdealMin ?? 0.45)));
      const heatMax = Math.max(0, Math.min(1, Number(step2?.heatIdealMax ?? 0.62)));
      const timerLeft = Math.max(0, Number(step2?.heatTimer || 0));
      const timerDur = Math.max(0.1, Number(step2?.heatDuration || 7));
      const timerP = Math.max(0, Math.min(1, timerLeft / timerDur));

      const heatW = 440;
      const heatH = 20;
      const heatX = canvas.width / 2 - heatW / 2;
      const heatY = potY - 22;
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(heatX, heatY, heatW, heatH);
      ctx.fillStyle = "rgba(128,255,114,0.35)";
      ctx.fillRect(heatX + heatW * heatMin, heatY, heatW * (heatMax - heatMin), heatH);
      ctx.fillStyle = "rgba(255,120,80,0.9)";
      ctx.fillRect(heatX, heatY, heatW * heatLevel, heatH);
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.strokeRect(heatX, heatY, heatW, heatH);

      const timerW = 300;
      const timerH = 14;
      const timerX = canvas.width / 2 - timerW / 2;
      const timerY = heatY - 24;
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(timerX, timerY, timerW, timerH);
      ctx.fillStyle = "rgba(167,199,255,0.94)";
      ctx.fillRect(timerX, timerY, timerW * timerP, timerH);
      ctx.strokeStyle = "rgba(255,255,255,0.42)";
      ctx.strokeRect(timerX, timerY, timerW, timerH);

      ctx.fillStyle = "#a7c7ff";
      ctx.font = "16px Courier New";
      ctx.fillText(`${timerLeft.toFixed(1)}s`, canvas.width / 2, timerY - 12);
    }

    const actionPanelW = 760;
    const actionPanelH = 64;
    const actionPanelX = canvas.width / 2 - actionPanelW / 2;
    const actionPanelY = 110;
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(actionPanelX, actionPanelY, actionPanelW, actionPanelH);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.strokeRect(actionPanelX, actionPanelY, actionPanelW, actionPanelH);

    const actionText = step2?.phase === "addOilClove" || step2?.phase === "addOilCloveAnim"
      ? (isCurryFeng
        ? (isCurryStep3Braise ? "Button: Add oil & chili to pot" : "Button: Add oil & chopped garlic/ginger to pot")
        : "Button: Add oil & clove to pot")
      : step2?.phase === "addChicken" || step2?.phase === "addChickenAnim"
        ? `Button: Add ${add2Label} pieces`
        : "Heat phase: tap rhythm on Q/W/E/R";
    ctx.fillStyle = "#ffe066";
    ctx.font = "bold 22px Courier New";
    ctx.fillText(actionText, canvas.width / 2, actionPanelY + 39);

    ctx.restore();
    return;
  }

  const phaseText = {
    addPaste: "Complete combo to add paste",
    addPasteAnim: "Adding paste...",
    addChicken: "Complete combo to add chicken",
    addChickenAnim: "Adding chicken...",
    boil: "Boil by spamming colored buttons"
  }[step2?.phase] || "Cook the chicken";

  const comboSeq = Array.isArray(step2?.comboSeq) ? step2.comboSeq : [];
  const comboIndex = Math.max(0, Number(step2?.comboIndex || 0));

  const hintText = {
    addPaste: "Press the shown colored buttons in order",
    addPasteAnim: "Paste animation",
    addChicken: "Press the shown colored buttons in order",
    addChickenAnim: "Chicken animation",
    boil: `Spam buttons: ${Math.max(0, Number(step2?.boilSpamCount || 0))}/${Math.max(1, Number(step2?.boilSpamNeed || 1))}`
  }[step2?.phase] || "Follow the next action";

  const chicken = assets?.chicken;
  const spoon = assets?.scoop_spoon_full || assets?.scoop_spoon_half || assets?.scoop_spoon_empty;
  const potBase = assets?.step2_pot;
  const potPaste = assets?.step2_pot_paste;
  const potFinished = assets?.step2_pot_finished;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const instructionX = canvas.width / 2;
  const instructionY = canvas.height - 172;
  ctx.fillStyle = "rgba(0,0,0,0.52)";
  ctx.fillRect(instructionX - 280, instructionY - 52, 560, 108);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.strokeRect(instructionX - 280, instructionY - 52, 560, 108);

  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 30px Courier New";
  ctx.fillText("Step 2: Start Cooking the Chicken", instructionX, instructionY - 20);

  ctx.fillStyle = "#d7d7d7";
  ctx.font = "19px Courier New";
  ctx.fillText(phaseText, instructionX, instructionY + 10);

  ctx.fillStyle = "#a7c7ff";
  ctx.font = "15px Courier New";
  ctx.fillText(hintText, instructionX, instructionY + 36);

  if ((step2?.phase === "addPaste" || step2?.phase === "addChicken") && comboSeq.length) {
    const labels = { KeyQ: "Q", KeyW: "W", KeyE: "E", KeyR: "R" };
    const size = 68;
    const gap = 12;
    const seqLen = Math.min(6, comboSeq.length);
    const shown = comboSeq.slice(0, seqLen);
    const totalW = shown.length * size + Math.max(0, shown.length - 1) * gap;
    const panelPad = 12;
    const panelW = totalW + panelPad * 2;
    const panelH = size + 28;
    const panelX = canvas.width / 2 - panelW / 2;
    const panelY = 170;
    let sx = panelX + panelPad;
    const sy = panelY + 14;

    ctx.save();
    ctx.fillStyle = "rgba(30,30,30,0.52)";
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = "rgba(255,255,255,0.24)";
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    for (let i = 0; i < shown.length; i++) {
      const code = shown[i];
      const key = labels[code] || "?";
      const isDone = i < comboIndex;

      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(sx - 4, sy - 4, size + 8, size + 8);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.strokeRect(sx - 4, sy - 4, size + 8, size + 8);
      if (isDone) {
        ctx.fillStyle = "rgba(128,255,114,0.16)";
        ctx.fillRect(sx - 4, sy - 4, size + 8, size + 8);
      }

      drawButtonIcon(ctx, assets, key, sx, sy, size, { glow: isDone });

      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(sx + size - 20, sy + size - 16, 18, 14);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px Courier New";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(key, sx + size - 11, sy + size - 9);
      ctx.restore();

      sx += size + gap;
    }

    ctx.restore();
  }

  const potCx = canvas.width / 2;
  const potCy = canvas.height / 2;
  const potW = 720;
  const potH = 360;

  const potX = potCx - potW / 2;
  const potY = potCy - potH / 2;

  const showPastePot = !!step2?.addedPaste || step2?.phase === "addChicken" || step2?.phase === "addChickenAnim";
  const showFinishedPot = !!step2?.addedChicken || step2?.phase === "boil";
  const potSprite = showFinishedPot
    ? (potFinished || potPaste || potBase)
    : showPastePot
      ? (potPaste || potBase)
      : potBase;

  if (potSprite) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(potCx, potCy + potH * 0.45, potW * 0.4, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    drawImageContain(ctx, potSprite, potX, potY, potW, potH);
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(potCx, potCy + potH * 0.45, potW * 0.46, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(45, 55, 70, 0.96)";
    ctx.fillRect(potX, potY + 22, potW, potH - 20);

    ctx.fillStyle = "rgba(110, 125, 145, 0.92)";
    ctx.fillRect(potX, potY + 8, potW, 24);

    ctx.fillStyle = "rgba(90, 105, 125, 0.95)";
    ctx.fillRect(potX - 20, potY + 56, 20, 54);
    ctx.fillRect(potX + potW, potY + 56, 20, 54);
  }

  if (step2?.phase === "addPasteAnim") {
    const progress = 1 - Math.max(0, Math.min(1, Number(step2?.transitionT || 0) / 0.8));
    const sx = potX + potW + 90 - progress * (potW * 0.55);
    const sy = potY - 38 + progress * 145;
    const sw = 250;
    const sh = 160;
    if (spoon) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(-0.65 + progress * 0.45);
      ctx.drawImage(spoon, -sw / 2, -sh / 2, sw, sh);
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(sx - 80, sy - 10, 150, 20);
    }
  }

  if (step2?.phase === "addChickenAnim") {
    const progress = 1 - Math.max(0, Math.min(1, Number(step2?.transitionT || 0) / 0.85));
    const cx = potX - 120 + progress * (potW * 0.46);
    const cy = potY - 10 + progress * 138;
    if (chicken) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.35 + progress * 0.42);
      ctx.drawImage(chicken, -94, -64, 188, 128);
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(255, 205, 120, 0.95)";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 58, 32, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (step2?.phase === "boil") {
    const t = step2?.animT || 0;
    for (let i = 0; i < 11; i++) {
      const wave = i * 0.57;
      const bx = potX + 80 + ((i * 71 + t * 108) % (potW - 160));
      const by = potY + 222 - ((t * 52 + i * 14) % 72);
      const r = 3 + Math.sin(t * 8 + wave) * 1.4;
      ctx.fillStyle = "rgba(230, 240, 255, 0.75)";
      ctx.beginPath();
      ctx.arc(bx, by, Math.max(1.6, r), 0, Math.PI * 2);
      ctx.fill();
    }

    const done = Math.max(0, Number(step2?.boilSpamCount || 0));
    const need = Math.max(1, Number(step2?.boilSpamNeed || 1));
    const p = Math.max(0, Math.min(1, done / need));

    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.font = "bold 28px Courier New";
    ctx.fillText(`${done}/${need}`, potCx, potY - 26);

    const bw = 320;
    const bh = 16;
    const bx = potCx - bw / 2;
    const by = potY - 4;
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "rgba(128,255,114,0.92)";
    ctx.fillRect(bx, by, bw * p, bh);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.strokeRect(bx, by, bw, bh);
  }

  ctx.restore();
}

export function drawStep3Intro(ctx, canvas, step3Intro, assets = {}) {
  const t = Number(step3Intro?.timer || 0);
  const usesLorStyleFlow = ["LOR KAI YIK", "CURRY FENG"].includes(String(step3Intro?.dishName || ""));

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.74)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panelW = Math.min(920, canvas.width - 120);
  const panelH = 230;
  const panelX = (canvas.width - panelW) / 2;
  const panelY = canvas.height / 2 - panelH / 2;
  drawPanel(ctx, panelX, panelY, panelW, panelH, 0.74);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 40px Courier New";
  ctx.fillText(usesLorStyleFlow ? "Step 3: Slow Simmer Until Tender" : "Step 3: Stir Carefully", canvas.width / 2, panelY + 82);

  ctx.fillStyle = "#d7d7d7";
  ctx.font = "18px Courier New";
  ctx.fillText(
    usesLorStyleFlow
      ? "Time the button in the green zone 3 times, then stir."
      : "Press the target colored button in the green zone.",
    canvas.width / 2,
    panelY + 126
  );

  const barW = Math.min(520, panelW - 180);
  const barH = 18;
  const bx = canvas.width / 2 - barW / 2;
  const by = panelY + 152;
  const sweetMin = 0.42;
  const sweetMax = 0.58;

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(bx, by, barW, barH);

  ctx.save();
  ctx.shadowColor = "rgba(128,255,114,0.9)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "rgba(128,255,114,0.88)";
  ctx.fillRect(bx + barW * sweetMin, by, barW * (sweetMax - sweetMin), barH);
  ctx.restore();

  const demoX = bx + barW * (0.5 + Math.sin((step3Intro?.animT || 0) * 2.6) * 0.24);
  ctx.fillStyle = "rgba(255,224,102,0.95)";
  ctx.fillRect(demoX - 4, by - 6, 8, barH + 12);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.strokeRect(bx, by, barW, barH);

  ctx.fillStyle = "#a7c7ff";
  ctx.font = "16px Courier New";
  ctx.fillText(`Starting in ${Math.max(0, Math.ceil(t))}...`, canvas.width / 2, panelY + 214);

  ctx.restore();
}

export function drawStep3Gameplay(ctx, canvas, game, assets = {}, yTop = 140, bottomUiTop = null) {
  const s3 = game.step3 || {};
  const usesLorStyleFlow = ["LOR KAI YIK", "CURRY FENG"].includes(String(game?.currentDish?.name || ""));

  const pot = usesLorStyleFlow
    ? (assets?.step2_chinese_pot_stage2 || assets?.step2_pot_finished || assets?.step2_pot)
    : (assets?.step2_pot_finished || assets?.step2_pot_paste || assets?.step2_pot);
  const spoon = usesLorStyleFlow
    ? (assets?.scoop_spoon_stir || assets?.scoop_spoon_empty)
    : (assets?.scoop_spoon_full || assets?.scoop_spoon_half || assets?.scoop_spoon_empty);

  const potW = 720;
  const potH = 360;
  const potX = canvas.width / 2 - potW / 2;
  const potY = canvas.height / 2 - potH / 2 + 18;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const headerY = Math.max(96, yTop + 52);
  ctx.fillStyle = "rgba(0,0,0,0.52)";
  ctx.fillRect(canvas.width / 2 - 360, headerY - 40, 720, 100);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.strokeRect(canvas.width / 2 - 360, headerY - 40, 720, 100);

  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 30px Courier New";
  ctx.fillText("Step 3: Stir Carefully", canvas.width / 2, headerY - 10);
  ctx.fillStyle = "#a7c7ff";
  ctx.font = "15px Courier New";
  ctx.fillText("Press the target button when pointer is in green zone", canvas.width / 2, headerY + 16);

  const barW = 560;
  const barH = 20;
  const bx = canvas.width / 2 - barW / 2;
  const safeBottom = Number.isFinite(bottomUiTop) ? bottomUiTop : (canvas.height - 112);
  const by = Math.max(headerY + 210, safeBottom - 48);
  const sweetMin = Number(s3.sweetMin ?? 0.42);
  const sweetMax = Number(s3.sweetMax ?? 0.58);
  const pointer = Math.max(0, Math.min(1, Number(s3.pointer ?? 0.5)));

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(bx, by, barW, barH);
  ctx.save();
  ctx.shadowColor = "rgba(128,255,114,0.9)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "rgba(128,255,114,0.88)";
  ctx.fillRect(bx + barW * sweetMin, by, barW * (sweetMax - sweetMin), barH);
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.strokeRect(bx, by, barW, barH);

  const px = bx + barW * pointer;
  ctx.fillStyle = "rgba(255,224,102,0.96)";
  ctx.fillRect(px - 4, by - 7, 8, barH + 14);

  const targetKey = CODE_TO_LABEL[s3.targetCode] || "?";
  const targetSize = 72;
  const targetPanelW = 180;
  const targetPanelH = 120;
  const targetPanelX = canvas.width / 2 - targetPanelW / 2;
  const targetPanelY = headerY + 54;
  ctx.fillStyle = "rgba(30,30,30,0.52)";
  ctx.fillRect(targetPanelX, targetPanelY, targetPanelW, targetPanelH);
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.strokeRect(targetPanelX, targetPanelY, targetPanelW, targetPanelH);
  ctx.fillStyle = "rgba(255,224,102,0.95)";
  ctx.fillRect(targetPanelX + 46, targetPanelY + 8, 88, 14);
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.strokeRect(targetPanelX + 46, targetPanelY + 8, 88, 14);
  ctx.fillStyle = "#111";
  ctx.font = "bold 10px Courier New";
  ctx.fillText("TARGET", canvas.width / 2, targetPanelY + 15);
  drawButtonIcon(ctx, assets, targetKey, canvas.width / 2 - targetSize / 2, targetPanelY + 32, targetSize, { glow: true });

  if (pot) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, potY + potH * 0.92, potW * 0.4, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    drawImageContain(ctx, pot, potX, potY, potW, potH);
  }

  const stirAnim = Number(s3.stirPhase || 0);
  const showLiveStir = !!spoon && s3.finishAnim;
  if (showLiveStir) {
    const stirBoost = s3.finishAnim ? 1.0 : 0.52;
    const angle = -0.55 + Math.sin(stirAnim * 2.4) * 0.42 * (1.15 + stirBoost);
    const radius = 96 + Math.sin(stirAnim * 3.3) * (8 + stirBoost * 4);
    const sx = canvas.width / 2 + Math.cos(stirAnim * 2.2) * radius;
    const sy = potY + potH * 0.38 + Math.sin(stirAnim * 2.2) * (14 + stirBoost * 8);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);
    ctx.drawImage(spoon, -112, -78, 224, 156);
    ctx.restore();
  }

  const infoW = 620;
  const infoH = 46;
  const infoX = canvas.width / 2 - infoW / 2;
  const infoY = by - infoH - 14;
  ctx.fillStyle = "rgba(0,0,0,0.48)";
  ctx.fillRect(infoX, infoY, infoW, infoH);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.strokeRect(infoX, infoY, infoW, infoH);
  ctx.fillStyle = "#a7c7ff";
  ctx.font = "16px Courier New";
  const done = Math.max(0, Number(s3.hitsDone || 0));
  const need = Math.max(1, Number(s3.hitsNeed || 3));
  ctx.fillText(usesLorStyleFlow ? `Simmer Timing ${done}/${need}` : `Timed Hits ${done}/${need}`, canvas.width / 2, infoY + 30);

  if (s3.finishAnim) {
    ctx.fillStyle = "rgba(128,255,114,0.92)";
    ctx.font = "bold 26px Courier New";
    ctx.fillText(usesLorStyleFlow ? "STIRRING TO FINISH..." : "FINISHING STIR...", canvas.width / 2, canvas.height - 96);
  }

  ctx.restore();
}

export function drawStep4Intro(ctx, canvas, step4Intro, assets = {}) {
  const t = Number(step4Intro?.timer || 0);
  const dishName = String(step4Intro?.dishName || "");
  const usesLorStyleFlow = ["LOR KAI YIK", "CURRY FENG"].includes(dishName);
  const dishNameTitle = dishName || "Your Dish";

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.74)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panelW = Math.min(960, canvas.width - 120);
  const panelH = 250;
  const panelX = (canvas.width - panelW) / 2;
  const panelY = canvas.height / 2 - panelH / 2;
  drawPanel(ctx, panelX, panelY, panelW, panelH, 0.74);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 40px Courier New";
  ctx.fillText(
    usesLorStyleFlow ? `Step 4: Plate and Serve ${dishNameTitle}!` : "Step 4: Plate and Serve Your Ayam Buah Keluak!",
    canvas.width / 2,
    panelY + 88
  );

  ctx.fillStyle = "#d7d7d7";
  ctx.font = "20px Courier New";
  ctx.fillText(
    usesLorStyleFlow
      ? "Serving bowl ready. Add rice and stew, then serve."
      : "Complete the 3-button combo in 5 seconds to serve.",
    canvas.width / 2,
    panelY + 140
  );

  ctx.fillStyle = "#a7c7ff";
  ctx.font = "16px Courier New";
  ctx.fillText(`Starting in ${Math.max(0, Math.ceil(t))}...`, canvas.width / 2, panelY + 194);

  ctx.restore();
}

export function drawStep4Gameplay(ctx, canvas, game, assets = {}, yTop = 140, bottomUiTop = null) {
  const s4 = game.step4 || {};
  const dishName = String(game?.currentDish?.name || "");
  const usesLorStyleFlow = ["LOR KAI YIK", "CURRY FENG"].includes(dishName);
  const isCurryFeng = dishName === "CURRY FENG";
  const dishSlug = slugifyDishName(game?.currentDish?.name || "");
  const dishArt = assets?.[`dish_${dishSlug}`] || assets?.[`dish-${dishSlug}`];
  const pot = isCurryFeng
    ? (assets?.step3_eurasian_pot_pork || assets?.step2_pot_finished || assets?.step2_pot)
    : usesLorStyleFlow
    ? (assets?.step2_chinese_pot_stage2 || assets?.step2_pot_finished || assets?.step2_pot)
    : (assets?.step2_pot_finished || assets?.step2_pot_paste || assets?.step2_pot);
  const ricePlate = usesLorStyleFlow ? assets?.rice_plate : null;
  const spoon = usesLorStyleFlow
    ? (assets?.scoop_spoon_empty || assets?.scoop_spoon_stir)
    : (assets?.scoop_spoon_full || assets?.scoop_spoon_half || assets?.scoop_spoon_empty);
  const serve = usesLorStyleFlow ? (dishArt || assets?.step4_serve) : assets?.step4_serve;

  const potW = 460;
  const potH = 250;
  const potX = canvas.width / 2 - potW / 2 + (usesLorStyleFlow ? 260 : 0);
  const potY = canvas.height / 2 - potH / 2 - (usesLorStyleFlow ? 96 : 18);
  const plateW = 440;
  const plateH = 300;
  const plateX = canvas.width / 2 - plateW / 2;
  const plateY = usesLorStyleFlow ? (canvas.height / 2 - plateH / 2 + 40) : (canvas.height / 2 - 61);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const headerY = Math.max(96, yTop + 52);
  ctx.fillStyle = "rgba(0,0,0,0.52)";
  ctx.fillRect(canvas.width / 2 - 390, headerY - 42, 780, 106);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.strokeRect(canvas.width / 2 - 390, headerY - 42, 780, 106);

  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 30px Courier New";
  ctx.fillText("Step 4: Dish Up & Serve", canvas.width / 2, headerY - 12);
  ctx.fillStyle = "#a7c7ff";
  ctx.font = "15px Courier New";
  ctx.fillText("Press the shown colored buttons in order before time runs out", canvas.width / 2, headerY + 18);

  if (pot) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(potX + potW * 0.5, potY + potH * 0.92, potW * 0.36, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    drawImageContain(ctx, pot, potX, potY, potW, potH);
  }

  if (usesLorStyleFlow && s4.phase !== "final") {
    if (ricePlate) {
      drawImageContain(ctx, ricePlate, plateX, plateY, plateW, plateH);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(plateX, plateY, plateW, plateH);
    }
  }

  const comboSeq = Array.isArray(s4.comboSeq) ? s4.comboSeq : [];
  const comboIndex = Math.max(0, Number(s4.comboIndex || 0));
  if (s4.phase === "combo" && comboSeq.length) {
    const labels = { KeyQ: "Q", KeyW: "W", KeyE: "E", KeyR: "R" };
    const size = 68;
    const gap = 12;
    const shown = comboSeq.slice(0, 3);
    const totalW = shown.length * size + Math.max(0, shown.length - 1) * gap;
    const panelPad = 12;
    const panelW = totalW + panelPad * 2;
    const panelH = size + 28;
    const panelX = canvas.width / 2 - panelW / 2;
    const panelY = headerY + 74;
    let sx = panelX + panelPad;
    const sy = panelY + 14;

    ctx.save();
    ctx.fillStyle = "rgba(30,30,30,0.52)";
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = "rgba(255,255,255,0.24)";
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    for (let i = 0; i < shown.length; i++) {
      const code = shown[i];
      const key = labels[code] || "?";
      const isDone = i < comboIndex;
      const isNext = i === comboIndex;

      ctx.save();
      ctx.fillStyle = isNext ? "rgba(255,236,140,0.55)" : "rgba(255,255,255,0.08)";
      ctx.fillRect(sx - 4, sy - 4, size + 8, size + 8);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.strokeRect(sx - 4, sy - 4, size + 8, size + 8);
      if (isDone) {
        ctx.fillStyle = "rgba(128,255,114,0.16)";
        ctx.fillRect(sx - 4, sy - 4, size + 8, size + 8);
      }

      drawButtonIcon(ctx, assets, key, sx, sy, size, { glow: isDone || isNext });

      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(sx + size - 20, sy + size - 16, 18, 14);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px Courier New";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(key, sx + size - 11, sy + size - 9);
      ctx.restore();

      sx += size + gap;
    }

    if (comboIndex >= 0 && comboIndex < shown.length) {
      const nx = panelX + panelPad + comboIndex * (size + gap);
      ctx.fillStyle = "rgba(255,224,102,0.95)";
      ctx.fillRect(nx, sy - 18, size, 14);
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.strokeRect(nx, sy - 18, size, 14);
      ctx.fillStyle = "#111";
      ctx.font = "bold 10px Courier New";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("NEXT", nx + size / 2, sy - 11);
    }
    ctx.restore();
  }

  if (spoon && (s4.phase === "animToPot" || s4.phase === "animToPlate")) {
    let sx = plateX + plateW * 0.5;
    let sy = plateY + plateH * 0.4;
    let rot = -0.55;

    if (s4.phase === "animToPot") {
      const p = Math.max(0, Math.min(1, Number(s4.phaseT || 0) / 0.7));
      sx = (plateX + plateW * 0.52) + (potX + potW * 0.42 - (plateX + plateW * 0.52)) * p;
      sy = (plateY + plateH * 0.38) + (potY + potH * 0.42 - (plateY + plateH * 0.38)) * p;
      rot = -0.55 + p * 0.4;
    } else if (s4.phase === "animToPlate") {
      const p = Math.max(0, Math.min(1, Number(s4.phaseT || 0) / 0.85));
      sx = (potX + potW * 0.42) + (plateX + plateW * 0.5 - (potX + potW * 0.42)) * p;
      sy = (potY + potH * 0.42) + (plateY + plateH * 0.38 - (potY + potH * 0.42)) * p;
      rot = -0.15 - p * 0.45;
    }

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(rot);
    ctx.drawImage(spoon, -108, -74, 216, 148);
    ctx.restore();
  }

  const timerW = 520;
  const timerH = 20;
  const timerX = canvas.width / 2 - timerW / 2;
  const safeBottom = Number.isFinite(bottomUiTop) ? bottomUiTop : (canvas.height - 112);
  const timerY = Math.max(headerY + 210, safeBottom - 48);
  if (s4.phase === "combo") {
    const duration = Math.max(0.1, Number(s4.duration || 5));
    const left = Math.max(0, Number(s4.timeLeft || 0));
    const ratio = Math.max(0, Math.min(1, left / duration));

    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(timerX, timerY, timerW, timerH);
    ctx.fillStyle = ratio > 0.35 ? "rgba(128,255,114,0.88)" : "rgba(255, 89, 94, 0.9)";
    ctx.fillRect(timerX, timerY, timerW * ratio, timerH);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.strokeRect(timerX, timerY, timerW, timerH);
    ctx.fillStyle = "#a7c7ff";
    ctx.font = "16px Courier New";
    ctx.fillText(`Time Left: ${left.toFixed(1)}s`, canvas.width / 2, timerY - 14);
  }

  if (s4.phase === "final") {
    if (serve) {
      const fw = 540;
      const fh = 380;
      drawImageContain(ctx, serve, canvas.width / 2 - fw / 2, canvas.height / 2 - fh / 2 + 40, fw, fh);
    }
    ctx.fillStyle = "rgba(128,255,114,0.95)";
    ctx.font = "bold 26px Courier New";
    ctx.fillText("FINAL DISH READY!", canvas.width / 2, canvas.height - 102);
    ctx.fillStyle = "#a7c7ff";
    ctx.font = "18px Courier New";
    ctx.fillText(`Score: ${game.score}`, canvas.width / 2, canvas.height - 74);
  }

  ctx.restore();
}

export function drawStep1Gameplay(ctx, canvas, step1, assets = {}) {
  if (String(step1?.mode || "") === "laksa-paste") {
    const phase = String(step1?.phase || "addChili");
    const chiliCount = Math.max(0, Number(step1?.chiliCount || 0));
    const chiliNeed = Math.max(1, Number(step1?.chiliNeed || 3));
    const comboSeq = Array.isArray(step1?.comboSeq) ? step1.comboSeq : [];
    const comboIndex = Math.max(0, Number(step1?.comboIndex || 0));

    const phaseText = {
      addChili: "Complete sequence to add chilies into mortar",
      grindDoneAnim: "Chili paste complete"
    }[phase] || "Make the chili paste";

    const hintText = {
      addChili: `Chilies added: ${chiliCount}/${chiliNeed}`,
      grindDoneAnim: "Switching to grinded chili mortar"
    }[phase] || "Use Q/W/E/R";

    const instructionX = canvas.width / 2;
    const instructionY = canvas.height - 172;

    const mortarEmpty = assets?.laksa_mortar_empty;
    const mortarFull = assets?.laksa_mortar_full;
    const chilies = assets?.laksa_chillies || assets?.chili;

    const bowlCx = canvas.width / 2;
    const bowlCy = canvas.height / 2 + 42;
    const bowlW = 540;
    const bowlH = 290;
    const bowlX = bowlCx - bowlW / 2;
    const bowlY = bowlCy - bowlH / 2;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.fillRect(instructionX - 310, instructionY - 52, 620, 108);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.strokeRect(instructionX - 310, instructionY - 52, 620, 108);

    ctx.fillStyle = "#ffe066";
    ctx.font = "bold 30px Courier New";
    ctx.fillText("Step 1: Make the Laksa Chili Paste", instructionX, instructionY - 20);

    ctx.fillStyle = "#d7d7d7";
    ctx.font = "19px Courier New";
    ctx.fillText(phaseText, instructionX, instructionY + 10);

    ctx.fillStyle = "#a7c7ff";
    ctx.font = "15px Courier New";
    ctx.fillText(hintText, instructionX, instructionY + 36);

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(bowlCx, bowlCy + bowlH * 0.42, bowlW * 0.36, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    if (phase === "grindDoneAnim" && mortarFull) {
      ctx.drawImage(mortarFull, bowlX, bowlY, bowlW, bowlH);
    } else if (mortarEmpty) {
      ctx.drawImage(mortarEmpty, bowlX, bowlY, bowlW, bowlH);
    } else {
      ctx.fillStyle = "rgba(90,90,90,0.85)";
      ctx.beginPath();
      ctx.ellipse(bowlCx, bowlCy + 12, bowlW * 0.34, bowlH * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(68,68,68,0.92)";
      ctx.beginPath();
      ctx.ellipse(bowlCx, bowlCy + 36, bowlW * 0.28, bowlH * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (phase === "addChili" && chilies && Number(step1?.chiliDropT || 0) > 0) {
      const spriteW = 122;
      const spriteH = 92;
      const t = Math.max(0, Math.min(1, 1 - Number(step1?.chiliDropT || 0) / 0.55));
      const sx = bowlCx - spriteW / 2;
      const startY = bowlY - 86;
      const endY = bowlY + 12;
      const sy = startY + (endY - startY) * t;
      ctx.drawImage(chilies, sx, sy, spriteW, spriteH);
    }

    if (phase === "addChili" && comboSeq.length) {
      const labels = { KeyQ: "Q", KeyW: "W", KeyE: "E", KeyR: "R" };
      const size = 60;
      const seqGap = 10;
      const shown = comboSeq.slice(0, Math.min(6, comboSeq.length));
      const totalW = shown.length * size + Math.max(0, shown.length - 1) * seqGap;
      const panelPad = 12;
      const panelW = totalW + panelPad * 2;
      const panelH = size + 24;
      const panelX = canvas.width / 2 - panelW / 2;
      const panelY = 180;
      let sx = panelX + panelPad;
      const sy = panelY + 12;

      ctx.fillStyle = "rgba(30,30,30,0.52)";
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.strokeStyle = "rgba(255,255,255,0.24)";
      ctx.strokeRect(panelX, panelY, panelW, panelH);

      for (let i = 0; i < shown.length; i++) {
        const key = labels[shown[i]] || "?";
        const isDone = i < comboIndex;
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(sx - 4, sy - 4, size + 8, size + 8);
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.strokeRect(sx - 4, sy - 4, size + 8, size + 8);
        if (isDone) {
          ctx.fillStyle = "rgba(128,255,114,0.16)";
          ctx.fillRect(sx - 4, sy - 4, size + 8, size + 8);
        }
        drawButtonIcon(ctx, assets, key, sx, sy, size, { glow: isDone });
        sx += size + seqGap;
      }
    }

    const barW = Math.min(560, canvas.width - 260);
    const barH = 18;
    const bx = canvas.width / 2 - barW / 2;
    const by = 152;
    const p = phase === "grindDoneAnim"
      ? 1
      : Math.max(0, Math.min(1, chiliCount / chiliNeed));

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = "rgba(128,255,114,0.92)";
    ctx.fillRect(bx, by, barW * p, barH);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.strokeRect(bx, by, barW, barH);

    ctx.fillStyle = "#a7c7ff";
    ctx.font = "16px Courier New";
    ctx.fillText(`${Math.floor(p * 100)}%`, canvas.width / 2, by + 34);

    ctx.restore();
    return;
  }

  if (String(step1?.mode || "") === "chinese-chop") {
    const panelW = Math.min(980, canvas.width - 90);
    const panelH = 360;
    const instructionX = canvas.width / 2;
    const instructionY = canvas.height - 172;

    const targets = Array.isArray(step1?.chopTargets) ? step1.chopTargets : ["garlic", "ginger"];
    const targetIndex = Math.max(0, Math.min(targets.length - 1, Number(step1?.chopTargetIndex || 0)));
    const target = targets[targetIndex] || "garlic";
    const targetLabel = String(target).toUpperCase();
    const stage = Math.max(0, Math.min(3, Number(step1?.chopStage || 0)));
    const phase = String(step1?.phase || "chop");

    const phaseText = phase === "sweep"
      ? `${targetLabel} chopped. Sweep into bowl.`
      : `Spam buttons to chop ${targetLabel}`;
    const hintText = phase === "sweep"
      ? "Press GREEN button to sweep"
      : `Chop stage ${Math.max(0, stage)}/3`;

    const board = assets?.smash_board;
    const boardW = 520;
    const boardH = 300;
    const boardX = canvas.width / 2 - boardW / 2;
    const boardY = canvas.height / 2 - boardH / 2 + 40;

    const ingredientSprite = getChineseChopSprite(assets, target, stage);
    const ingredientW = 180;
    const ingredientH = 132;
    const ingredientX = canvas.width / 2 - ingredientW / 2;
    const ingredientY = boardY + boardH / 2 - ingredientH / 2 - 12;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.fillRect(instructionX - 270, instructionY - 52, 540, 108);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.strokeRect(instructionX - 270, instructionY - 52, 540, 108);

    ctx.fillStyle = "#ffe066";
    ctx.font = "bold 30px Courier New";
    ctx.fillText("Step 1: Prep the Garlic and Ginger", instructionX, instructionY - 20);

    ctx.fillStyle = "#d7d7d7";
    ctx.font = "19px Courier New";
    ctx.fillText(phaseText, instructionX, instructionY + 10);
    ctx.fillStyle = "#a7c7ff";
    ctx.font = "15px Courier New";
    ctx.fillText(hintText, instructionX, instructionY + 36);

    if (board) drawImageContain(ctx, board, boardX, boardY, boardW, boardH);
    else {
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(boardX, boardY, boardW, boardH);
    }

    if (ingredientSprite) drawImageContain(ctx, ingredientSprite, ingredientX, ingredientY, ingredientW, ingredientH);

    if (phase === "sweep") {
      const bowl = assets?.chopped_bowl;
      const bowlW = 255;
      const bowlH = 180;
      const bowlX = boardX + boardW + 40;
      const bowlY = boardY + 56;

      if (bowl) {
        drawImageContain(ctx, bowl, bowlX, bowlY, bowlW, bowlH);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(bowlX, bowlY, bowlW, bowlH);
      }

      ctx.fillStyle = "#a7c7ff";
      ctx.font = "27px Courier New";
      ctx.fillText("Sweep into bowl", bowlX + bowlW / 2, bowlY - 24);
      drawButtonIcon(ctx, assets, "W", bowlX + bowlW / 2 - 45, bowlY - 16, 90, { glow: true });
    }

    if (phase === "chop") {
      const barW = Math.min(560, panelW - 120);
      const barH = 18;
      const bx = canvas.width / 2 - barW / 2;
      const by = 168;
      const p = Math.max(0, Math.min(1, Number(step1?.progress || 0)));

      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = "rgba(128,255,114,0.92)";
      ctx.fillRect(bx, by, barW * p, barH);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.strokeRect(bx, by, barW, barH);

      ctx.fillStyle = "#a7c7ff";
      ctx.font = "16px Courier New";
      ctx.fillText(`${Math.floor(p * 100)}%`, canvas.width / 2, by + 34);
    }

    ctx.restore();
    return;
  }

  const panelW = Math.min(980, canvas.width - 90);
  const panelH = 360;
  const panelX = (canvas.width - panelW) / 2;
  const panelY = canvas.height / 2 - panelH / 2;

  const phaseText = {
    lying: "Shell is ready on the board",
    smash: "Spam any button quickly to crack",
    scoop: "Hold green + yellow buttons to scoop (half then full)",
    pound: "Spam to pound smooth paste"
  }[step1?.phase] || "Crack & Make Paste";

  const hintText = {
    lying: "Start smashing now",
    smash: "Press any button very fast",
    scoop: `Hold green + yellow to fill spoon (${Math.max(0, Math.min(Number(step1?.scoopNeed || 2), Number(step1?.scoopStage || 0)))}/${Math.max(1, Number(step1?.scoopNeed || 2))})`,
    pound: "Press any button rapidly"
  }[step1?.phase] || "Use the colored buttons";

  const shell = assets?.smash_shell;
  const crack1 = assets?.smash_crack_1;
  const crack2 = assets?.smash_crack_2;
  const board = assets?.smash_board;
  const splat1 = assets?.smash_splat_1;
  const splat2 = assets?.smash_splat_2;
  const spoonEmpty = assets?.scoop_spoon_empty;
  const spoonHalf = assets?.scoop_spoon_half;
  const spoonFull = assets?.scoop_spoon_full;

  const plateCx = canvas.width / 2;
  const plateCy = canvas.height / 2 + 80;
  const instructionX = canvas.width / 2;
  const instructionY = canvas.height - 172;

  const isOnPlate = true;
  const scoopNeed = Math.max(1, Number(step1?.scoopNeed || 2));
  const scoopStage = Math.max(0, Math.min(scoopNeed, Number(step1?.scoopStage || 0)));
  const scoopIsFinal = scoopStage >= scoopNeed;
  const smashP = Math.max(0, Math.min(1, Number(step1?.smashProgress || 0)));
  const poundP = Math.max(0, Math.min(1, Number(step1?.poundProgress || 0)));

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "rgba(0,0,0,0.52)";
  ctx.fillRect(instructionX - 255, instructionY - 52, 510, 108);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.strokeRect(instructionX - 255, instructionY - 52, 510, 108);

  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 30px Courier New";
  ctx.fillText("Step 1: Crack & Make Paste", instructionX, instructionY - 20);

  ctx.fillStyle = "#d7d7d7";
  ctx.font = "19px Courier New";
  ctx.fillText(phaseText, instructionX, instructionY + 10);
  ctx.fillStyle = "#a7c7ff";
  ctx.font = "15px Courier New";
  ctx.fillText(hintText, instructionX, instructionY + 36);

  const boardX = canvas.width / 2 + 270;
  const boardY = canvas.height / 2 + 56;

  const shellW = 128;
  const shellH = 86;

  const boardW = 468;
  const boardH = 290;
  const boardPlacedX = canvas.width / 2 - boardW / 2;
  const boardPlacedY = canvas.height / 2 - boardH / 2 + 70;

  if (!isOnPlate) {
    const boardStartX = boardX - boardW / 2;
    const boardStartY = boardY - boardH / 2 + 26;
    if (board) ctx.drawImage(board, boardStartX, boardStartY, boardW, boardH);

    const sx = boardX - shellW / 2 - 10;
    const sy = boardY - shellH / 2 + Math.sin((step1?.animT || 0) * 4.5) * 4;
    if (shell) ctx.drawImage(shell, sx, sy, shellW, shellH);
  }

  if (isOnPlate) {
    if (board) drawImageContain(ctx, board, boardPlacedX, boardPlacedY, boardW, boardH);
    else {
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(boardPlacedX, boardPlacedY, boardW, boardH);
    }

    const nx = canvas.width / 2 - shellW / 2 - 22;
    const ny = boardPlacedY + boardH * 0.49 - shellH / 2;

    if (step1?.phase === "smash") {
      const smashNear = Math.max(0, (smashP - 0.72) / 0.28);

      if (splat1 && smashNear > 0.05) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.85, 0.28 + smashNear * 0.5);
        ctx.globalCompositeOperation = "screen";
        ctx.drawImage(splat1, nx - 22, ny + 20, shellW + 44, shellH * 0.75);
        ctx.restore();
      }

      if (splat2 && smashNear > 0.62) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.9, (smashNear - 0.62) / 0.38 * 0.8 + 0.1);
        ctx.globalCompositeOperation = "screen";
        ctx.drawImage(splat2, nx - 28, ny + 18, shellW + 56, shellH * 0.82);
        ctx.restore();
      }
    }

    if (step1?.phase === "scoop") {
      const scoopRatio = Math.max(0, Math.min(1, scoopStage / scoopNeed));
      const spoonImg = scoopIsFinal
        ? (spoonFull || spoonHalf || spoonEmpty)
        : scoopStage >= 1
          ? (spoonHalf || spoonFull || spoonEmpty)
          : (spoonEmpty || spoonHalf || spoonFull);
      const spoonW = 176;
      const spoonH = 114;
      const spoonX = nx + shellW + 44 - scoopRatio * 28;
      const spoonY = ny + 18 + scoopRatio * 12;

      ctx.save();
      ctx.translate(spoonX, spoonY);
      ctx.rotate(-0.58 + scoopRatio * 0.2);
      if (spoonImg) {
        ctx.drawImage(spoonImg, -spoonW / 2, -spoonH / 2, spoonW, spoonH);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(-spoonW / 2, -6, spoonW * 0.8, 12);
      }
      ctx.restore();
    }

    const shellFrame = smashP < 0.35
      ? (shell || crack1 || crack2)
      : smashP < 0.75
        ? (crack1 || shell || crack2)
        : (crack2 || crack1 || shell);

    if (step1?.phase === "pound") {
      const splatFrame = poundP < 0.55 ? (splat1 || splat2) : (splat2 || splat1);
      if (splatFrame) {
        ctx.save();
        ctx.globalAlpha = 0.65 + Math.min(0.3, poundP * 0.3);
        ctx.globalCompositeOperation = "screen";
        ctx.drawImage(splatFrame, nx - 30, ny + 22, shellW + 60, shellH * 0.85);
        ctx.restore();
      }
    }

    if (shellFrame) ctx.drawImage(shellFrame, nx, ny, shellW, shellH);

  }

  const barW = Math.min(560, panelW - 120);
  const barH = 18;
  const bx = canvas.width / 2 - barW / 2;
  const by = 168;

  if (step1?.showProgress) {
    const p = Math.max(0, Math.min(1, Number(step1.progress || 0)));
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = "rgba(128,255,114,0.92)";
    ctx.fillRect(bx, by, barW * p, barH);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.strokeRect(bx, by, barW, barH);

    ctx.fillStyle = "#a7c7ff";
    ctx.font = "16px Courier New";
    ctx.fillText(`${Math.floor(p * 100)}%`, canvas.width / 2, by + 34);
  }

  ctx.restore();
}

/* ===================== END SCREENS ===================== */

export function drawGameOver(ctx, canvas, game = {}, assets = {}) {
  ctx.save();
  ctx.textAlign = "center";

  const panelW = Math.min(900, canvas.width - 80);
  const panelH = Math.min(620, canvas.height - 80);
  const panelX = (canvas.width - panelW) / 2;
  const panelY = (canvas.height - panelH) / 2;

  ctx.fillStyle = "rgba(0,0,0,0.68)";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 58px Courier New";
  ctx.fillText("TIME UP!", canvas.width / 2, panelY + 82);

  ctx.font = "bold 24px Courier New";
  ctx.fillStyle = "#ffe066";
  ctx.fillText(`Your Score: ${game.score || 0}`, canvas.width / 2, panelY + 126);

  ctx.font = "bold 30px Courier New";
  ctx.fillStyle = "#a7c7ff";
  ctx.fillText("LEADERBOARD", canvas.width / 2, panelY + 176);

  const rows = (Array.isArray(game.leaderboard) ? game.leaderboard : [])
    .slice()
    .sort((a, b) => (Number(b?.score || 0) - Number(a?.score || 0)))
    .slice(0, 8);
  ctx.font = "20px Courier New";
  ctx.fillStyle = "#fff";

  if (rows.length === 0) {
    ctx.fillText("No previous scores yet", canvas.width / 2, panelY + 220);
  } else {
    for (let i = 0; i < rows.length; i++) {
      const entry = rows[i];
      const rank = i + 1;
      const score = Number(entry?.score || 0);
      const date = String(entry?.date || "");
      const y = panelY + 220 + i * 40;
      const time = String(entry?.time || "--:--");
      ctx.fillText(`${rank}. ${score}  (${date}${time ? ` ${time}` : ""})`, canvas.width / 2, y);
    }
  }

  const icon = assets?.btn_q || assets?.["blue-btn"];
  const btnSize = 58;
  const bx = canvas.width / 2 - 170;
  const by = panelY + panelH - 76;
  if (icon) ctx.drawImage(icon, bx, by - btnSize / 2, btnSize, btnSize);
  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 22px Courier New";
  ctx.textAlign = "left";
  ctx.fillText("Press Q to return to title", bx + 72, by + 8);
  ctx.restore();
}

export function drawWin(ctx, canvas, game = {}, assets = {}) {
  ctx.save();
  ctx.textAlign = "center";

  const panelW = Math.min(900, canvas.width - 80);
  const panelH = Math.min(620, canvas.height - 80);
  const panelX = (canvas.width - panelW) / 2;
  const panelY = (canvas.height - panelH) / 2;

  ctx.fillStyle = "rgba(0,0,0,0.68)";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 58px Courier New";
  ctx.fillText("DISH COMPLETE!", canvas.width / 2, panelY + 82);

  ctx.font = "bold 24px Courier New";
  ctx.fillStyle = "#ffe066";
  ctx.fillText(`Your Score: ${game.score || 0}`, canvas.width / 2, panelY + 124);

  const slug = String(game.currentDish?.name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
  const dishArt = assets?.[`dish_${slug}`] || assets?.[`dish-${slug}`];
  if (dishArt) {
    const artW = 330;
    const ratio = dishArt.width > 0 ? (dishArt.height / dishArt.width) : 0.62;
    const artH = Math.round(artW * ratio);
    const artX = canvas.width / 2 - artW / 2;
    const artY = panelY + 145;

    const glow = ctx.createRadialGradient(
      canvas.width / 2, artY + artH / 2, 12,
      canvas.width / 2, artY + artH / 2, Math.max(artW, artH) * 0.8
    );
    glow.addColorStop(0, "rgba(255, 224, 102, 0.55)");
    glow.addColorStop(1, "rgba(255, 224, 102, 0.00)");
    ctx.fillStyle = glow;
    ctx.fillRect(artX - 80, artY - 80, artW + 160, artH + 160);

    ctx.save();
    ctx.shadowColor = "rgba(255, 224, 102, 0.75)";
    ctx.shadowBlur = 24;
    ctx.drawImage(dishArt, artX, artY, artW, artH);
    ctx.restore();
  }

  ctx.font = "bold 30px Courier New";
  ctx.fillStyle = "#a7c7ff";
  ctx.fillText("LEADERBOARD", canvas.width / 2, panelY + 410);

  const rows = (Array.isArray(game.leaderboard) ? game.leaderboard : [])
    .slice()
    .sort((a, b) => (Number(b?.score || 0) - Number(a?.score || 0)))
    .slice(0, 4);
  ctx.font = "20px Courier New";
  ctx.fillStyle = "#fff";
  if (rows.length === 0) {
    ctx.fillText("No previous scores yet", canvas.width / 2, panelY + 448);
  } else {
    for (let i = 0; i < rows.length; i++) {
      const entry = rows[i];
      const rank = i + 1;
      const score = Number(entry?.score || 0);
      const date = String(entry?.date || "");
      const y = panelY + 448 + i * 30;
      const time = String(entry?.time || "--:--");
      ctx.fillText(`${rank}. ${score}  (${date}${time ? ` ${time}` : ""})`, canvas.width / 2, y);
    }
  }

  const icon = assets?.btn_q || assets?.["blue-btn"];
  const btnSize = 58;
  const bx = canvas.width / 2 - 170;
  const by = panelY + panelH - 28;
  if (icon) ctx.drawImage(icon, bx, by - btnSize / 2, btnSize, btnSize);
  ctx.fillStyle = "#ffe066";
  ctx.font = "bold 22px Courier New";
  ctx.textAlign = "left";
  ctx.fillText("Press Q to return to title", bx + 72, by + 8);
  ctx.restore();
}

