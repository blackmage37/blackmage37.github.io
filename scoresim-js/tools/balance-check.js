'use strict';
/**
 * Balance check after the possession fix. Run: node tools/balance-check.js
 * 20000 seeded matches per strength pairing.
 */
const { createMatchEngine } = require('../js/engine.js');
const { mulberry32 } = require('../js/rng.js');

const N = 20000;
const neutral = { homeCrowdSupport: 0, homeMorale: 2, awayMorale: 2, homeTactics: 1, awayTactics: 1 };

console.log('Strength | Fav win | Draw | Underdog win | Goals/match');
for (const [h, a] of [[30, 70], [40, 60], [45, 55], [50, 50], [55, 45], [60, 40], [70, 30]]) {
  let hw = 0, d = 0, aw = 0, g = 0;
  for (let i = 0; i < N; i++) {
    const s = createMatchEngine({ ...neutral, homeStrength: h, awayStrength: a }, mulberry32(i * 7919 + 13)).simulateToEnd();
    if (s.homeGoals > s.awayGoals) hw++;
    else if (s.homeGoals < s.awayGoals) aw++;
    else d++;
    g += s.homeGoals + s.awayGoals;
  }
  console.log(
    `${h}/${a}: ${(hw / N * 100).toFixed(1)}%  ${(d / N * 100).toFixed(1)}%  ${(aw / N * 100).toFixed(1)}%  ${(g / N).toFixed(2)}`
  );
}
