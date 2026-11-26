'use strict';
/**
 * Measures whether possession affects shots and goals in the current engine.
 * Run: node tools/possession-goals.js
 */
const { createMatchEngine } = require('../js/engine.js');
const { mulberry32 } = require('../js/rng.js');

const N = 2000;
const neutral = { homeCrowdSupport: 0, homeMorale: 2, awayMorale: 2, homeTactics: 1, awayTactics: 1 };

function pearson(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let dx = 0, dy = 0, dxy = 0;
  for (let i = 0; i < n; i++) {
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
    dxy += (xs[i] - mx) * (ys[i] - my);
  }
  return dxy / Math.sqrt(dx * dy);
}

const pair = [50, 50];
const hPoss = [], hShots = [], hGoals = [];
const aPoss = [], aShots = [], aGoals = [];

for (let i = 0; i < N; i++) {
  const e = createMatchEngine({ ...neutral, homeStrength: pair[0], awayStrength: pair[1] }, mulberry32(i * 7919 + 13));
  e.kickOff();
  while (!e.state.isFinished) e.tick();
  hPoss.push(e.state.homePossession);
  hShots.push(e.state.homeShots);
  hGoals.push(e.state.homeGoals);
  aPoss.push(e.state.awayPossession);
  aShots.push(e.state.awayShots);
  aGoals.push(e.state.awayGoals);
}

console.log('50/50 matchup, ' + N + ' matches');
console.log('');
console.log('HOME:');
console.log('  possession vs shots correlation:   ' + pearson(hPoss, hShots).toFixed(3));
console.log('  possession vs goals correlation:   ' + pearson(hPoss, hGoals).toFixed(3));
console.log('  mean possession: ' + (hPoss.reduce((a,b)=>a+b,0)/N).toFixed(1));
console.log('  mean shots: ' + (hShots.reduce((a,b)=>a+b,0)/N).toFixed(1));
console.log('  mean goals: ' + (hGoals.reduce((a,b)=>a+b,0)/N).toFixed(3));
console.log('');
console.log('AWAY:');
console.log('  possession vs shots correlation:   ' + pearson(aPoss, aShots).toFixed(3));
console.log('  possession vs goals correlation:   ' + pearson(aPoss, aGoals).toFixed(3));
console.log('  mean possession: ' + (aPoss.reduce((a,b)=>a+b,0)/N).toFixed(1));
console.log('  mean shots: ' + (aShots.reduce((a,b)=>a+b,0)/N).toFixed(1));
console.log('  mean goals: ' + (aGoals.reduce((a,b)=>a+b,0)/N).toFixed(3));
console.log('');
console.log('INTERPRETATION:');
console.log('  Correlations near 0 mean possession does NOT affect shots/goals.');
console.log('  Currently shots are rolled independently per side (potentialShots/90),');
console.log('  with no possession check. Possession and goals are fully decoupled.');
console.log('  Coupling them would require gating shots on possession share,');
