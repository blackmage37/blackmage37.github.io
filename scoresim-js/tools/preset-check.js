'use strict';
/**
 * Check each goal-rate preset against the locked bands at 70/30 with
 * possession coupling active. Run: node tools/preset-check.js
 */
const { createMatchEngine, GOAL_RATE_PRESETS } = require('../js/engine.js');
const { mulberry32 } = require('../js/rng.js');

const N = 20000;
const base = { homeCrowdSupport: 0, homeMorale: 2, awayMorale: 2, homeTactics: 1, awayTactics: 1 };
const SEED = 104729 * 17 + 123457;

for (const preset of ['low', 'medium', 'high']) {
  const cfg = { ...base, goalRate: preset };
  let hw = 0, d = 0, aw = 0, g = 0;
  for (let i = 0; i < N; i++) {
    const s = createMatchEngine({ ...cfg, homeStrength: 70, awayStrength: 30 }, mulberry32(SEED + i * 104729)).simulateToEnd();
    if (s.homeGoals > s.awayGoals) hw++;
    else if (s.homeGoals < s.awayGoals) aw++;
    else d++;
    g += s.homeGoals + s.awayGoals;
  }
  let h50 = 0, g50 = 0;
  for (let i = 0; i < N; i++) {
    const s = createMatchEngine({ ...cfg, homeStrength: 50, awayStrength: 50 }, mulberry32(SEED + 1000000 + i * 104729)).simulateToEnd();
    if (s.homeGoals > s.awayGoals) h50++;
    g50 += s.homeGoals + s.awayGoals;
  }
  const fav = hw / N * 100, und = aw / N * 100, goals = g / N, goals50 = g50 / N;
  const inBand = fav >= 63 && fav <= 68 && und >= 13 && und <= 17;
  console.log(
    preset.toUpperCase().padEnd(8) +
    ' div=' + GOAL_RATE_PRESETS[preset].goalDivisor +
    ' floor=' + GOAL_RATE_PRESETS[preset].goalChanceFloor +
    ' | fav ' + fav.toFixed(1) + '% | draw ' + (d / N * 100).toFixed(1) + '% | und ' + und.toFixed(1) + '% | goals ' + goals.toFixed(2) +
    ' | 50/50 fav ' + h50 / N * 100 + '% goals ' + goals50.toFixed(2) +
    ' | ' + (inBand ? 'IN BAND' : 'OUT')
  );
}
