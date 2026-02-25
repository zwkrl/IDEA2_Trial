// src/game/data.js
export const keyLabels = ["Q", "W", "E", "R"];

export const ingredientPool = {
  chicken: { sprite: "chicken", id: 101 },
  pork: { sprite: "pork", id: 102 },
  garlic: { sprite: "garlic", id: 201 },
  ginger: { sprite: "ginger", id: 202 },
  chili: { sprite: "chili", id: 203 },
  shrimp: { sprite: "shrimp", id: 301 },
  coconut: { sprite: "coconut", id: 302 },
  rice: { sprite: "rice", id: 303 }
};

export const STIR_WIDTH = 0.40;  // 40%
export const STIR_CENTER = 0.50; // middle of the bar

export const STIR_PERFECT = [
  STIR_CENTER - STIR_WIDTH / 2,
  STIR_CENTER + STIR_WIDTH / 2
];

export const PENALTY = {
  wrongInputScore: 120,
  wrongEnterScore: 160,
  wrongStirScore: 160,

  wrongInputTime: 0,
  wrongEnterTime: 1,
  wrongStirTime: 0,

  // decreased vibration intensity
  shake: 6,
  comboReset: true
};

export const dishes = [
  {
    name: "AYAM BUAH KELUAK",
    culture: "Peranakan",
    ingredients: ["chicken", "garlic", "ginger", "chili"],
    steps: [
      {
        type: "combo",
        process: "Process 1: Smash & Prep Keluak",
        label: "Hit random 8-beat chop/mash combos (QWER). Fast rhythm = smooth paste.",
        comboMode: "smash",
        targetBeats: 8,
        time: 10,
        beatWindow: 0.38,
        perfectPowerUp: true
      },
      {
        type: "combo",
        process: "Process 2: Sizzle & Fry",
        label: "Follow alternating rhythm W-E-R-Q. Build aroma; wrong hits create smoke.",
        comboMode: "sizzle",
        basePattern: ["KeyW", "KeyE", "KeyR", "KeyQ"],
        targetBeats: 12,
        time: 12,
        rhythmWindow: 0.34
      },
      {
        type: "combo",
        process: "Process 3: Stir & Cook Chicken",
        label: "Rapid combos + random cue hits for juicy chicken. Misses can burn the pan.",
        comboMode: "stir",
        targetBeats: 14,
        time: 14,
        cueEvery: 4,
        cueWindow: 1.0
      },
      {
        type: "combo",
        process: "Process 4: Plate & Garnish",
        label: "Complete the plating chain in rhythm. Perfect garnish timing gives flair bonus.",
        comboMode: "plate",
        targetBeats: 10,
        time: 11,
        rhythmWindow: 0.3,
        allowMasterChef: true
      }
    ]
  },
  {
    name: "CURRY FENG",
    culture: "Eurasian",
    ingredients: ["pork", "garlic", "ginger", "chili"],
    steps: [
      { type: "prep", label: "Prep aromatics", uses: ["garlic","ginger"], counts: { garlic: 4, ginger: 4 } },
      { type: "cook", label: "Fry aromatics ", time: 4.0, stirPerfectWindow: STIR_PERFECT },
      { type: "serve", label: "Serve: press ENTER" },
      { type: "action", label: "Add pork", uses: ["pork"], counts: { pork: 2 } },
      { type: "cook", label: "Simmer curry ", time: 4.0, stirPerfectWindow: STIR_PERFECT },
      { type: "serve", label: "Serve: press ENTER" }
    ]
  },
  {
    name: "LAKSA SIGLAP",
    culture: "Malay",
    ingredients: ["shrimp", "coconut", "chili", "rice"],
    steps: [
      { type: "action", label: "Add chili (make the paste)", uses: ["chili"], counts: { chili: 3 } },
      { type: "cook", label: "Sauté chili paste ", time: 4.0, stirPerfectWindow: STIR_PERFECT },
      { type: "serve", label: "Serve: press ENTER" },

      { type: "action", label: "Add coconut milk", uses: ["coconut"], counts: { coconut: 2 } },
      { type: "cook", label: "Simmer broth ", time: 4.0, stirPerfectWindow: STIR_PERFECT },
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
      { type: "cook", label: "Simmer chicken ", time: 4.0, stirPerfectWindow: STIR_PERFECT },
      { type: "serve", label: "Serve: press ENTER" },
      { type: "action", label: "Add rice", uses: ["rice"], counts: { rice: 2 } },
      { type: "serve", label: "Final serve: press ENTER" }
    ]
  }
];
