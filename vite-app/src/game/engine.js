// src/game/engine.js
import { ensureAudio, playBeep } from "./audio.js";
import { dishes, keyLabels, PENALTY, ingredientPool } from "./data.js";
import {
  drawBackground,
  drawTopStack,
  drawComboFlames,
  drawPlate,
  drawProcessOverlay,
  drawInstructions,
  drawBottomButtons,
  drawTopSequencePreview,
  drawLanding, 
  drawScanScreen,
  drawDishSelect,
  drawGameOver,
  drawWin,
  drawStep1Intro,
  drawStep1Gameplay,
  drawStep2Intro,
  drawStep2Gameplay,
  drawStep3Intro,
  drawStep3Gameplay,
  drawStep4Intro,
  drawStep4Gameplay
} from "./render.js";

export function createGame({ canvas, startBtn, restartBtn, hud }) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  startBtn.style.display = "none";
  restartBtn.style.display = "none";

  const QWER_CODES = ["KeyQ", "KeyW", "KeyE", "KeyR"];
  const LEADERBOARD_KEY = "frantic-heritage-cooking.leaderboard.v1";
  const heldCodes = new Set();

  // Testing bypass (?test=true) [web:58]
  const urlParams = new URLSearchParams(window.location.search);
  const testMode = urlParams.get("test") === "true";

  const assets = {};
  function slugifyDishName(name) {
    return String(name || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function loadImage(key, src) {
    return new Promise((res) => {
      const img = new Image();
      img.src = src;
      img.onload = () => { assets[key] = img; res(true); };
      img.onerror = () => res(false);
    });
  }

  async function loadImageVariants(key, sources) {
    for (const src of sources) {
      const ok = await loadImage(key, src);
      if (ok) return true;
    }
    return false;
  }

  async function loadAssets() {
    const baseLoads = [
      loadImage("bg", "/assets/background/kitchen.png"),
      loadImage("plate", "/assets/ui/plate.png"),
      loadImage("main_logo", "/assets/ui/main_logo.png"),
      loadImage("chicken", "/assets/ingredients/chicken.png"),
      loadImage("pork", "/assets/ingredients/pork.png"),
      loadImage("garlic", "/assets/ingredients/garlic.png"),
      loadImage("ginger", "/assets/ingredients/ginger.png"),
      loadImage("chopped_bowl", "/assets/ingredients/chopped-bowl.png"),
      loadImage("chili", "/assets/ingredients/chili.png"),
      loadImage("shrimp", "/assets/ingredients/shrimp.png"),
      loadImage("coconut", "/assets/ingredients/coconut.png"),
      loadImage("rice", "/assets/ingredients/rice.png"),
      loadImage("chop_garlic_1", "/assets/process1_chinese/garlic_stage1.png"),
      loadImage("chop_garlic_2", "/assets/process1_chinese/garlic_stage2.png"),
      loadImage("chop_garlic_3", "/assets/process1_chinese/garlic_stage3.png"),
      loadImage("chop_ginger_1", "/assets/process1_chinese/ginger_stage1.png"),
      loadImage("chop_ginger_2", "/assets/process1_chinese/ginger_stage2.png"),
      loadImage("chop_ginger_3", "/assets/process1_chinese/ginger_stage3.png"),
      loadImage("btn_q", "/assets/ui/blue-btn.png"),
      loadImage("btn_w", "/assets/ui/green-btn.png"),
      loadImage("btn_e", "/assets/ui/yellow-btn.png"),
      loadImage("btn_r", "/assets/ui/white-btn.png"),
      loadImage("rice_plate", "/assets/ui/rice_plate.png"),
      loadImageVariants("smash_pestle", [
        "/assets/process1/pestle.png",
        "/assets/process1/pestle (1).png"
      ]),
      loadImageVariants("smash_shell", [
        "/assets/process1/keluak_shell.png",
        "/assets/process1/keluak_shell (1).png"
      ]),
      loadImageVariants("smash_board", [
        "/assets/process1/cutting_board.png",
        "/assets/process1/cutting_board (1).png"
      ]),
      loadImageVariants("smash_crack_1", [
        "/assets/process1/keluak_crack_1.png",
        "/assets/process1/keluak_crack_1 (1).png"
      ]),
      loadImageVariants("smash_crack_2", [
        "/assets/process1/keluak_crack_2.png",
        "/assets/process1/keluak_crack_2 (1).png"
      ]),
      loadImageVariants("smash_splat_1", [
        "/assets/process1/paste_splat_1.png",
        "/assets/process1/paste_splat_1 (1).png"
      ]),
      loadImageVariants("smash_splat_2", [
        "/assets/process1/paste_splat_2.png",
        "/assets/process1/paste_splat_2 (1).png"
      ]),
      loadImageVariants("smash_garlic_fx", [
        "/assets/process1/garlic_slice_fx.png",
        "/assets/process1/garlic_slice_fx (1).png"
      ]),
      loadImageVariants("smash_chili_fx", [
        "/assets/process1/chili_piece_fx.png",
        "/assets/process1/chili_piece_fx (1).png"
      ]),
      loadImageVariants("smash_impact", [
        "/assets/process1/impact_star.png",
        "/assets/process1/impact_star (1).png"
      ]),
      loadImageVariants("scoop_spoon_empty", [
        "/assets/process1/scoop_spoon_empty.png",
        "/assets/process1/scoop_stage_1.png",
        "/assets/process1/scoop_spoon.png",
        "/assets/process1/spoon_empty.png",
        "/assets/process1/spoon.png"
      ]),
      loadImageVariants("scoop_spoon_stir", [
        "/assets/process1/scoop_spoon.png",
        "/assets/process1/spoon.png",
        "/assets/process1/scoop_spoon_empty.png"
      ]),
      loadImageVariants("scoop_spoon_half", [
        "/assets/process1/scoop_stage_2.png",
        "/assets/process1/scoop_spoon_half.png"
      ]),
      loadImageVariants("scoop_spoon_full", [
        "/assets/process1/scoop_spoon_full.png",
        "/assets/process1/scoop_stage_3.png",
        "/assets/process1/spoon_full.png"
      ]),
      loadImageVariants("step2_pot", [
        "/assets/process2/POT (3).png",
        "/assets/process2/pot.png",
        "/assets/process2/pot (1).png"
      ]),
      loadImageVariants("step2_pot_paste", [
        "/assets/process2/pot_paste.png",
        "/assets/process2/pot paste.png"
      ]),
      loadImageVariants("step2_pot_finished", [
        "/assets/process2/pot_finished.png",
        "/assets/process2/pot finished.png"
      ]),
      loadImage("step2_chinese_clove", "/assets/process2_chinese/clove.png"),
      loadImage("step2_chinese_oil", "/assets/process2_chinese/oil_bottle.png"),
      loadImage("step2_chinese_pot_stage1", "/assets/process2_chinese/pot_stage1.png"),
      loadImage("step2_chinese_pot_stage2", "/assets/process2_chinese/pot_stage2.png"),
      loadImageVariants("step4_serve", [
        "/assets/process2/serve.png",
        "/assets/process2/serve (1).png"
      ])
    ];

    const dishLoads = dishes.map((dish) => {
      const slug = slugifyDishName(dish.name);
      return loadImage(`dish_${slug}`, `/assets/dishes/${slug}.png`);
    });

    await Promise.all([...baseLoads, ...dishLoads]);
  }

  // Preload title/menu visuals so landing UI is visible before starting.
  void Promise.all([
    loadImage("bg", "/assets/background/kitchen.png"),
    loadImage("main_logo", "/assets/ui/main_logo.png"),
    loadImage("btn_q", "/assets/ui/blue-btn.png"),
    loadImage("btn_w", "/assets/ui/green-btn.png"),
    loadImage("btn_e", "/assets/ui/yellow-btn.png"),
    loadImage("btn_r", "/assets/ui/white-btn.png")
  ]);

  const game = {
    state: "menu",
    score: 0,
    combo: 0,
    time: 180,

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

    flavorMeter: 0,
    processMini: {
      active: false,
      mode: "",
      processName: "",
      seq: [],
      index: 0,
      beats: 0,
      target: 0,
      sequenceLen: 0,
      sequencesDone: 0,
      sequencesNeed: 1,
      streak: 0,
      bestStreak: 0,
      timeLeft: 0,
      beatWindow: 0.35,
      lastHitAt: 0,
      smooth: 0,
      aroma: 0,
      smoke: 0,
      spill: 0,
      burn: 0,
      cueCode: null,
      cueT: 0,
      cueEvery: 0,
      cueWindow: 1,
      secretCombo: ["KeyQ", "KeyR", "KeyE", "KeyW", "KeyQ", "KeyE"],
      secretIndex: 0,
      masterChef: false,
      flairBonus: false,
      perfectPower: false,
      effectText: "",
      effectT: 0,
      smashPulse: 0,
      smashCrack: 0,
      smashParticles: []
    },

    step1: {
      active: false,
      intro: false,
      introTimer: 0,
      animT: 0,
      smashPulse: 0,
      lastSmashAt: 0,
      phase: "lying",
      scoopStage: 0,
      scoopNeed: 2,
      scoopHold: 0,
      scoopFill: 0,
      scoopHolding: false,
      smashCount: 0,
      smashNeed: 14,
      poundCount: 0,
      poundNeed: 18,
      progress: 0,
      smashProgress: 0,
      poundProgress: 0,
      showProgress: false,
      placedOnPlate: false
    },

    step2: {
      active: false,
      intro: false,
      introTimer: 0,
      animT: 0,
      phase: "addPaste",
      addedPaste: false,
      addedChicken: false,
      comboSeq: [],
      comboIndex: 0,
      comboLen: 5,
      transitionT: 0,
      boilSpamCount: 0,
      boilSpamNeed: 20
    },

    step3Intro: {
      active: false,
      timer: 0,
      animT: 0
    },

    step3: {
      active: false,
      pointer: 0.5,
      pointerDir: 1,
      sweetMin: 0.42,
      sweetMax: 0.58,
      targetCode: "KeyW",
      hitsDone: 0,
      hitsNeed: 3,
      finishAnim: false,
      finishTimer: 0,
      stirPhase: 0
    },

    step4Intro: {
      active: false,
      timer: 0,
      animT: 0
    },

    step4: {
      active: false,
      phase: "combo",
      comboSeq: [],
      comboIndex: 0,
      comboLen: 3,
      timeLeft: 5,
      duration: 5,
      animT: 0,
      phaseT: 0,
      finalT: 0
    },

    shake: 0,
    dishCountdown: 0,
    keyGlow: {
      KeyQ: 0,
      KeyW: 0,
      KeyE: 0,
      KeyR: 0
    },
    leaderboard: [],
    endRecorded: false
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
  let menuStartPending = false;
  let lastFrameTs = null;

  const alertState = { text: "", color: "rgba(255,255,255,0)", ttl: 0 };

  function loadLeaderboard() {
    try {
      const raw = localStorage.getItem(LEADERBOARD_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((x) => ({
          score: Math.max(0, Number(x?.score) || 0),
          date: String(x?.date || ""),
          time: String(x?.time || "")
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    } catch {
      return [];
    }
  }

  function saveLeaderboard(list) {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list));
    } catch {
      // ignore quota/storage errors
    }
  }

  function recordScoreToLeaderboard() {
    const now = new Date();
    const stampDate = now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    const stampTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const next = [...game.leaderboard, { score: game.score, date: stampDate, time: stampTime }]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    game.leaderboard = next;
    saveLeaderboard(next);
  }

  game.leaderboard = loadLeaderboard();

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

  function resetProcessMini() {
    game.processMini = {
      active: false,
      mode: "",
      processName: "",
      seq: [],
      index: 0,
      beats: 0,
      target: 0,
      sequenceLen: 0,
      sequencesDone: 0,
      sequencesNeed: 1,
      streak: 0,
      bestStreak: 0,
      timeLeft: 0,
      beatWindow: 0.35,
      lastHitAt: 0,
      smooth: 0,
      aroma: 0,
      smoke: 0,
      spill: 0,
      burn: 0,
      cueCode: null,
      cueT: 0,
      cueEvery: 0,
      cueWindow: 1,
      secretCombo: ["KeyQ", "KeyR", "KeyE", "KeyW", "KeyQ", "KeyE"],
      secretIndex: 0,
      masterChef: false,
      flairBonus: false,
      perfectPower: false,
      effectText: "",
      effectT: 0,
      smashPulse: 0,
      smashCrack: 0,
      smashParticles: []
    };
  }

  function resetStepState() {
    game.stepProgress = 0;
    resetCookIcons();
    resetProcessMini();
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
    game.flavorMeter = 0;

    initDishCounts();

    if (shouldRunStep1Flow()) {
      startStep1Flow();
    } else {
      startDishCountdown(3);
    }
  }

  function shouldRunStep1Flow() {
    return ["AYAM BUAH KELUAK", "LOR KAI YIK"].includes(game.currentDish?.name) && game.stepIndex === 0;
  }

  function shouldRunStep2Flow() {
    return ["AYAM BUAH KELUAK", "LOR KAI YIK"].includes(game.currentDish?.name) && game.stepIndex === 1;
  }

  function shouldRunStep3IntroFlow() {
    return ["AYAM BUAH KELUAK", "LOR KAI YIK"].includes(game.currentDish?.name) && game.stepIndex === 2;
  }

  function shouldRunStep4IntroFlow() {
    return ["AYAM BUAH KELUAK", "LOR KAI YIK"].includes(game.currentDish?.name) && game.stepIndex === 3;
  }

  function shouldRunStep3GameplayFlow() {
    return ["AYAM BUAH KELUAK", "LOR KAI YIK"].includes(game.currentDish?.name)
      && game.stepIndex === 2;
  }

  function shouldRunStep4GameplayFlow() {
    return ["AYAM BUAH KELUAK", "LOR KAI YIK"].includes(game.currentDish?.name) && game.stepIndex === 3;
  }

  function updateStep1UiModel() {
    const s = game.step1;

    if (s.mode === "chinese-chop") {
      if (s.intro) {
        s.showProgress = false;
        s.progress = 0;
        s.smashProgress = 0;
        s.poundProgress = 0;
        return;
      }

      if (s.phase === "chop") {
        const chopCount = Number(s.chopCount || 0);
        const chopNeed = Math.max(1, Number(s.chopNeed || 1));
        s.showProgress = true;
        s.progress = Math.max(0, Math.min(1, chopCount / chopNeed));
      } else {
        s.showProgress = false;
        s.progress = 0;
      }

      s.smashProgress = 0;
      s.poundProgress = 0;
      return;
    }

    if (s.intro) {
      s.showProgress = false;
      s.progress = 0;
      s.smashProgress = 0;
      s.poundProgress = 0;
      return;
    }

    if (s.phase === "lying") {
      s.showProgress = false;
      s.progress = 0;
      s.smashProgress = 0;
      s.poundProgress = 0;
      return;
    }

    if (s.phase === "smash") {
      s.showProgress = true;
      s.progress = Math.max(0, Math.min(1, s.smashCount / Math.max(1, s.smashNeed)));
      s.smashProgress = s.progress;
      s.poundProgress = 0;
      return;
    }

    if (s.phase === "scoop") {
      s.showProgress = false;
      s.progress = 0;
      s.smashProgress = Math.max(0, Math.min(1, s.smashCount / Math.max(1, s.smashNeed)));
      s.poundProgress = 0;
      return;
    }

    s.showProgress = true;
    s.progress = Math.max(0, Math.min(1, s.poundCount / Math.max(1, s.poundNeed)));
    s.smashProgress = 1;
    s.poundProgress = s.progress;
  }

  function startStep1Flow() {
    const isChineseChopFlow = game.currentDish?.name === "LOR KAI YIK";

    if (isChineseChopFlow) {
      game.step1 = {
        ...game.step1,
        active: true,
        intro: true,
        introTimer: 5,
        animT: 0,
        mode: "chinese-chop",
        phase: "chop",
        chopTargets: ["garlic", "ginger"],
        chopTargetIndex: 0,
        chopCount: 0,
        chopNeed: 18,
        chopStage: 0,
        sweepReady: false,
        progress: 0,
        showProgress: true,
        smashProgress: 0,
        poundProgress: 0,
        scoopStage: 0,
        scoopNeed: 2,
        scoopHold: 0,
        scoopFill: 0,
        scoopHolding: false,
        smashCount: 0,
        smashNeed: 14,
        poundCount: 0,
        poundNeed: 18,
        placedOnPlate: true
      };

      game.dishCountdown = 0;
      setAlert("STEP 1 INTRO", "rgba(255, 224, 102, 0.95)", 1.0);
      return;
    }

    game.step1 = {
      ...game.step1,
      active: true,
      intro: true,
      introTimer: 5,
      animT: 0,
      mode: "keluak",
      smashPulse: 0,
      lastSmashAt: 0,
      phase: "smash",
      scoopStage: 0,
      scoopNeed: 2,
      scoopHold: 0,
      scoopFill: 0,
      scoopHolding: false,
      smashCount: 0,
      smashNeed: 14,
      poundCount: 0,
      poundNeed: 18,
      progress: 0,
      smashProgress: 0,
      poundProgress: 0,
      showProgress: false,
      placedOnPlate: true
    };

    game.dishCountdown = 0;
    setAlert("STEP 1 INTRO", "rgba(255, 224, 102, 0.95)", 1.0);
  }

  function currentStep1ChopTarget() {
    const targets = Array.isArray(game.step1.chopTargets) ? game.step1.chopTargets : ["garlic", "ginger"];
    const index = Math.max(0, Math.min(targets.length - 1, Number(game.step1.chopTargetIndex || 0)));
    return targets[index] || "garlic";
  }

  function handleChineseStep1Key(code) {
    const s = game.step1;
    if (!s.active || s.intro) return;

    if (s.phase === "chop") {
      s.chopCount = Math.min(Math.max(1, Number(s.chopNeed || 1)), Number(s.chopCount || 0) + 1);
      const chopNeed = Math.max(1, Number(s.chopNeed || 1));
      const ratio = s.chopCount / chopNeed;
      const nextStage = ratio >= 1 ? 3 : ratio >= 2 / 3 ? 2 : ratio >= 1 / 3 ? 1 : 0;

      if (nextStage > Number(s.chopStage || 0)) {
        s.chopStage = nextStage;
        game.score += 8;
      } else {
        game.score += 4;
      }

      updateHUD();
      playBeep(760, 0.04);

      if (s.chopCount >= chopNeed) {
        s.phase = "sweep";
        s.sweepReady = true;
        const ing = currentStep1ChopTarget().toUpperCase();
        setAlert(`PRESS GREEN TO SWEEP ${ing} INTO BOWL`, "rgba(255, 224, 102, 0.95)", 0.8);
      }
      return;
    }

    if (s.phase !== "sweep") return;

    if (code !== "KeyW") {
      setAlert("SWEEP = GREEN BUTTON", "rgba(255, 89, 94, 0.92)", 0.6);
      playBeep(220, 0.03);
      return;
    }

    game.score += 24;
    updateHUD();
    playBeep(860, 0.05);

    const targets = Array.isArray(s.chopTargets) ? s.chopTargets : ["garlic", "ginger"];
    const nextIndex = Number(s.chopTargetIndex || 0) + 1;

    if (nextIndex >= targets.length) {
      completeStep1Flow();
      return;
    }

    s.chopTargetIndex = nextIndex;
    s.phase = "chop";
    s.chopCount = 0;
    s.chopStage = 0;
    s.sweepReady = false;
    s.progress = 0;
    s.showProgress = true;

    const nextTarget = currentStep1ChopTarget().toUpperCase();
    setAlert(`NOW CHOP ${nextTarget}`, "rgba(128, 255, 114, 0.92)", 0.7);
  }

  function completeStep1Flow() {
    game.step1.active = false;
    game.step1.intro = false;
    setAlert("STEP 1 COMPLETE!", "rgba(128, 255, 114, 0.92)", 0.9);
    awardStepPoints(1.15);
    advanceStep();
  }

  function handleStep1Key(code) {
    const s = game.step1;
    if (!s.active || s.intro) return;
    if (!QWER_CODES.includes(code)) return;

    if (s.mode === "chinese-chop") {
      handleChineseStep1Key(code);
      return;
    }

    if (s.phase === "smash") {
      const now = performance.now();
      const dtSmash = s.lastSmashAt > 0 ? (now - s.lastSmashAt) / 1000 : 0;
      s.lastSmashAt = now;

      if (dtSmash > 0.24) {
        s.smashPulse = 0.35;
        s.smashCount = Math.max(0, s.smashCount - 1);
        setAlert("TOO SLOW! SPAM FASTER", "rgba(255, 89, 94, 0.92)", 0.4);
        playBeep(220, 0.03);
        return;
      }

      s.smashCount++;
      s.smashPulse = 1;
      game.score += 12;
      updateHUD();
      playBeep(700, 0.04);
      if (s.smashCount >= s.smashNeed) {
        s.phase = "scoop";
        s.scoopStage = 0;
        s.scoopFill = 0;
        s.scoopHolding = false;
        s.scoopHold = 0;
        setAlert("HOLD GREEN+YELLOW TO SCOOP", "rgba(255, 224, 102, 0.95)", 0.7);
      }
      return;
    }

    if (s.phase === "scoop") {
      s.scoopHolding = heldCodes.has("KeyW") && heldCodes.has("KeyE");
      if (!s.scoopHolding) {
        setAlert("HOLD GREEN+YELLOW TO SCOOP", "rgba(255, 224, 102, 0.95)", 0.6);
        playBeep(230, 0.03);
      }
      return;
    }

    s.poundCount++;
    game.score += 15;
    updateHUD();
    playBeep(740, 0.04);
    if (s.poundCount >= s.poundNeed) completeStep1Flow();
  }

  function updateStep1(dt) {
    const s = game.step1;
    if (!s.active) return;

    s.animT += dt;

    if (s.mode === "chinese-chop") {
      if (s.intro) {
        s.introTimer = Math.max(0, s.introTimer - dt);
        if (s.introTimer <= 0) {
          s.intro = false;
          const target = currentStep1ChopTarget().toUpperCase();
          setAlert(`STEP 1 START! CHOP ${target}`, "rgba(128, 255, 114, 0.92)", 0.75);
        }
      }

      updateStep1UiModel();
      return;
    }

    s.smashPulse = Math.max(0, Number(s.smashPulse || 0) - dt * 6.2);

    if (s.intro) {
      s.introTimer = Math.max(0, s.introTimer - dt);
      if (s.introTimer <= 0) {
        s.intro = false;
        setAlert("STEP 1 START!", "rgba(128, 255, 114, 0.92)", 0.7);
      }
    }

    if (s.phase === "smash") {
      const since = s.lastSmashAt > 0 ? (performance.now() - s.lastSmashAt) / 1000 : 0;
      if (since > 0.3) s.smashCount = Math.max(0, s.smashCount - dt * 4.4);
    }

    if (s.phase === "scoop" && s.scoopStage < s.scoopNeed) {
      s.scoopHolding = heldCodes.has("KeyW") && heldCodes.has("KeyE");
      if (s.scoopHolding) {
        s.scoopFill = Math.min(1, Number(s.scoopFill || 0) + dt / 1.3);
      } else {
        s.scoopFill = Math.max(0, Number(s.scoopFill || 0) - dt * 0.35);
      }

      const nextStage = s.scoopFill >= 1 ? 2 : s.scoopFill >= 0.5 ? 1 : 0;
      if (nextStage > s.scoopStage) {
        s.scoopStage = nextStage;
        game.score += nextStage === 1 ? 18 : 42;
        updateHUD();
        if (nextStage === 1) {
          playBeep(780, 0.05);
          setAlert("SCOOP HALF FULL", "rgba(255, 224, 102, 0.95)", 0.45);
        } else {
          playBeep(840, 0.06);
          s.scoopHold = 0.4;
          s.scoopHolding = false;
          setAlert("SCOOP FULL!", "rgba(128, 255, 114, 0.92)", 0.45);
          completeStep1Flow();
          return;
        }
      }
    }

    updateStep1UiModel();
  }

  function startStep2Flow() {
    const isChineseBraiseFlow = game.currentDish?.name === "LOR KAI YIK";

    if (isChineseBraiseFlow) {
      const comboLen = 4;
      const comboSeq = Array.from({ length: comboLen }, () => QWER_CODES[Math.floor(Math.random() * QWER_CODES.length)]);
      game.step2 = {
        ...game.step2,
        active: true,
        intro: true,
        introTimer: 5,
        animT: 0,
        mode: "lor-braise",
        phase: "addOilClove",
        addedPaste: false,
        addedChicken: false,
        comboSeq,
        comboIndex: 0,
        comboLen,
        transitionT: 0,
        boilSpamCount: 0,
        boilSpamNeed: 20,
        heatTimer: 7,
        heatDuration: 7,
        heatLevel: 0.52,
        heatIdealMin: 0.45,
        heatIdealMax: 0.62,
        heatOffTime: 0,
        lastHeatTapAt: 0
      };

      game.dishCountdown = 0;
      setAlert("STEP 2 INTRO", "rgba(255, 224, 102, 0.95)", 1.0);
      return;
    }

    const comboLen = 5;
    const comboSeq = Array.from({ length: comboLen }, () => QWER_CODES[Math.floor(Math.random() * QWER_CODES.length)]);
    game.step2 = {
      ...game.step2,
      active: true,
      intro: true,
      introTimer: 5,
      animT: 0,
      mode: "ayam-cook",
      phase: "addPaste",
      addedPaste: false,
      addedChicken: false,
      comboSeq,
      comboIndex: 0,
      comboLen,
      transitionT: 0,
      boilSpamCount: 0,
      boilSpamNeed: 20
    };

    game.dishCountdown = 0;
    setAlert("STEP 2 INTRO", "rgba(255, 224, 102, 0.95)", 1.0);
  }

  function completeStep2Flow() {
    game.step2.active = false;
    game.step2.intro = false;
    setAlert("STEP 2 COMPLETE!", "rgba(128, 255, 114, 0.92)", 0.9);
    awardStepPoints(1.15);
    advanceStep();
  }

  function updateStep2(dt) {
    const s = game.step2;
    if (!s.active) return;

    s.animT += dt;

    if (s.mode === "lor-braise") {
      if (s.intro) {
        s.introTimer = Math.max(0, s.introTimer - dt);
        if (s.introTimer <= 0) {
          s.intro = false;
          setAlert("COMPLETE COMBO TO ADD OIL + CLOVE", "rgba(255, 224, 102, 0.95)", 0.85);
        }
        return;
      }

      if (s.phase === "addOilCloveAnim") {
        s.transitionT = Math.max(0, s.transitionT - dt);
        if (s.transitionT <= 0) {
          s.phase = "addChicken";
          s.comboSeq = Array.from({ length: s.comboLen || 4 }, () => QWER_CODES[Math.floor(Math.random() * QWER_CODES.length)]);
          s.comboIndex = 0;
          setAlert("OIL + CLOVE ADDED! COMBO FOR CHICKEN", "rgba(255, 224, 102, 0.95)", 0.85);
        }
        return;
      }

      if (s.phase === "addChickenAnim") {
        s.transitionT = Math.max(0, s.transitionT - dt);
        if (s.transitionT <= 0) {
          s.phase = "heat";
          s.heatTimer = Math.max(6, Math.min(8, Number(s.heatDuration || 7)));
          s.heatLevel = 0.52;
          s.heatOffTime = 0;
          s.lastHeatTapAt = 0;
          setAlert("TAP IN RHYTHM TO HOLD IDEAL HEAT", "rgba(128, 255, 114, 0.92)", 0.95);
        }
        return;
      }

      if (s.phase === "heat") {
        s.heatTimer = Math.max(0, Number(s.heatTimer || 0) - dt);
        s.heatLevel = Math.max(0, Math.min(1, Number(s.heatLevel || 0) - dt * 0.16));

        const min = Number(s.heatIdealMin ?? 0.45);
        const max = Number(s.heatIdealMax ?? 0.62);
        const inIdeal = s.heatLevel >= min && s.heatLevel <= max;
        if (!inIdeal) s.heatOffTime = Number(s.heatOffTime || 0) + dt;

        if (s.heatTimer <= 0) {
          if ((s.heatOffTime || 0) <= 1.8) {
            game.score += 180;
            setAlert("PERFECT BRAISE HEAT!", "rgba(128, 255, 114, 0.92)", 0.8);
          } else if ((s.heatOffTime || 0) <= 3.6) {
            game.score += 110;
            setAlert("GOOD BRAISE START", "rgba(255, 224, 102, 0.95)", 0.8);
          } else {
            game.score += 60;
            setAlert("BRAISE STARTED", "rgba(255, 224, 102, 0.95)", 0.8);
          }
          updateHUD();
          completeStep2Flow();
        }
      }

      return;
    }

    if (s.intro) {
      s.introTimer = Math.max(0, s.introTimer - dt);
      if (s.introTimer <= 0) {
        s.intro = false;
        setAlert("COMBO TO ADD PASTE", "rgba(255, 224, 102, 0.95)", 0.8);
      }
      return;
    }

    if (s.phase === "addPasteAnim") {
      s.transitionT = Math.max(0, s.transitionT - dt);
      if (s.transitionT <= 0) {
        s.addedPaste = true;
        s.phase = "addChicken";
        s.comboSeq = Array.from({ length: s.comboLen || 5 }, () => QWER_CODES[Math.floor(Math.random() * QWER_CODES.length)]);
        s.comboIndex = 0;
        setAlert("PASTE ADDED! COMBO FOR CHICKEN", "rgba(255, 224, 102, 0.95)", 0.8);
      }
      return;
    }

    if (s.phase === "addChickenAnim") {
      s.transitionT = Math.max(0, s.transitionT - dt);
      if (s.transitionT <= 0) {
        s.addedChicken = true;
        s.phase = "boil";
        s.boilSpamCount = 0;
        setAlert("CHICKEN ADDED! SPAM BUTTONS TO BOIL", "rgba(128, 255, 114, 0.92)", 0.85);
      }
      return;
    }

    if (s.phase === "boil") {
      if ((s.boilSpamCount | 0) >= Math.max(1, s.boilSpamNeed | 0)) {
        completeStep2Flow();
      }
    }
  }

  function handleStep2ComboKey(code) {
    const s = game.step2;
    if (!s.active || s.intro) return;

    if (s.mode === "lor-braise") {
      if (s.phase === "heat") {
        const now = performance.now();
        const dtTap = s.lastHeatTapAt > 0 ? (now - s.lastHeatTapAt) / 1000 : 0;
        s.lastHeatTapAt = now;

        const inRhythm = dtTap === 0 || (dtTap >= 0.28 && dtTap <= 0.62);
        const gain = inRhythm ? 0.12 : 0.05;
        s.heatLevel = Math.max(0, Math.min(1, Number(s.heatLevel || 0) + gain));

        game.score += inRhythm ? 14 : 7;
        updateHUD();
        playBeep(inRhythm ? 760 : 640, 0.04);

        if (!inRhythm) {
          setAlert("KEEP A STEADY RHYTHM", "rgba(255, 224, 102, 0.95)", 0.4);
        }
        return;
      }

      if (s.phase !== "addOilClove" && s.phase !== "addChicken") return;

      const expected = s.comboSeq[s.comboIndex];
      if (!expected) return;

      if (code !== expected) {
        s.comboIndex = 0;
        applyPenalty("wrongInput");
        setAlert("WRONG KEY! COMBO RESET", "rgba(255, 89, 94, 0.92)", 0.6);
        return;
      }

      s.comboIndex++;
      game.score += 20;
      updateHUD();
      playBeep(630 + s.comboIndex * 24, 0.045);

      if (s.comboIndex < s.comboSeq.length) {
        setAlert(`COMBO ${s.comboIndex}/${s.comboSeq.length}`, "rgba(255, 224, 102, 0.95)", 0.45);
        return;
      }

      s.comboIndex = 0;

      if (s.phase === "addOilClove") {
        s.phase = "addOilCloveAnim";
        s.transitionT = 0.9;
        game.score += 80;
        updateHUD();
        playBeep(720, 0.08);
        setAlert("ADDING OIL + CLOVE...", "rgba(128, 255, 114, 0.92)", 0.75);
        return;
      }

      if (s.phase === "addChicken") {
        s.phase = "addChickenAnim";
        s.transitionT = 0.9;
        game.score += 95;
        updateHUD();
        playBeep(780, 0.08);
        setAlert("ADDING CHICKEN...", "rgba(128, 255, 114, 0.92)", 0.75);
      }
      return;
    }

    if (s.phase === "boil") {
      s.boilSpamCount = Math.min(Math.max(1, s.boilSpamNeed | 0), (s.boilSpamCount | 0) + 1);
      game.score += 8;
      updateHUD();
      playBeep(700 + (s.boilSpamCount % 6) * 20, 0.03);
      if ((s.boilSpamCount | 0) >= Math.max(1, s.boilSpamNeed | 0)) {
        setAlert("BOIL COMPLETE!", "rgba(128, 255, 114, 0.92)", 0.65);
      }
      return;
    }
    if (s.phase !== "addPaste" && s.phase !== "addChicken") return;

    const expected = s.comboSeq[s.comboIndex];
    if (!expected) return;

    if (code !== expected) {
      s.comboIndex = 0;
      applyPenalty("wrongInput");
      setAlert("WRONG KEY! COMBO RESET", "rgba(255, 89, 94, 0.92)", 0.6);
      return;
    }

    s.comboIndex++;
    game.score += 20;
    updateHUD();
    playBeep(620 + s.comboIndex * 22, 0.045);

    if (s.comboIndex < s.comboSeq.length) {
      setAlert(`COMBO ${s.comboIndex}/${s.comboSeq.length}`, "rgba(255, 224, 102, 0.95)", 0.45);
      return;
    }

    s.comboIndex = 0;

    if (s.phase === "addPaste") {
      s.phase = "addPasteAnim";
      s.transitionT = 0.8;
      game.score += 70;
      updateHUD();
      playBeep(710, 0.07);
      setAlert("ADDING PASTE...", "rgba(128, 255, 114, 0.92)", 0.7);
      return;
    }

    if (s.phase === "addChicken") {
      s.phase = "addChickenAnim";
      s.transitionT = 0.85;
      game.score += 90;
      updateHUD();
      playBeep(760, 0.08);
      setAlert("ADDING CHICKEN...", "rgba(128, 255, 114, 0.92)", 0.75);
    }
  }

  function startStep3Intro() {
    const targetCode = QWER_CODES[Math.floor(Math.random() * QWER_CODES.length)];
    const isLorKaiYik = game.currentDish?.name === "LOR KAI YIK";
    game.step3Intro = {
      active: true,
      timer: 5,
      animT: 0,
      dishName: game.currentDish?.name || ""
    };
    game.step3 = {
      ...game.step3,
      active: false,
      pointer: 0.5,
      pointerDir: 1,
      sweetMin: 0.42,
      sweetMax: 0.58,
      targetCode,
      hitsDone: 0,
      hitsNeed: 3,
      finishAnim: false,
      finishTimer: 0,
      stirPhase: 0
    };
    setAlert(isLorKaiYik ? "STEP 3: SLOW SIMMER" : "STEP 3 INTRO", "rgba(255, 224, 102, 0.95)", 0.9);
  }

  function startStep4Intro() {
    const comboLen = 3;
    const comboSeq = Array.from({ length: comboLen }, () => QWER_CODES[Math.floor(Math.random() * QWER_CODES.length)]);
    game.step4Intro = {
      active: true,
      timer: 5,
      animT: 0,
      dishName: game.currentDish?.name || ""
    };
    game.step4 = {
      ...game.step4,
      active: false,
      phase: "combo",
      comboSeq,
      comboIndex: 0,
      comboLen,
      timeLeft: 5,
      duration: 5,
      animT: 0,
      phaseT: 0,
      finalT: 0
    };
    setAlert("STEP 4 INTRO", "rgba(255, 224, 102, 0.95)", 0.9);
  }

  function updateStep3Intro(dt) {
    if (!game.step3Intro.active) return;
    game.step3Intro.animT += dt;
    game.step3Intro.timer = Math.max(0, game.step3Intro.timer - dt);
    if (game.step3Intro.timer <= 0) {
      game.step3Intro.active = false;
      game.step3.active = true;
      const isLorKaiYik = game.currentDish?.name === "LOR KAI YIK";
      setAlert(
        isLorKaiYik
          ? "STEP 3 START! TIME BUTTON IN GREEN ZONE (0/3)"
          : "STEP 3 START! HIT THE TARGET BUTTON IN THE GREEN ZONE",
        "rgba(128, 255, 114, 0.92)",
        1.0
      );
    }
  }

  function handleStep3TimingKey(code) {
    const s = game.step3;
    if (!shouldRunStep3GameplayFlow()) return;
    if (!s.active || s.finishAnim) return;
    const isLorKaiYik = game.currentDish?.name === "LOR KAI YIK";
    const requiredHits = isLorKaiYik ? 3 : Math.max(1, Number(s.hitsNeed || 3));

    const inSweet = s.pointer >= s.sweetMin && s.pointer <= s.sweetMax;
    const correctCode = code === s.targetCode;

    if (!correctCode) {
      applyPenalty("wrongInput");
      setAlert("WRONG BUTTON!", "rgba(255, 89, 94, 0.92)", 0.6);
      return;
    }

    if (!inSweet) {
      applyPenalty("wrongEnter");
      setAlert("BAD TIMING! PRESS IN GREEN ZONE", "rgba(255, 89, 94, 0.92)", 0.65);
      return;
    }

    s.hitsDone = Math.min(requiredHits, Number(s.hitsDone || 0) + 1);
    game.score += 90;
    updateHUD();
    playBeep(760, 0.07);

    if (s.hitsDone >= requiredHits) {
      s.finishAnim = true;
      s.finishTimer = 1.15;
      setAlert("STIR COMPLETE!", "rgba(128, 255, 114, 0.95)", 0.9);
      return;
    }

    s.targetCode = QWER_CODES[Math.floor(Math.random() * QWER_CODES.length)];
    setAlert(`NICE TIMING! ${s.hitsDone}/${requiredHits}`, "rgba(255, 224, 102, 0.95)", 0.55);
  }

  function updateStep4Intro(dt) {
    if (!game.step4Intro.active) return;
    game.step4Intro.animT += dt;
    game.step4Intro.timer = Math.max(0, game.step4Intro.timer - dt);
    if (game.step4Intro.timer <= 0) {
      game.step4Intro.active = false;
      game.step4.active = true;
      setAlert("COMPLETE 3-BUTTON COMBO IN 5 SECONDS", "rgba(128, 255, 114, 0.92)", 0.9);
    }
  }

  function completeStep4Flow() {
    game.step4.active = false;
    setAlert("FINAL DISH SERVED!", "rgba(128, 255, 114, 0.95)", 0.9);
    game.score += 500;
    updateHUD();

    game.step1.active = false;
    game.step2.active = false;
    game.step3Intro.active = false;
    game.step3.active = false;
    game.step4Intro.active = false;

    game.state = "win";
    if (timer) { clearInterval(timer); timer = null; }
    startBtn.style.display = "none";
    restartBtn.style.display = "none";
  }

  function handleStep4Key(code) {
    const s = game.step4;
    if (!s.active) return;
    if (s.phase !== "combo") return;
    const expected = s.comboSeq[s.comboIndex];
    if (!expected) return;

    if (code !== expected) {
      s.comboIndex = 0;
      applyPenalty("wrongInput");
      setAlert("WRONG BUTTON! COMBO RESET", "rgba(255, 89, 94, 0.92)", 0.6);
      return;
    }

    s.comboIndex++;
    game.score += 20;
    updateHUD();
    playBeep(620 + s.comboIndex * 22, 0.045);

    if (s.comboIndex < s.comboSeq.length) {
      setAlert(`COMBO ${s.comboIndex}/${s.comboSeq.length}`, "rgba(255, 224, 102, 0.95)", 0.45);
      return;
    }

    s.phase = "animToPot";
    s.phaseT = 0;
    game.score += 120;
    updateHUD();
    playBeep(760, 0.07);
    setAlert("NICE TIMING! SCOOPING...", "rgba(128, 255, 114, 0.92)", 0.8);
  }

  function updateStep4(dt) {
    const s = game.step4;
    if (!s.active) return;

    s.animT += dt;

    if (s.phase === "combo") {
      s.timeLeft = Math.max(0, Number(s.timeLeft || 0) - dt);
      if (s.timeLeft <= 0) {
        s.comboIndex = 0;
        s.timeLeft = Number(s.duration || 5);
        applyPenalty("wrongInput");
        setAlert("TIME UP! COMBO RESET", "rgba(255, 89, 94, 0.92)", 0.65);
      }
      return;
    }

    if (s.phase === "animToPot") {
      s.phaseT += dt;
      if (s.phaseT >= 0.7) {
        s.phase = "animToPlate";
        s.phaseT = 0;
      }
      return;
    }

    if (s.phase === "animToPlate") {
      s.phaseT += dt;
      if (s.phaseT >= 0.85) {
        s.phase = "final";
        s.finalT = 1.35;
        s.phaseT = 0;
        const servedName = game.currentDish?.name || "DISH";
        setAlert(`${servedName} SERVED!`, "rgba(128, 255, 114, 0.95)", 0.9);
      }
      return;
    }

    if (s.phase === "final") {
      s.finalT = Math.max(0, s.finalT - dt);
      if (s.finalT <= 0) completeStep4Flow();
    }
  }

  function updateStep3Gameplay(dt) {
    if (!shouldRunStep3GameplayFlow()) return;

    const s = game.step3;
    if (!s.active) s.active = true;

    if (!s.finishAnim) {
      s.pointer += s.pointerDir * dt * 0.95;
      if (s.pointer >= 1) {
        s.pointer = 1;
        s.pointerDir = -1;
      } else if (s.pointer <= 0) {
        s.pointer = 0;
        s.pointerDir = 1;
      }

      s.stirPhase += dt * 4.8;
    }

    if (s.finishAnim) {
      s.stirPhase += dt * 9.5;
      s.finishTimer = Math.max(0, s.finishTimer - dt);
      if (s.finishTimer <= 0) {
        s.finishAnim = false;
        s.active = false;
        advanceStep();
      }
    }
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
    game.state = "win";
    setAlert("DISH COMPLETE!", "rgba(128, 255, 114, 0.92)", 1.0);
    if (timer) { clearInterval(timer); timer = null; }
    startBtn.style.display = "none";
    restartBtn.style.display = "none";
    updateHUD();
  }

  function generateCookSeq() {
    const len = Math.max(4, Math.min(6, 4 + Math.floor(game.cookCombosDone / 1)));
    const seq = [];
    for (let i = 0; i < len; i++) seq.push(QWER_CODES[Math.floor(Math.random() * QWER_CODES.length)]);
    return seq;
  }

  function setProcessFx(text, ttl = 0.55) {
    game.processMini.effectText = text;
    game.processMini.effectT = ttl;
  }

  function generateComboSequence(step) {
    const target = Math.max(1, Number(step.targetBeats) || 8);
    const mode = String(step.comboMode || "smash");

    if (mode === "sizzle") {
      const base = Array.isArray(step.basePattern) && step.basePattern.length
        ? step.basePattern
        : ["KeyW", "KeyE", "KeyR", "KeyQ"];
      const seq = [];
      for (let i = 0; i < target; i++) seq.push(base[i % base.length]);
      return seq;
    }

    if (mode === "plate") {
      const chain = ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyW", "KeyE", "KeyQ", "KeyR"];
      const seq = [];
      for (let i = 0; i < target; i++) {
        const source = chain[i % chain.length];
        seq.push(i >= 6 ? QWER_CODES[Math.floor(Math.random() * 4)] : source);
      }
      return seq;
    }

    const seq = [];
    for (let i = 0; i < target; i++) seq.push(QWER_CODES[Math.floor(Math.random() * 4)]);
    return seq;
  }

  function initComboStep(step) {
    const seq = generateComboSequence(step);
    const target = Math.max(1, Number(step.targetBeats) || seq.length || 8);
    const mode = String(step.comboMode || "smash");
    const sequencesNeed = mode === "stir" ? 3 : 1;
    const beatWindow = Math.max(0.18, Number(step.beatWindow ?? step.rhythmWindow) || 0.35);
    game.processMini = {
      ...game.processMini,
      active: true,
      mode,
      processName: String(step.process || "Combo Process"),
      seq,
      index: 0,
      beats: 0,
      target,
      sequenceLen: target,
      sequencesDone: 0,
      sequencesNeed,
      streak: 0,
      bestStreak: 0,
      timeLeft: Math.max(2, Number(step.time) || 10),
      beatWindow,
      lastHitAt: 0,
      smooth: 0,
      aroma: 0,
      smoke: 0,
      spill: 0,
      burn: 0,
      cueCode: null,
      cueT: 0,
      cueEvery: Math.max(0, Number(step.cueEvery) || 0),
      cueWindow: Math.max(0.25, Number(step.cueWindow) || 1),
      secretCombo: ["KeyQ", "KeyR", "KeyE", "KeyW", "KeyQ", "KeyE"],
      secretIndex: 0,
      masterChef: false,
      flairBonus: false,
      perfectPower: false,
      effectText: "",
      effectT: 0,
      smashPulse: 0,
      smashCrack: 0,
      smashParticles: []
    };
    game.stepProgress = 0;
    setAlert(`${game.processMini.processName}`, "rgba(255, 224, 102, 0.95)", 0.9);
  }

  function spawnSmashParticle(sprite, xN, yN, speed = 0.38) {
    const ps = game.processMini;
    if (!Array.isArray(ps.smashParticles)) ps.smashParticles = [];

    const a = Math.random() * Math.PI * 2;
    const mag = speed * (0.7 + Math.random() * 0.8);
    ps.smashParticles.push({
      sprite,
      xN,
      yN,
      vx: Math.cos(a) * mag,
      vy: Math.sin(a) * mag - 0.08,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 7,
      size: 0.08 + Math.random() * 0.05,
      life: 0.8 + Math.random() * 0.45
    });

    if (ps.smashParticles.length > 42) ps.smashParticles.shift();
  }

  function triggerSmashFx(code, inRhythm) {
    const ps = game.processMini;
    ps.smashPulse = Math.min(1, ps.smashPulse + (inRhythm ? 0.72 : 0.5));
    ps.smashCrack = Math.min(1, ps.beats / Math.max(1, ps.target));

    const pieceSprite = code === "KeyE" || code === "KeyR" ? "smash_chili_fx" : "smash_garlic_fx";
    for (let i = 0; i < (inRhythm ? 4 : 2); i++) {
      spawnSmashParticle(pieceSprite, 0.5, 0.64, inRhythm ? 0.44 : 0.3);
    }

    spawnSmashParticle("smash_impact", 0.5, 0.55, 0.2);
    if (ps.smooth > 2) spawnSmashParticle("smash_splat_2", 0.48 + Math.random() * 0.04, 0.66, 0.1);
  }

  function expectedComboCode(step) {
    const ps = game.processMini;
    if (!ps.active) initComboStep(step);
    if (ps.cueCode) return ps.cueCode;

    if (!ps.seq.length) return QWER_CODES[Math.floor(Math.random() * 4)];
    return ps.seq[Math.min(ps.index, ps.seq.length - 1)];
  }

  function comboMiss(mode, text) {
    game.processMini.streak = 0;
    if (mode === "smash") game.processMini.spill = Math.min(1, game.processMini.spill + 0.45);
    if (mode === "sizzle") game.processMini.smoke = Math.min(1, game.processMini.smoke + 0.6);
    if (mode === "stir") game.processMini.burn = Math.min(1, game.processMini.burn + 0.55);
    if (mode === "plate") game.processMini.spill = Math.min(1, game.processMini.spill + 0.35);

    game.processMini.timeLeft = Math.max(0.25, game.processMini.timeLeft - 0.4);
    setProcessFx(text || "MISS");
    applyPenalty("wrongInput");
  }

  function updateSecretCombo(code) {
    const ps = game.processMini;
    const expected = ps.secretCombo[ps.secretIndex];
    if (code === expected) {
      ps.secretIndex++;
      if (ps.secretIndex >= ps.secretCombo.length) {
        ps.secretIndex = 0;
        game.score += 450;
        game.flavorMeter = Math.min(1, game.flavorMeter + 0.2);
        setAlert("SECRET RHYTHM! BONUS +450", "rgba(255, 224, 102, 0.98)", 0.95);
        updateHUD();
      }
    } else {
      ps.secretIndex = code === ps.secretCombo[0] ? 1 : 0;
    }
  }

  function handleComboKey(code, step) {
    if (!game.processMini.active) initComboStep(step);
    const ps = game.processMini;
    const mode = ps.mode;

    if (mode === "stir" && game.step3?.finishAnim) return;

    const expected = expectedComboCode(step);
    const now = performance.now();
    const dt = ps.lastHitAt ? (now - ps.lastHitAt) / 1000 : ps.beatWindow;
    const inRhythm = dt <= ps.beatWindow;

    if (code !== expected) {
      // Keep sequence progress (index/beats) intact on wrong input.
      comboMiss(mode, mode === "sizzle" ? "OVERFRY!" : "MISSED BEAT!");
      if (mode === "sizzle") setAlert("SMOKE CLOUD!", "rgba(255, 89, 94, 0.92)", 0.7);
      return;
    }

    ps.lastHitAt = now;
    ps.beats++;
    ps.index = Math.min(ps.seq.length, ps.index + 1);
    ps.streak++;
    ps.bestStreak = Math.max(ps.bestStreak, ps.streak);
    ps.smooth = Math.max(-4, Math.min(10, ps.smooth + (inRhythm ? 1 : -0.5)));
    ps.aroma = Math.min(1, ps.aroma + (mode === "sizzle" ? 0.1 : 0.04));
    game.flavorMeter = Math.min(1, game.flavorMeter + (inRhythm ? 0.03 : 0.015));

    awardStepPoints(0.3 + (inRhythm ? 0.15 : 0));
    updateSecretCombo(code);

    if (mode === "sizzle") {
      const fxMap = {
        KeyW: "Garlic Sizzle",
        KeyE: "Chili Pop",
        KeyR: "Ginger Aroma",
        KeyQ: "Flame Flicker"
      };
      setProcessFx(fxMap[code] || "Sizzle");
    } else if (mode === "smash") {
      triggerSmashFx(code, inRhythm);
      setProcessFx(inRhythm ? "Smooth Paste" : "Lumpy Paste");
    } else if (mode === "stir") {
      setProcessFx("Juicy Stir");
    } else {
      setProcessFx("Plating Flow");
    }

    if (ps.cueCode) {
      ps.cueCode = null;
      ps.cueT = 0;
      game.score += 120;
      setAlert("CUE HIT!", "rgba(128, 255, 114, 0.92)", 0.45);
      updateHUD();
    }

    if (mode === "stir" && ps.cueEvery > 0 && ps.beats % ps.cueEvery === 0 && !ps.cueCode) {
      ps.cueCode = QWER_CODES[Math.floor(Math.random() * 4)];
      ps.cueT = ps.cueWindow;
      setAlert("REACT CUE!", "rgba(255, 224, 102, 0.95)", 0.45);
    }

    if (step.perfectPowerUp && ps.beats >= 8 && ps.streak >= 8 && ps.smooth >= 6 && !ps.perfectPower) {
      ps.perfectPower = true;
      ps.beats = ps.target;
      game.score += 300;
      game.flavorMeter = Math.min(1, game.flavorMeter + 0.12);
      setAlert("POWER-UP: PERFECT PASTE!", "rgba(128, 255, 114, 0.95)", 0.9);
      updateHUD();
    }

    if (mode === "plate" && ps.beats >= ps.target && dt <= (Number(step.rhythmWindow) || 0.3)) {
      ps.flairBonus = true;
      game.score += 250;
      setAlert("FLAIR PLATING +250", "rgba(128, 255, 114, 0.95)", 0.8);
      updateHUD();
    }

    if (ps.sequenceLen > 0 && ps.index >= ps.sequenceLen) {
      ps.sequencesDone = Math.min(ps.sequencesNeed, (ps.sequencesDone | 0) + 1);
      ps.index = 0;
      ps.seq = generateComboSequence({
        ...step,
        targetBeats: ps.sequenceLen,
        comboMode: mode
      });
      setAlert(`SEQUENCE ${ps.sequencesDone}/${ps.sequencesNeed} COMPLETE`, "rgba(128, 255, 114, 0.92)", 0.55);
    }

    if (ps.sequencesNeed > 1) {
      const partial = ps.sequenceLen > 0 ? (ps.index / ps.sequenceLen) : 0;
      game.stepProgress = Math.max(0, Math.min(1, (ps.sequencesDone + partial) / Math.max(1, ps.sequencesNeed)));
    } else {
      game.stepProgress = Math.max(0, Math.min(1, ps.beats / Math.max(1, ps.target)));
    }

    const sequenceGoalMet = ps.sequencesNeed > 1
      ? (ps.sequencesDone >= ps.sequencesNeed)
      : (ps.beats >= ps.target);

    if (sequenceGoalMet) {
      if (mode === "stir" && shouldRunStep3GameplayFlow()) {
        game.step3.finishAnim = true;
        game.step3.finishTimer = 1.15;
        game.score += 220;
        updateHUD();
        setAlert("STIR COMPLETE!", "rgba(128, 255, 114, 0.95)", 0.8);
        return;
      }

      if (step.allowMasterChef && game.flavorMeter >= 0.95 && ps.bestStreak >= 7) {
        ps.masterChef = true;
        game.score += 600;
        setAlert("PERANAKAN MASTER CHEF!", "rgba(128, 255, 114, 0.95)", 1.0);
        updateHUD();
      } else {
        setAlert("PROCESS COMPLETE!", "rgba(128, 255, 114, 0.92)", 0.7);
      }
      advanceStep();
    }
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

    if (shouldRunStep2Flow()) {
      startStep2Flow();
      return;
    }

    if (shouldRunStep3IntroFlow()) {
      startStep3Intro();
      return;
    }

    if (shouldRunStep4IntroFlow()) {
      startStep4Intro();
      return;
    }

    const step = currentStep();
    if (step) {
      if (step.type === "serve") setAlert("SERVE: press GREEN BUTTON", "rgba(128, 255, 114, 0.92)", 0.9);
      else if (step.type === "cook") setAlert("COOK: match the icons (QWER)", "rgba(255, 224, 102, 0.90)", 0.9);
      else if (step.type === "combo") setAlert(`${step.process || "COMBO PROCESS"}`, "rgba(255, 224, 102, 0.90)", 0.9);
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
    heldCodes.clear();
    game.score = 0;
    game.combo = 0;
    game.time = 180;
    game.state = "playing";
    game.endRecorded = false;

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

  function pulseKeyGlow(code) {
    if (!game.keyGlow || !Object.prototype.hasOwnProperty.call(game.keyGlow, code)) return;
    game.keyGlow[code] = 0.22;
  }

  function updateKeyGlow(dt) {
    if (!game.keyGlow) return;
    for (const k of Object.keys(game.keyGlow)) {
      game.keyGlow[k] = Math.max(0, Number(game.keyGlow[k] || 0) - dt);
    }
  }

  function buildBottomPreview() {
    const codeToLabel = { KeyQ: "Q", KeyW: "W", KeyE: "E", KeyR: "R" };
    const toLabel = (code) => codeToLabel[code] || "?";

    if (game.step2?.active && !game.step2?.intro) {
      const seq = Array.isArray(game.step2.comboSeq) ? game.step2.comboSeq : [];
      return { label: "Sequence Preview", keys: seq.map(toLabel), index: game.step2.comboIndex | 0 };
    }

    const step = currentStep();
    if (!step) return null;

    if (step.type === "cook") {
      const seq = Array.isArray(game.cookSeq) ? game.cookSeq : [];
      return { label: "Sequence Preview", keys: seq.map(toLabel), index: game.cookSeqIndex | 0 };
    }

    if (step.type === "combo") {
      const ps = game.processMini || {};
      const seq = Array.isArray(ps.seq) ? ps.seq : [];
      const index = Math.max(0, ps.index | 0);
      const window = seq.slice(index, index + 6).map(toLabel);
      return { label: "Sequence Preview", keys: window, index: 0 };
    }

    if (step.type === "serve") {
      return { label: "Sequence Preview", keys: ["W"], index: 0 };
    }

    if (step.type === "prep" || step.type === "action") {
      const uses = (step.uses && step.uses.length ? step.uses : game.sequence).slice(0, 4);
      const keys = uses.map((ing) => String(keyLabelForIngredient(ing) || "?"));
      return { label: "Ingredient Keys", keys, index: -1 };
    }

    return null;
  }

  async function enterDishSelectFromMenu() {
    if (menuStartPending) return;
    menuStartPending = true;
    try {
      await ensureAudio();
      if (!assetsLoaded) {
        startBtn.textContent = "LOADING...";
        await loadAssets();
        assetsLoaded = true;
        startBtn.textContent = "START GAME";
      }
      pickDishOptions();
      game.state = "dish-select";
      startBtn.style.display = "none";
      restartBtn.style.display = "none";
    } finally {
      menuStartPending = false;
    }
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
    heldCodes.add(e.code);
    if (game.state === "win" || game.state === "gameover") {
      if (e.repeat) return;
      if (e.code === "KeyQ") {
        e.preventDefault();
        game.state = "menu";
        startBtn.style.display = "none";
        restartBtn.style.display = "none";
      }
      return;
    }

    if (game.state === "menu") {
      if (e.repeat) return;
      if (e.code === "KeyQ") {
        e.preventDefault();
        pulseKeyGlow("KeyQ");
        void enterDishSelectFromMenu();
      }
      return;
    }

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
      if (idx !== -1 && dishOptions[idx]) {
        if (testMode) startGame(dishOptions[idx]);
        else startScan(dishOptions[idx]);
      }
      return;
    }

    if (game.state !== "playing") return;
    if (game.step1.active) {
      if (e.repeat) return;
      const step1Code = e.code;
      if (!QWER_CODES.includes(step1Code)) return;
      e.preventDefault();
      pulseKeyGlow(step1Code);
      handleStep1Key(step1Code);
      return;
    }
    if (game.step2.active) {
      if (e.repeat || game.step2.intro) return;
      const step2Code = e.code;
      if (!QWER_CODES.includes(step2Code)) return;
      e.preventDefault();
      pulseKeyGlow(step2Code);
      handleStep2ComboKey(step2Code);
      return;
    }
    if (game.step4.active) {
      if (e.repeat) return;
      if (!QWER_CODES.includes(e.code)) return;
      e.preventDefault();
      pulseKeyGlow(e.code);
      handleStep4Key(e.code);
      return;
    }
    if (shouldRunStep3GameplayFlow() && game.step3.active) {
      if (e.repeat) return;
      if (!QWER_CODES.includes(e.code)) return;
      e.preventDefault();
      pulseKeyGlow(e.code);
      handleStep3TimingKey(e.code);
      return;
    }
    if (game.step3Intro.active) return;
    if (game.step4Intro.active) return;
    if (game.dishCountdown > 0) return;
    if (e.repeat) return;

    const code = e.code;
    const step = currentStep();
    if (!step) return;

    const qwerIndex = QWER_CODES.indexOf(code);
    if (qwerIndex === -1) return;

    e.preventDefault();
    pulseKeyGlow(code);

    if (step.type === "serve") {
      if (code === "KeyW") {
        awardStepPoints(1.0);
        setAlert("SERVED!", "rgba(128, 255, 114, 0.92)", 0.55);
        advanceStep();
      } else {
        applyPenalty("wrongEnter");
        setAlert("SERVE = GREEN BUTTON", "rgba(255, 89, 94, 0.92)", 0.75);
      }
      return;
    }

    if (step.type === "cook") {
      handleCookKey(code, step);
      return;
    }

    if (step.type === "combo") {
      handleComboKey(code, step);
      return;
    }

    if (step.type === "prep" || step.type === "action") {
      const pressedIngredient = ingredientForKeyIndex(qwerIndex);
      handlePrepOrActionPress(pressedIngredient);
    }
  }

  function onKeyUp(e) {
    heldCodes.delete(e.code);
    if (game.state !== "playing") return;
    if (!game.step1.active || game.step1.intro) return;
    if (game.step1.phase !== "scoop") return;
    if (e.code === "KeyW" || e.code === "KeyE") {
      game.step1.scoopHolding = heldCodes.has("KeyW") && heldCodes.has("KeyE");
    }
  }

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  function onCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (game.state !== "dish-select") return;

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
        if (testMode) startGame(dishOptions[i]);
        else startScan(dishOptions[i]);
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

  function updateComboStep(dt) {
    const step = currentStep();
    if (!step || step.type !== "combo") return;
    if (!game.processMini.active) initComboStep(step);

    const ps = game.processMini;
    ps.timeLeft = Math.max(0, ps.timeLeft - dt);
    ps.smoke = Math.max(0, ps.smoke - dt * 0.45);
    ps.spill = Math.max(0, ps.spill - dt * 0.9);
    ps.burn = Math.max(0, ps.burn - dt * 0.55);
    ps.smashPulse = Math.max(0, (ps.smashPulse || 0) - dt * 2.3);
    if (ps.effectT > 0) ps.effectT = Math.max(0, ps.effectT - dt);

    if (Array.isArray(ps.smashParticles) && ps.smashParticles.length) {
      for (let i = ps.smashParticles.length - 1; i >= 0; i--) {
        const p = ps.smashParticles[i];
        p.life -= dt;
        p.xN += p.vx * dt;
        p.yN += p.vy * dt;
        p.vy += 0.5 * dt;
        p.rot += p.vr * dt;
        if (p.life <= 0 || p.xN < -0.2 || p.xN > 1.2 || p.yN > 1.3) ps.smashParticles.splice(i, 1);
      }
    }

    if (ps.cueT > 0) {
      ps.cueT = Math.max(0, ps.cueT - dt);
      if (ps.cueT <= 0 && ps.cueCode) {
        ps.cueCode = null;
        comboMiss(ps.mode, "MISSED CUE!");
      }
    }

    if (ps.timeLeft <= 0) {
      comboMiss(ps.mode, "TIME SLIP!");
      ps.timeLeft = 1.2;
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
      updateKeyGlow(dt);
      if (game.step1.active) {
        updateStep1(dt);
      } else if (game.step2.active) {
        updateStep2(dt);
      } else if (game.step3Intro.active) {
        updateStep3Intro(dt);
        updateShake(dt);
      } else if (game.step4Intro.active) {
        updateStep4Intro(dt);
        updateShake(dt);
      } else if (game.step4.active) {
        updateStep4(dt);
        updateShake(dt);
      } else {
        updateDishCountdown(dt);
        updateShake(dt);
        if (game.dishCountdown <= 0) {
          if (shouldRunStep3GameplayFlow()) {
            updateStep3Gameplay(dt);
          } else {
            updateCookStep(dt);
            if (!game.step3.finishAnim) updateComboStep(dt);
          }
        }
      }
      updateAlert(dt);
    }

    if ((game.state === "gameover" || game.state === "win") && !game.endRecorded) {
      recordScoreToLeaderboard();
      game.endRecorded = true;
    }

    if (game.state === "scan") updateScanFeedback(dt);
    if (game.state !== "playing") updateKeyGlow(dt);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(ctx, canvas, assets);

    if (game.state === "menu") {
      titleTime += 0.05;
      drawLanding(ctx, canvas, titleTime, assets, game);
    }

    if (game.state === "dish-select") {
      drawDishSelect(ctx, canvas, dishOptions, keyLabels, assets);
    }

    if (game.state === "scan") {
      drawScanScreen(ctx, canvas, game.scan, assets);
    }

    if (game.state === "playing") {
      const uiBottomY = drawTopStack(ctx, canvas, game, alertState);
      const preview = buildBottomPreview();
      const showBottomButtons = true;
      const bottomUiTop = showBottomButtons
        ? drawBottomButtons(ctx, canvas, game, assets, preview)
        : canvas.height;
      if (game.step1.active) {
        if (game.step1.intro) drawStep1Intro(ctx, canvas, game.step1, assets);
        else drawStep1Gameplay(ctx, canvas, game.step1, assets);
      } else if (game.step2.active) {
        if (game.step2.intro) drawStep2Intro(ctx, canvas, game.step2, assets);
        else drawStep2Gameplay(ctx, canvas, game.step2, assets);
      } else if (game.step3Intro.active) {
        drawStep3Intro(ctx, canvas, game.step3Intro, assets);
      } else if (game.step4Intro.active) {
        drawStep4Intro(ctx, canvas, game.step4Intro, assets);
      } else if (game.step4.active) {
        drawStep4Gameplay(ctx, canvas, game, assets, uiBottomY, bottomUiTop);
      } else if (shouldRunStep3GameplayFlow()) {
        drawStep3Gameplay(ctx, canvas, game, assets, uiBottomY, bottomUiTop);
      } else {
        let y = uiBottomY;
        y += drawComboFlames(ctx, canvas, game, y) + 10;
        y += drawTopSequencePreview(ctx, canvas, assets, preview, y) + 10;

        if (game.shake > 0) game.shake--;

        drawPlate(ctx, canvas, game, assets, y);

        drawProcessOverlay(ctx, canvas, game, assets);

        drawInstructions(ctx, canvas, game, {
          currentStep,
          getNeededForStep,
          getDoneForStep,
          keyLabelForIngredient,
          assets,
          bottomUiTop
        });
      }
    }

    if (game.state === "gameover") drawGameOver(ctx, canvas, game, assets);
    if (game.state === "win") drawWin(ctx, canvas, game, assets);

    requestAnimationFrame(loop);
  }

  return {
    async onStartClick() { await enterDishSelectFromMenu(); },
    restart() {
      pickDishOptions();
      game.state = "dish-select";
      startBtn.style.display = "none";
      restartBtn.style.display = "none";
    },
    loop
  };
}
