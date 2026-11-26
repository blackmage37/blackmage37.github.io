'use strict';
/**
 * Traces possession over several minutes with a fixed random source.
 * Run: node tools/possession-trace.js
 */
const { createMatchEngine } = require('../js/engine.js');

function trace(label, roll) {
  const e = createMatchEngine({ homeStrength: 50, awayStrength: 50, homeMorale: 2, awayMorale: 2 }, () => roll);
  e.kickOff();
  const rows = [];
  for (let m = 0; m < 3; m++) {
    e.tick();
    rows.push(`${e.state.minute}': ${e.state.homePossession}/${e.state.awayPossession}`);
  }
  console.log(`${label}: ${rows.join('  ')}`);
}

trace('roll 0.99 every draw', 0.99);
trace('roll 0.01 every draw', 0.01);
