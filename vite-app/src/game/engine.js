export function createGame({ canvas, startBtn, restartBtn, hud }) {
  /* ================= CANVAS ================= */
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  /* ================= AUDIO ================= */
  let audioCtx = null;

  async function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") await audioCtx.resume();
  }

  function playBeep(freq = 500, dur = 0.08) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }

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

  /* ================= DATA ================= */
  const ingredientPool = {
    chicken: { sprite: "chicken" },
    pork: { sprite: "pork" },
    garlic: { sprite: "garlic" },
    ginger: { sprite: "ginger" },
    chili: { sprite: "chili" },
    shrimp: { sprite: "shrimp" },
    coconut: { sprite: "coconut" },
    rice: { sprite: "rice" }
  };

  const STIR_WIDTH = 0.40;       // 40%
  const STIR_CENTER = 0.50;      // middle of the bar

  const STIR_PERFECT = [
    STIR_CENTER - STIR_WIDTH / 2,
    STIR_CENTER + STIR_WIDTH / 2
  ];

  const dishes = [
    {
      name: "AYAM BUAH KELUAK",
      culture: "Peranakan",
      ingredients: ["chicken", "garlic", "ginger", "chili"],
      steps: [
        { type: "prep", label: "Blend rempah (hit the right keys)", uses: ["garlic","ginger","chili"], counts: { garlic: 3, ginger: 3, chili: 4 } },
        { type: "cook", label: "Fry rempah (HOLD SPACE in green)", time: 4.0, stirPerfectWindow: STIR_PERFECT },
        { type: "serve", label: "Serve: press ENTER" },
        { type: "action", label: "Coat chicken", uses: ["chicken"], counts: { chicken: 3 } },
        { type: "cook", label: "Simmer until tender (HOLD SPACE in green)", time: 4.0, stirPerfectWindow: STIR_PERFECT },
        { type: "serve", label: "Serve: press ENTER" }
      ]
    },
    {
      name: "CURRY FENG",
      culture: "Eurasian",
      ingredients: ["pork", "garlic", "ginger", "chili"],
      steps: [
        { type: "prep", label: "Prep aromatics", uses: ["garlic","ginger"], counts: { garlic: 4, ginger: 4 } },
        { type: "cook", label: "Fry aromatics (HOLD SPACE in green)", time: 4.0, stirPerfectWindow: STIR_PERFECT },
        { type: "serve", label: "Serve: press ENTER" },
        { type: "action", label: "Add pork", uses: ["pork"], counts: { pork: 2 } },
        { type: "cook", label: "Simmer curry (HOLD SPACE in green)", time: 4.0, stirPerfectWindow: STIR_PERFECT },
        { type: "serve", label: "Serve: press ENTER" }
      ]
    },
    {
      name: "LAKSA SIGLAP",
      culture: "Malay",
      ingredients: ["shrimp", "coconut", "chili", "rice"],
      steps: [
        // NEW: chili entry step BEFORE chili paste stirring step
        { type: "action", label: "Add chili (make the paste)", uses: ["chili"], counts: { chili: 3 } },

        // UPDATED: cook step total time = 8 seconds
        { type: "cook", label: "Sauté chili paste (HOLD SPACE in green)", time: 4.0, stirPerfectWindow: STIR_PERFECT },
        { type: "serve", label: "Serve: press ENTER" },

        { type: "action", label: "Add coconut milk", uses: ["coconut"], counts: { coconut: 2 } },
        { type: "cook", label: "Simmer broth (HOLD SPACE in green)", time: 4.0, stirPerfectWindow: STIR_PERFECT },
        { type: "serve", label: "Serve: press ENTER" },

        { type: "action", label: "Add shrimp", uses: ["shrimp"], counts: { shrimp: 3 } },

        { type: "cook", label: "Cook shrimp quickly (no stir)", time: 4.0, stirPerfectWindow: null },
        { type: "serve", label: "Serve: press ENTER" },

        { type: "action", label: "Serve with rice", uses: ["rice"], counts: { rice: 2 } },
        { type: "serve", label: "Final serve: press ENTER" }
      ]
    },
    {
      name: "LOR KAI YIK",
      culture: "Chinese",
      ingredients: ["chicken", "garlic", "ginger", "rice"],
      steps: [
        { type: "prep", label: "Prep garlic/ginger", uses: ["garlic","ginger"], counts: { garlic: 3, ginger: 4 } },

        { type: "action", label: "Add chicken pieces", uses: ["chicken"], counts: { chicken: 2 } },

        { type: "cook", label: "Simmer chicken (HOLD SPACE in green)", time: 4.0, stirPerfectWindow: STIR_PERFECT },
        { type: "serve", label: "Serve: press ENTER" },
        { type: "action", label: "Add rice", uses: ["rice"], counts: { rice: 2 } },
        { type: "serve", label: "Final serve: press ENTER" }
      ]
    }
  ];

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
    shakeHz: 1, // lower = slower vibration (try 6–15)

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

  const keyLabels = ["Q", "W", "E", "R"];
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

  /* ================= PENALTIES ================= */
  const PENALTY = {
    wrongInputScore: 120,
    wrongEnterScore: 160,
    wrongStirScore: 160,

    wrongInputTime: 0,
    wrongEnterTime: 1,
    wrongStirTime: 0,

    // UPDATED: decreased vibration intensity
    shake: 6,
    comboReset: true
  };

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
  // score reward
  game.score += 1000;
  game.combo += 2;

  // Mark this unique dish as completed
  if (game.currentDish?.name) game.uniqueDishesCompleted.add(game.currentDish.name);

  // WIN: all unique dishes completed before time runs out
  if (game.uniqueDishesCompleted.size >= game.dishesToWin) {
    game.state = "win";
    setAlert("ALL UNIQUE DISHES COMPLETE!", "rgba(128, 255, 114, 0.92)", 1.2);

    if (timer) { clearInterval(timer); timer = null; } // stop clock [web:395]

    startBtn.textContent = "PLAY AGAIN";
    startBtn.style.display = "block";
    restartBtn.style.display = "none";

    updateHUD();
    return;
  }

  // otherwise load next random dish
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

  /* ================= DRAW ================= */
  function drawBackground() {
    if (assets.bg) ctx.drawImage(assets.bg, 0, 0, canvas.width, canvas.height);
  }

  function drawHeroAlert() {
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

  function drawCookBar(step, y = canvas.height - 260) {
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

  function drawPlate() {
    if (!assets.plate) return;

    // dt-driven shake sampling should happen in your main update/loop, but you can do it here if needed.
    // Better: call updateShake(dt) once per frame and only read offsets here.
    const cx = canvas.width / 2 + game.shakeOffsetX;
    const cy = canvas.height / 2 + 80 + game.shakeOffsetY;

    if (game.shake > 0) game.shake--;

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

        const x = Math.round(cx + Math.cos(angle) * r1 + (Math.random() - 0.5) * 10 - size / 2);
        const y = Math.round(cy + Math.sin(angle) * r2 + (Math.random() - 0.5) * 10 - size / 2);

        ctx.drawImage(img, x, y, size, size); // scaled via drawImage width/height [web:371][web:393]

        iconIndex++;
        if (iconIndex >= totalIcons) return;
      }
    }
  }

  function updateShake(dt) {
  // decay intensity
  if (game.shake > 0) game.shake = Math.max(0, game.shake - 0.8); // tune decay speed

  // sample a new random offset at a fixed rate
  game.shakeSampleT += dt;
  const interval = 1 / game.shakeHz;

  if (game.shakeSampleT >= interval) {
    game.shakeSampleT = 0;

    // new target offsets (slower changes)
    game.shakeOffsetX = (Math.random() - 0.5) * game.shake;
    game.shakeOffsetY = (Math.random() - 0.5) * game.shake;
  }
}


  function drawComboFlames() {
    if (game.combo < 3) return;
    ctx.fillStyle = "orange";
    ctx.font = "bold 40px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("COMBO!", canvas.width / 2, 120);
  }

function drawDishInfo() {
  if (!game.currentDish) return;

  const title = `${game.currentDish.name} (${game.currentDish.culture})`;

  const haveProgress =
    game.uniqueDishesCompleted &&
    typeof game.uniqueDishesCompleted.size === "number" &&
    typeof game.dishesToWin === "number";

  // Subtitle now includes progress as part of the same line
  const subtitle = haveProgress
    ? `Unique dishes completed: ${game.uniqueDishesCompleted.size}/${game.dishesToWin}`
    : "";

  const cx = canvas.width / 2;

  // Layout
  const titleY = 80;
  const subtitleY = titleY + 38;

  // Banner behind both lines
  const bannerW = Math.min(980, canvas.width - 80);
  const bannerH = subtitle ? 92 : 76;
  const bannerX = (canvas.width - bannerW) / 2;
  const bannerY = titleY - 54;

  ctx.save();

  // Banner
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(bannerX, bannerY, bannerW, bannerH);

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

  // HERO title
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = "bold 44px Courier New";
  ctx.lineWidth = 6;

  ctx.shadowColor = "rgba(255, 224, 102, 0.90)";
  ctx.shadowBlur = 14;

  ctx.strokeStyle = "rgba(0,0,0,0.85)";
  ctx.strokeText(title, cx, titleY); // outline [web:331]

  ctx.fillStyle = "#ffe066";
  ctx.fillText(title, cx, titleY);   // fill [web:331]

  // Subtitle (single line, inside banner)
  if (subtitle) {
    ctx.shadowBlur = 0;
    ctx.font = "bold 18px Courier New";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(subtitle, cx, subtitleY); // [web:331]
  }

  ctx.restore();
}



  function drawPanel(x, y, w, h, alpha = 0.62) {
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  function wrapLines(text, maxWidth) {
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

  function drawWrappedText(text, x, y, maxWidth, lineHeight) {
    const lines = wrapLines(text, maxWidth);
    lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lineHeight));
    return lines.length;
  }

  function drawInstructions() {
    if (!game.currentDish) return;
    const step = currentStep();
    if (!step) return;

    const panelW = Math.min(980, canvas.width - 80);
    const panelX = (canvas.width - panelW) / 2;
    const panelY = canvas.height - 190;
    const panelH = 130;

    drawPanel(panelX, panelY, panelW, panelH);

    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Courier New";
    ctx.fillText(`Step ${game.stepIndex + 1}/${game.steps.length}`, panelX + 18, panelY + 28);

    ctx.font = "bold 24px Courier New";
    ctx.fillStyle = "#ffe066";
    const lines = drawWrappedText(step.label, panelX + 18, panelY + 58, panelW - 36, 28);

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
      ctx.fillText(`Stir: HOLD SPACE in GREEN (middle 20%). Serve is next step.`, panelX + 18, controlsY);
      drawCookBar(step, canvas.height - 250);
    } else if (step.type === "serve") {
      ctx.fillText(`SERVE NOW: press ENTER`, panelX + 18, controlsY);
    }
  }

  function drawTitle() {
    titleTime += 0.05;
    const bounce = Math.sin(titleTime) * 10;
    ctx.fillStyle = "#ffe066";
    ctx.font = "bold 70px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("FRANTIC HERITAGE COOKING", canvas.width / 2, canvas.height / 2 - 120 + bounce);
    ctx.font = "24px Courier New";
  }
  function drawGameOver() {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 60px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("TIME UP!", canvas.width / 2, canvas.height / 2);
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
    drawBackground();

    if (game.state === "menu") drawTitle();
    if (game.state === "playing") {
      drawDishInfo();
      drawHeroAlert();
      drawPlate();
      drawComboFlames();
      drawInstructions();
    }
    if (game.state === "gameover") drawGameOver();

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
