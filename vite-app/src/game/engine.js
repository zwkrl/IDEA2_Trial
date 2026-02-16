// src/game/engine.js
import { ensureAudio, playBeep } from "./audio.js";
import { dishes, keyLabels, PENALTY, ingredientPool } from "./data.js";
import {
  drawBackground,
  drawTopStack,
  drawComboFlames,
  drawPlate,
  drawInstructions,
  drawTitle,
  drawLanding,
  drawScanScreen,
  drawDishSelect,
  drawGameOver,
  drawWin
} from "./render.js";

export function createGame({ canvas, startBtn, restartBtn, hud }) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const QWER_CODES = ["KeyQ", "KeyW", "KeyE", "KeyR"];

  // Testing bypass (?test=true) [web:58]
  const urlParams = new URLSearchParams(window.location.search);
  const testMode = urlParams.get("test") === "true";

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
    shakeHz: 1,

    currentDish: null,
    sequence: [],
    keyMap: [],

    steps: [],
    stepIndex: 0,
    stepProgress: 0,

    ingCounts: {},
    plateIcons: [], // array of { ing, t }

    // Cook combo state (existing system)
    cookSeq: [],
    cookSeqIndex: 0,
    cookIconsDone: [],
    cookIconJitter: [],
    cookCombosDone: 0,
    cookCombosNeed: 2,

    shake: 0,
    dishCountdown: 0
  };

  game.scan = {
    dish: null,
    ingredients: [],
    statusByIng: {},
    input: "",
    inputColor: "rgba(255,255,255,0.35)",
    message: "",
    messageColor: "#d7d7d7",
    messageT: 0
  };

  let dishOptions = [];
  let titleTime = 0;
  let timer = null;
  let assetsLoaded = false;
  let lastFrameTs = null;

  const alertState = { text: "", color: "rgba(255,255,255,0)", ttl: 0 };

  function setAlert(text, color, ttl = 0.85) {
    alertState.text = String(text || "");
    alertState.color = color;
    alertState.ttl = ttl;
  }

  function updateAlert(dt) {
    if (alertState.ttl > 0) alertState.ttl = Math.max(0, alertState.ttl - dt);
  }

  function updateHUD() {
    hud.scoreEl.textContent = game.score;
    hud.comboEl.textContent = game.combo + "x";
    hud.timeEl.textContent = game.time;
  }

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

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function resetCookIcons() {
    game.cookSeq = [];
    game.cookSeqIndex = 0;
    game.cookIconsDone = [];
    game.cookIconJitter = [];
  }

  function resetStepState() {
    game.stepProgress = 0;
    resetCookIcons();
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

  function pickDishOptions() {
    const pool = [...dishes];
    shuffle(pool);
    dishOptions = pool.slice(0, 4);
  }

  function loadDish(selectedDish) {
    game.currentDish = selectedDish || dishes[Math.floor(Math.random() * dishes.length)];
    game.plateIcons = [];
    game.sequence = [...game.currentDish.ingredients];

    game.keyMap = [...game.sequence];
    shuffle(game.keyMap);

    game.steps = (game.currentDish.steps || []).map(s => ({ ...s }));
    game.stepIndex = 0;
    resetStepState();
    game.cookCombosDone = 0;

    initDishCounts();
    startDishCountdown(3);
  }

  function resetScanState(selectedDish) {
    const ingredients = [...(selectedDish?.ingredients || [])];
    const statusByIng = {};
    for (const ing of ingredients) statusByIng[ing] = "pending";

    game.scan = {
      dish: selectedDish || null,
      ingredients,
      statusByIng,
      input: "",
      inputColor: "rgba(255,255,255,0.35)",
      messageColor: "#d7d7d7",
      messageT: 0
    };
  }

  function startScan(selectedDish) {
    resetScanState(selectedDish);
    game.state = "scan";
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

  function generateCookSeq() {
    const len = Math.max(4, Math.min(6, 4 + Math.floor(game.cookCombosDone / 1)));
    const seq = [];
    for (let i = 0; i < len; i++) seq.push(QWER_CODES[Math.floor(Math.random() * QWER_CODES.length)]);
    return seq;
  }

  function ensureCookSeqReady(step) {
    if (!step || step.type !== "cook") return;
    if (game.cookSeq.length > 0) return;

    const seq = generateCookSeq();
    game.cookSeq = seq;
    game.cookSeqIndex = 0;
    game.cookIconsDone = seq.map(() => false);
    game.cookIconJitter = seq.map(() => 0);

    setAlert("COOK: match the icons (QWER)", "rgba(255, 224, 102, 0.95)", 0.9);
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
      if (step.type === "serve") setAlert("SERVE: press W", "rgba(128, 255, 114, 0.92)", 0.9);
      else if (step.type === "cook") setAlert("COOK: match the icons (QWER)", "rgba(255, 224, 102, 0.90)", 0.9);
      else setAlert(`NEXT: ${step.label}`, "rgba(255, 224, 102, 0.90)", 0.9);
    }
  }

  function setScanFeedback(text, color, ttl = 0.8) {
    game.scan.message = text;
    game.scan.messageColor = color;
    game.scan.inputColor = color;
    game.scan.messageT = ttl;
  }

  function updateScanFeedback(dt) {
    if (game.state !== "scan") return;
    if (game.scan.messageT > 0) {
      game.scan.messageT = Math.max(0, game.scan.messageT - dt);
      if (game.scan.messageT === 0) {
        game.scan.messageColor = "#d7d7d7";
        game.scan.inputColor = "rgba(255,255,255,0.35)";
      }
    }
  }

  function startGame(selectedDish) {
    game.uniqueDishesCompleted = new Set();
    game.dishesToWin = dishes.length;

    game.score = 0;
    game.combo = 0;
    game.time = 180;
    game.state = "playing";

    startBtn.style.display = "none";
    restartBtn.style.display = "block";

    loadDish(selectedDish);
    updateHUD();

    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (game.state !== "playing") { clearInterval(timer); timer = null; return; }
      game.time--;
      updateHUD();
      if (game.time <= 0) game.state = "gameover";
    }, 1000);
  }

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
    const need = game.ingCounts[ing].need;
    game.ingCounts[ing].done = Math.min(need || Infinity, (game.ingCounts[ing].done || 0) + 1);
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

  // SUCCESS: count it
  incDoneForStep(step, pressedIngredient);

  // ENHANCEMENT: also place icon on plate
  if (!Array.isArray(game.plateIcons)) game.plateIcons = [];
  game.plateIcons.push({ ing: pressedIngredient, t: performance.now() }); // [web:224]
  if (game.plateIcons.length > 24) game.plateIcons.shift();

  awardStepPoints(step.type === "prep" ? 0.40 : 0.55);

  if (stepIsComplete(step)) {
    setAlert("STEP COMPLETE!", "rgba(128, 255, 114, 0.92)", 0.7);
    awardStepPoints(1.1);
    advanceStep();
  }
}


  function triggerCookIconJitter(i) {
    if (!Array.isArray(game.cookIconJitter)) return;
    if (i < 0 || i >= game.cookIconJitter.length) return;
    game.cookIconJitter[i] = 0.25;
  }

  function handleCookKey(code, step) {
    ensureCookSeqReady(step);

    const expected = game.cookSeq[game.cookSeqIndex];
    if (!expected) return;

    if (code === expected) {
      game.cookIconsDone[game.cookSeqIndex] = true;
      game.cookSeqIndex++;
      playBeep(660, 0.05);

      if (game.cookSeqIndex >= game.cookSeq.length) {
        game.cookCombosDone++;
        awardStepPoints(1.15);
        setAlert("COOK COMBO COMPLETE!", "rgba(128, 255, 114, 0.92)", 0.7);

        const chunk = 1 / Math.max(1, game.cookCombosNeed);
        game.stepProgress = Math.min(1, game.stepProgress + chunk);

        resetCookIcons();
        ensureCookSeqReady(step);
      }
    } else {
      triggerCookIconJitter(game.cookSeqIndex);
      applyPenalty("wrongStir");
      game.cookSeqIndex = 0;
      game.cookIconsDone = game.cookIconsDone.map(() => false);
    }
  }

  function onKeyDown(e) {
    if (game.state === "scan") {
      const key = String(e.key);

      if (key === "Backspace") {
        game.scan.input = game.scan.input.slice(0, -1);
        return;
      }

      if (key === "Enter") {
        const raw = game.scan.input.trim();
        game.scan.input = "";

        if (!raw) {
          setScanFeedback("ENTER AN ID", "rgba(255, 224, 102, 0.95)", 0.6);
          return;
        }

        const id = Number(raw);
        const match = game.scan.ingredients.find((ing) => ingredientPool[ing]?.id === id);

        if (!match) {
          setScanFeedback("ID NOT FOUND", "rgba(255, 89, 94, 0.95)", 0.8);
          return;
        }

        if (game.scan.statusByIng[match] === "correct") {
          setScanFeedback("ALREADY SCANNED", "rgba(255, 89, 94, 0.95)", 0.8);
          return;
        }

        game.scan.statusByIng[match] = "correct";
        setScanFeedback(`${match.toUpperCase()} OK`, "rgba(128, 255, 114, 0.95)", 0.8);

        const allDone = game.scan.ingredients.every((ing) => game.scan.statusByIng[ing] === "correct");
        if (allDone) startGame(game.scan.dish);
        return;
      }

      if (/^\d$/.test(key)) {
        if (game.scan.input.length < 4) game.scan.input += key;
      }
      return;
    }

    if (game.state === "dish-select") {
      const key = String(e.key).toUpperCase();
      const idx = keyLabels.indexOf(key);
      if (idx !== -1 && dishOptions[idx]) startScan(dishOptions[idx]);
      return;
    }

    if (game.state !== "playing") return;
    if (game.dishCountdown > 0) return;
    if (e.repeat) return;

    const code = e.code;
    const step = currentStep();
    if (!step) return;

    const qwerIndex = QWER_CODES.indexOf(code);
    if (qwerIndex === -1) return;

    e.preventDefault();

    if (step.type === "serve") {
      if (code === "KeyW") {
        awardStepPoints(1.0);
        setAlert("SERVED!", "rgba(128, 255, 114, 0.92)", 0.55);
        advanceStep();
      } else {
        applyPenalty("wrongEnter");
        setAlert("SERVE = W", "rgba(255, 89, 94, 0.92)", 0.75);
      }
      return;
    }

    if (step.type === "cook") {
      handleCookKey(code, step);
      return;
    }

    if (step.type === "prep" || step.type === "action") {
      const pressedIngredient = ingredientForKeyIndex(qwerIndex);
      handlePrepOrActionPress(pressedIngredient);
    }
  }

  document.addEventListener("keydown", onKeyDown);

  function onCanvasClick(e) {
    if (game.state !== "dish-select") return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const count = Math.min(4, dishOptions.length);
    if (count === 0) return;

    const pad = 26;
    const panelW = Math.min(1400, canvas.width - 80);
    const cardW = (panelW - pad * (count - 1)) / count;
    const cardH = 320;
    const startX = (canvas.width - panelW) / 2;
    const startY = canvas.height / 2 - 120;

    for (let i = 0; i < count; i++) {
      const cx = startX + i * (cardW + pad);
      const cy = startY;
      const inside = x >= cx && x <= cx + cardW && y >= cy && y <= cy + cardH;
      if (inside && dishOptions[i]) {
        startScan(dishOptions[i]);
        return;
      }
    }
  }

  canvas.addEventListener("click", onCanvasClick);

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

  function updateCookStep(dt) {
    const step = currentStep();
    if (!step || step.type !== "cook") return;

    ensureCookSeqReady(step);

    for (let i = 0; i < game.cookIconJitter.length; i++) {
      if (game.cookIconJitter[i] > 0) game.cookIconJitter[i] = Math.max(0, game.cookIconJitter[i] - dt);
    }

    const denom = Math.max(0.2, step.time || 1);
    game.stepProgress += dt / denom;

    if (game.stepProgress >= 1 && game.cookCombosDone < game.cookCombosNeed) {
      applyPenalty("wrongStir");
      setAlert("COOK FAILED!", "rgba(255, 89, 94, 0.92)", 0.8);
    }

    if (game.stepProgress >= 1) {
      setAlert("COOKED! SERVE NEXT", "rgba(255, 224, 102, 0.92)", 0.8);
      advanceStep();
    }
  }

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

    if (game.state === "scan") updateScanFeedback(dt);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(ctx, canvas, assets);

    if (game.state === "menu") {
      titleTime += 0.05;
      drawLanding(ctx, canvas, titleTime);
      drawTitle(ctx, canvas, titleTime);
    }

    if (game.state === "dish-select") {
      drawDishSelect(ctx, canvas, dishOptions, keyLabels, assets);
    }

    if (game.state === "scan") {
      drawScanScreen(ctx, canvas, game.scan, assets);
    }

    if (game.state === "playing") {
      const uiBottomY = drawTopStack(ctx, canvas, game, alertState);

      let y = uiBottomY;
      y += drawComboFlames(ctx, canvas, game, y) + 10;

      if (game.shake > 0) game.shake--;

      drawPlate(ctx, canvas, game, assets, y);

      drawInstructions(ctx, canvas, game, {
        currentStep,
        getNeededForStep,
        getDoneForStep,
        keyLabelForIngredient,
        assets
      });
    }

    if (game.state === "gameover") drawGameOver(ctx, canvas);
    if (game.state === "win") drawWin(ctx, canvas);

    requestAnimationFrame(loop);
  }

  return {
    async onStartClick() {
      await ensureAudio();
      if (!assetsLoaded) {
        startBtn.textContent = "LOADING...";
        await loadAssets();
        assetsLoaded = true;
        startBtn.textContent = "START GAME";
      }

      if (testMode) {
        startGame();
        return;
      }

      pickDishOptions();
      game.state = "dish-select";
      startBtn.style.display = "none";
      restartBtn.style.display = "none";
    },
    restart() {
      if (testMode) {
        startGame();
        return;
      }

      pickDishOptions();
      game.state = "dish-select";
      startBtn.style.display = "none";
      restartBtn.style.display = "none";
    },
    loop
  };
}
