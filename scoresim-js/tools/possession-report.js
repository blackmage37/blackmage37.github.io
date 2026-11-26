'use strict';
/**
 * Possession distribution report. Run: node tools/possession-report.js
 * Measures home possession at a few strength pairings on fixed seeds.
 */
const { createMatchEngine } = require('../js/engine.js');
const { mulberry32 } = require('../js/rng.js');

const N = Number(process.env.N || 5000);
const neutral = { homeCrowdSupport: 0, homeMorale: 2, awayMorale: 2, homeTactics: 1, awayTactics: 1 };
const pairs = [[50, 50], [51.5, 48.5], [70, 30]];

for (const [h, a] of pairs) {
  const poss = [];
  let atCap = 0, atFloor = 0;
  for (let i = 0; i < N; i++) {
    const s = createMatchEngine({ ...neutral, homeStrength: h, awayStrength: a }, mulberry32(i * 7919 + 13)).simulateToEnd();
    poss.push(s.homePossession);
    if (s.homePossession >= 85) atCap++;
    if (s.homePossession <= 15) atFloor++;
  }
  poss.sort((x, y) => x - y);
  const mean = poss.reduce((x, y) => x + y, 0) / N;
  const sd = Math.sqrt(poss.reduce((x, y) => x + (y - mean) ** 2, 0) / N);
  const q = (f) => poss[Math.floor(f * (N - 1))];
  console.log(
    `${h}/${a}: mean ${mean.toFixed(1)} sd ${sd.toFixed(1)} ` +
    `p5 ${q(0.05)} p50 ${q(0.5)} p95 ${q(0.95)} | ` +
    `at 85 cap ${((atCap / N) * 100).toFixed(1)}% at 15 floor ${((atFloor / N) * 100).toFixed(1)}%`
  );
}
