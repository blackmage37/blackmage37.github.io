'use strict';
/**
 * Check preset variants against locked bands at 70/30 with possession coupling.
 * Run: node tools/preset-variant.js
 */
const E = require('../js/engine.js');
const { createMatchEngine, GOAL_RATE_PRESETS } = E;
const { mulberry32 } = require('../js/rng.js');

const N = 20000;
const base = { homeCrowdSupport: 0, homeMorale: 2, awayMorale: 2, homeTactics: 1, awayTactics: 1 };
const SEED = 104729 * 17 + 123457;

function setPreset(name, div, floor) {
  GOAL_RATE_PRESETS[name].goalDivisor = div;
  GOAL_RATE_PRESETS[name].goalChanceFloor = floor;
}

function measure(name) {
  let hw = 0, d = 0, aw = 0, g = 0;
  for (let i = 0; i < N; i++) {
    const s = createMatchEngine({ ...base, goalRate: name, homeStrength: 70, awayStrength: 30 }, mulberry32(SEED + i * 104729)).simulateToEnd();
    if (s.homeGoals > s.awayGoals) hw++;
    else if (s.homeGoals < s.awayGoals) aw++;
    else d++;
    g += s.homeGoals + s.awayGoals;
  }
  return { fav: hw / N * 100, und: aw / N * 100, draw: d / N * 100, goals: g / N };
}

console.log('Testing variants at 70/30 (need fav 63-68%, und 13-17%):');
for (const [label, key, div, floor] of [
  ['LOW  div=1.4 floor=0.2', 'low', 1.4, 0.2],
  ['LOW  div=1.4 floor=0.225', 'low', 1.4, 0.225],
  ['LOW  div=1.4 floor=0.25', 'low', 1.4, 0.25],
  ['MED  div=1.2 floor=0.25', 'medium', 1.2, 0.25],
  ['MED  div=1.25 floor=0.25', 'medium', 1.25, 0.25],
  ['HIGH div=1.0 floor=0.3', 'high', 1.0, 0.3],
  ['HIGH div=1.05 floor=0.3', 'high', 1.05, 0.3],
  ['HIGH div=1.1 floor=0.3', 'high', 1.1, 0.3],
]) {
  setPreset(key, div, floor);
  const r = measure(key);
  const inBand = r.fav >= 63 && r.fav <= 68 && r.und >= 13 && r.und <= 17;
  console.log(
    label.padEnd(22) +
    ' | fav ' + r.fav.toFixed(1) + '% | draw ' + r.draw.toFixed(1) + '% | und ' + r.und.toFixed(1) + '% | goals ' + r.goals.toFixed(2) +
    ' | ' + (inBand ? 'IN BAND' : 'OUT')
  );
}

// restore defaults
setPreset('low', 1.4, 0.2);
setPreset('medium', 1.2, 0.25);
setPreset('high', 1.0, 0.3);
