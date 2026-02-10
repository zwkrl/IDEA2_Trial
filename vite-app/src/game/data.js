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
        type: "prep",
        label: "Blend rempah (hit the right keys)",
        uses: ["garlic", "ginger", "chili"],
        counts: { garlic: 3, ginger: 3, chili: 4 }
      },
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
      { type: "action", label: "Add chili (make the paste)", uses: ["chili"], counts: { chili: 3 } },
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
