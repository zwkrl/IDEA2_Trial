// src/game/audio.js
let audioCtx = null;

export async function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") await audioCtx.resume();
}

export function playBeep(freq = 500, dur = 0.08) {
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
