import "./style.css";
import { createGame } from "./game/engine.js";

const canvas = document.getElementById("gameCanvas");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const hud = {
  scoreEl: document.getElementById("score"),
  comboEl: document.getElementById("combo"),
  timeEl: document.getElementById("time")
};

if (!canvas) {
  // If getElementById can't find a matching id, it returns null.
  throw new Error("Canvas element #gameCanvas not found. Check index.html.");
}

const game = createGame({ canvas, startBtn, restartBtn, hud });

startBtn.addEventListener("click", game.onStartClick);
restartBtn.addEventListener("click", game.restart);

requestAnimationFrame(game.loop);
