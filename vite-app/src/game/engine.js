// src/game/engine.js
import { ensureAudio, playBeep } from "./audio.js";
import { dishes, keyLabels, PENALTY } from "./data.js";
import {
  drawBackground,
  drawHeroAlert,
  drawPlate,
  drawComboFlames,
  drawDishInfo,
  drawInstructions,
  drawTitle,
  drawGameOver,
  drawWin
} from "./render.js";

export function createGame({ canvas, startBtn, restartBtn, hud }) {
  /* ================= CANVAS ================= */
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  /* ================= ASSETS ================= */
  const assets = {};

  function loadImage(key, src) {
    return new Promise((res) => {
      const img = new Image();
      img.src = src;
      img.onload = () => { assets[key] = img; res(true); };
      img.onerror = () => res(false);
    });
  }

  async function loadAssets() {
    await Promise.all([
      loadImage("bg", "/assets/background/kitchen.png"),
      loadImage("plate", "/assets/ui/plate.png"),

      loadImage("chicken", "/assets/ingredients/chicken.png"),
      loadImage("pork", "/assets/ingredients/pork.png"),
      loadImage("garlic", "/assets/ingredients/garlic.png"),
      loadImage("ginger", "/assets/ingredients/ginger.png"),
      loadImage("chili", "/assets/ingredients/chili.png"),
      loadImage("shrimp", "/assets/ingredients/shrimp.png"),
      loadImage("coconut", "/assets/ingredients/coconut.png"),
      loadImage("rice", "/assets/ingredients/rice.png")
    ]);
  }

  /* ================= GAME STATE ================= */
  const game = {
    state: "menu",
    score: 0,
    combo: 0,
    time: 180,

    uniqueDishesCompleted: new Set(),
    dishesToWin: dishes.length,

    shakeOffsetX: 0,
    shakeOffsetY: 0,
    shakeSampleT: 0,
    shakeHz: 1, // lower = slower vibration

    currentDish: null,

    sequence: [],
    keyMap: [],

    steps: [],
    stepIndex: 0,

    stepProgress: 0,

    ingCounts: {},

    spaceHeld: false,
    stirredThisStep: false,
    missedStirThisStep: false,

    shake: 0,
    dishCountdown: 0
  };

  let titleTime = 0;
  let timer = null;
  let assetsLoaded = false;
  let lastFrameTs = null;

  /* ================= HERO ALERTS ================= */
  const alertState = { text: "", color: "rgba(255,255,255,0)", ttl: 0 };

  function setAlert(text, color, ttl = 0.85) {
    alertState.text = String(text || "");
    alertState.color = color;
    alertState.ttl = ttl;
  }
  function updateAlert(dt) {
    if (alertState.ttl > 0) alertState.ttl = Math.max(0, alertState.ttl - dt);
  }

  /* ================= HUD ================= */
  function updateHUD() {
    hud.scoreEl.textContent = game.score;
    hud.comboEl.textContent = game.combo + "x";
    hud.timeEl.textContent = game.time;
  }

  /* ================= PENALTIES ================= */
  function applyPenalty(kind = "wrongInput") {
    let scoreLoss = PENALTY.wrongInputScore;
    let timeLoss = PENALTY.wrongInputTime;

    if (kind === "wrongEnter") { scoreLoss = PENALTY.wrongEnterScore; timeLoss = PENALTY.wrongEnterTime; }
    if (kind === "wrongStir") { scoreLoss = PENALTY.wrongStirScore; timeLoss = PENALTY.wrongStirTime; }

    game.score = Math.max(0, game.score - scoreLoss);
    game.time = Math.max(0, game.time - timeLoss);

    if (PENALTY.comboReset) game.combo = 0;
    game.shake = Math.max(game.shake, PENALTY.shake);

    playBeep(170);
    setAlert("WRONG!", "rgba(255, 89, 94, 0.90)", 0.55);
    updateHUD();
  }

  /* ================= FLOW ================= */
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function resetStepState() {
    game.stepProgress = 0;
    game.stirredThisStep = false;
    game.missedStirThisStep = false;
    game.spaceHeld = false;
  }

  function startDishCountdown(seconds = 3) {
    game.dishCountdown = seconds;
    setAlert(`NEXT DISH IN ${seconds}`, "rgba(255, 224, 102, 0.95)", 0.95);
    playBeep(520, 0.06);
  }

  function initDishCounts() {
    const counts = {};
    for (const st of (game.currentDish?.steps || [])) {
      if (st && (st.type === "prep" || st.type === "action") && st.counts) {
        for (const [ing, needRaw] of Object.entries(st.counts)) {
          const need = Math.max(0, Number(needRaw) || 0);
          if (!counts[ing]) counts[ing] = { done: 0, need: 0 };
          counts[ing].need += need;
        }
      }
    }
    game.ingCounts = counts;
  }

  function loadDish() {
    game.currentDish = dishes[Math.floor(Math.random() * dishes.length)];
    game.sequence = [...game.currentDish.ingredients];

    game.keyMap = [...game.sequence];
    shuffle(game.keyMap);

    game.steps = (game.currentDish.steps || []).map(s => ({ ...s }));
    game.stepIndex = 0;
    resetStepState();

    initDishCounts();
    startDishCountdown(3);
  }

  function currentStep() {
    return game.steps[game.stepIndex] || null;
  }

  function awardStepPoints(mult = 1) {
    game.combo++;
    game.score += Math.floor((120 + game.combo * 25) * mult);
    playBeep(720);
    updateHUD();
  }

  function finishDish() {
    game.score += 1000;
    game.combo += 2;

    if (game.currentDish?.name) game.uniqueDishesCompleted.add(game.currentDish.name);

    if (game.uniqueDishesCompleted.size >= game.dishesToWin) {
      game.state = "win";
      setAlert("ALL UNIQUE DISHES COMPLETE!", "rgba(128, 255, 114, 0.92)", 1.2);

      if (timer) { clearInterval(timer); timer = null; }

      startBtn.textContent = "PLAY AGAIN";
      startBtn.style.display = "block";
      restartBtn.style.display = "none";

      updateHUD();
      return;
    }

    setAlert("DISH COMPLETE!", "rgba(128, 255, 114, 0.92)", 0.9);
    loadDish();
    updateHUD();
  }

  function advanceStep() {
    game.stepIndex++;
    resetStepState();

    if (game.stepIndex >= game.steps.length) {
      finishDish();
      return;
    }

    const step = currentStep();
    if (step) {
      if (step.type === "serve") setAlert("SERVE NOW: ENTER", "rgba(128, 255, 114, 0.92)", 0.9);
      else if (step.type === "cook") setAlert("COOKING...", "rgba(255, 224, 102, 0.90)", 0.75);
      else setAlert(`NEXT: ${step.label}`, "rgba(255, 224, 102, 0.90)", 0.9);
    }
  }

  function startGame() {
    game.uniqueDishesCompleted = new Set();
    game.dishesToWin = dishes.length;

    game.score = 0;
    game.combo = 0;
    game.time = 180;
    game.state = "playing";

    startBtn.style.display = "none";
    restartBtn.style.display = "block";

    loadDish();
    updateHUD();

    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (game.state !== "playing") { clearInterval(timer); timer = null; return; }
      game.time--;
      updateHUD();
      if (game.time <= 0) game.state = "gameover";
    }, 1000);
  }

  /* ================= COUNT HELPERS ================= */
  function getNeededForStep(step, ing) {
    if (!step) return 0;
    if (step.counts && step.counts[ing] != null) return Math.max(0, Number(step.counts[ing]) || 0);
    return 0;
  }
  function getDoneForStep(step, ing) {
    if (!step || !step._doneCounts) return 0;
    return Math.max(0, Number(step._doneCounts[ing]) || 0);
  }
  function incDoneForStep(step, ing) {
    if (!step._doneCounts) step._doneCounts = {};
    step._doneCounts[ing] = (step._doneCounts[ing] || 0) + 1;

    if (!game.ingCounts[ing]) game.ingCounts[ing] = { done: 0, need: 0 };
    game.ingCounts[ing].done = Math.min(game.ingCounts[ing].need || Infinity, (game.ingCounts[ing].done || 0) + 1);
  }
  function stepIsComplete(step) {
    if (!step) return false;
    if (step.type !== "prep" && step.type !== "action") return false;
    if (!step.counts) return false;

    for (const [ing, needRaw] of Object.entries(step.counts)) {
      const need = Math.max(0, Number(needRaw) || 0);
      if (getDoneForStep(step, ing) < need) return false;
    }
    return true;
  }

  /* ================= INPUT HELPERS ================= */
  function ingredientForKeyIndex(index) {
    return game.keyMap[index];
  }
  function keyLabelForIngredient(ing) {
    const idx = game.keyMap.indexOf(ing);
    return idx >= 0 ? keyLabels[idx] : "?";
  }

  function handlePrepOrActionPress(pressedIngredient) {
    const step = currentStep();
    if (!step) return;

    const allowed = step.uses || [];
    if (allowed.length > 0 && !allowed.includes(pressedIngredient)) {
      applyPenalty("wrongInput");
      return;
    }

    const need = getNeededForStep(step, pressedIngredient);
    if (need <= 0) {
      applyPenalty("wrongInput");
      return;
    }

    const done = getDoneForStep(step, pressedIngredient);
    if (done >= need) {
      applyPenalty("wrongInput");
      setAlert("TOO MANY OF THAT INGREDIENT", "rgba(255, 89, 94, 0.92)", 0.8);
      return;
    }

    incDoneForStep(step, pressedIngredient);
    awardStepPoints(step.type === "prep" ? 0.40 : 0.55);

    if (stepIsComplete(step)) {
      setAlert("STEP COMPLETE!", "rgba(128, 255, 114, 0.92)", 0.7);
      awardStepPoints(1.1);
      advanceStep();
    }
  }

  /* ================= INPUT ================= */
  function onKeyDown(e) {
    if (game.state !== "playing") return;

    const key = String(e.key);
    const isSpace = (key === " " || key === "Spacebar");
    const isEnter = (key === "Enter");

    if (isSpace) game.spaceHeld = true;
    if (game.dishCountdown > 0) return;
    if (e.repeat && !isSpace) return;

    const step = currentStep();
    if (!step) return;

    if (step.type === "serve") {
      if (isEnter) {
        awardStepPoints(1.0);
        setAlert("SERVED!", "rgba(128, 255, 114, 0.92)", 0.55);
        advanceStep();
      } else {
        applyPenalty("wrongEnter");
        setAlert("PRESS ENTER TO SERVE", "rgba(255, 89, 94, 0.92)", 0.75);
      }
      return;
    }

    if (step.type === "cook") {
      if (isEnter) {
        applyPenalty("wrongEnter");
        setAlert("NO ENTER — SERVE LATER", "rgba(255, 89, 94, 0.92)", 0.7);
        return;
      }

      const idx = keyLabels.indexOf(String(key).toUpperCase());
      if (idx !== -1) {
        applyPenalty("wrongInput");
        setAlert("COOKING... NO INGREDIENTS", "rgba(255, 89, 94, 0.92)", 0.75);
      }
      return;
    }

    const index = keyLabels.indexOf(String(key).toUpperCase());
    if (index === -1) return;

    const pressedIngredient = ingredientForKeyIndex(index);
    if (step.type === "prep" || step.type === "action") handlePrepOrActionPress(pressedIngredient);
  }

  function onKeyUp(e) {
    const key = String(e.key);
    const isSpace = (key === " " || key === "Spacebar");
    if (isSpace) game.spaceHeld = false;
  }

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  /* ================= COUNTDOWN UPDATE ================= */
  let dishCountdownAccum = 0;

  function updateDishCountdown(dt) {
    if (game.dishCountdown <= 0) return;
    dishCountdownAccum += dt;

    if (dishCountdownAccum >= 1.0) {
      dishCountdownAccum = 0;
      game.dishCountdown -= 1;

      if (game.dishCountdown > 0) {
        setAlert(`NEXT DISH IN ${game.dishCountdown}`, "rgba(255, 224, 102, 0.95)", 0.95);
        playBeep(520, 0.06);
      } else {
        setAlert("GO!", "rgba(128, 255, 114, 0.92)", 0.7);
        playBeep(820, 0.08);
      }
    }
  }

  /* ================= COOK UPDATE ================= */
  function updateCookStep(dt) {
    const step = currentStep();
    if (!step || step.type !== "cook") return;

    const denom = Math.max(0.2, step.time || 1);
    game.stepProgress += dt / denom;

    const win = step.stirPerfectWindow;
    if (win) {
      const p = game.stepProgress;
      const inside = (p >= win[0] && p <= win[1]);

      if (!game.stirredThisStep && game.spaceHeld && inside) {
        game.stirredThisStep = true;
        awardStepPoints(1.2);
        playBeep(660);
        setAlert("PERFECT STIR!", "rgba(128, 255, 114, 0.92)", 0.5);
      }

      if (!game.stirredThisStep && !game.missedStirThisStep && p > win[1]) {
        game.missedStirThisStep = true;
        applyPenalty("wrongStir");
        setAlert("MISSED STIR!", "rgba(255, 89, 94, 0.92)", 0.7);
      }
    } else {
      if (game.spaceHeld && game.stepProgress < 1) {
        applyPenalty("wrongStir");
        setAlert("NO STIR NEEDED", "rgba(255, 89, 94, 0.92)", 0.55);
        game.spaceHeld = false;
      }
    }

    if (game.stepProgress >= 1) {
      setAlert("COOKED! SERVE NEXT", "rgba(255, 224, 102, 0.92)", 0.8);
      advanceStep();
    }
  }

  /* ================= SHAKE UPDATE ================= */
  function updateShake(dt) {
    if (game.shake > 0) game.shake = Math.max(0, game.shake - 0.8);

    game.shakeSampleT += dt;
    const interval = 1 / game.shakeHz;

    if (game.shakeSampleT >= interval) {
      game.shakeSampleT = 0;
      game.shakeOffsetX = (Math.random() - 0.5) * game.shake;
      game.shakeOffsetY = (Math.random() - 0.5) * game.shake;
    }
  }

  /* ================= LOOP ================= */
  function loop(ts) {
    if (lastFrameTs == null) lastFrameTs = ts;
    const dt = Math.min(0.05, (ts - lastFrameTs) / 1000);
    lastFrameTs = ts;

    if (game.state === "playing") {
      updateDishCountdown(dt);
      updateShake(dt);
      if (game.dishCountdown <= 0) updateCookStep(dt);
      updateAlert(dt);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(ctx, canvas, assets);

    if (game.state === "menu") {
      titleTime += 0.05;
      drawTitle(ctx, canvas, titleTime);
    }

    if (game.state === "playing") {
      drawDishInfo(ctx, canvas, game);
      drawHeroAlert(ctx, canvas, alertState);

      if (game.shake > 0) game.shake--;

      drawPlate(ctx, canvas, game, assets);
      drawComboFlames(ctx, canvas, game);

      drawInstructions(ctx, canvas, game, {
        currentStep,
        getNeededForStep,
        getDoneForStep,
        keyLabelForIngredient
      });
    }

    if (game.state === "gameover") drawGameOver(ctx, canvas);
    if (game.state === "win") drawWin(ctx, canvas);

    requestAnimationFrame(loop);
  }

  /* ================= PUBLIC API ================= */
  return {
    async onStartClick() {
      await ensureAudio();

      if (!assetsLoaded) {
        startBtn.textContent = "LOADING...";
        await loadAssets();
        assetsLoaded = true;
        startBtn.textContent = "START GAME";
      }

      startGame();
    },
    restart() {
      startGame();
    },
    loop
  };
}
