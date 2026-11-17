// Tiny WebAudio synth. Nothing plays until the visitor turns sound on.
let ctx = null;
let enabled = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur = 0.08, type = 'square', vol = 0.04, when = 0) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + when;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

const sounds = {
  click: () => tone(880, 0.04, 'square', 0.025),
  key: () => tone(1200 + Math.random() * 300, 0.02, 'square', 0.012),
  ok: () => { tone(660, 0.07); tone(990, 0.1, 'square', 0.04, 0.07); },
  err: () => { tone(220, 0.14, 'sawtooth', 0.05); tone(160, 0.2, 'sawtooth', 0.05, 0.12); },
  unlock: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.09, 'triangle', 0.05, i * 0.07)); },
  kill: () => tone(140, 0.18, 'sawtooth', 0.05),
  pop: () => tone(520 + Math.random() * 200, 0.05, 'sine', 0.05),
  boom: () => { tone(80, 0.6, 'sawtooth', 0.08); tone(50, 0.9, 'square', 0.06, 0.1); },
  alarm: () => { tone(880, 0.15, 'square', 0.04); tone(660, 0.15, 'square', 0.04, 0.16); },
};

export const sound = {
  get on() { return enabled; },
  set(on) {
    enabled = on;
    if (on) ac();
  },
  play(name) {
    if (!enabled) return;
    try { sounds[name]?.(); } catch { /* audio is best effort */ }
  },
};
