'use strict';
/**
 * Measure actual balanced (50/50) goals per preset with possession coupling.
 * Run: node tools/balanced-goals.js
 */
const { createMatchEngine, GOAL_RATE_PRESETS } = require('../js/engine.js');
const { mulberry32 } = require('../js/rng.js');

const N = 5000;
const base = { homeCrowdSupport: 0, homeMorale: 2, awayMorale: 2, homeTactics: 1, awayTactics: 1 };
const SEED = 104729 * 17 + 123457;

for (const preset of ['low', 'medium', 'high']) {
  let g = 0;
  for (let i = 0; i < N; i++) {
    const s = createMatchEngine({ ...base, goalRate: preset, homeStrength: 50, awayStrength: 50 }, mulberry32(SEED + i * 104729)).simulateToEnd();
    g += s.homeGoals + s.awayGoals;
  }
  const actual = (g / N).toFixed(3);
  console.log(preset.padEnd(8) + ' actual balancedGoals=' + actual + '  current doc value=' + GOAL_RATE_PRESETS[preset].balancedGoals);
}
