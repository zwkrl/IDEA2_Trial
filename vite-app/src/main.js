import "./style.css";
import { createGame } from "./game/engine.js";

const canvas = document.getElementById("gameCanvas");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const timeEl = document.getElementById("time");

const game = createGame({
  canvas,
  startBtn,
  restartBtn,
  hud: { scoreEl, comboEl, timeEl }
});

startBtn.addEventListener("click", () => game.onStartClick());
restartBtn.addEventListener("click", () => game.restart());

game.loop();
