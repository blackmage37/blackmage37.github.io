'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { createMatchEngine, GOAL_RATE_PRESETS } = require('../js/engine.js');
const { mulberry32 } = require('./helpers.js');

const neutral = { homeCrowdSupport: 0, homeMorale: 2, awayMorale: 2, homeTactics: 1, awayTactics: 1 };
const PRESET_SEED = 104729 * 13 + 555555;

function measure(goalRate, h, a, n = 10000) {
  let hw = 0, aw = 0, goals = 0;
  for (let i = 0; i < n; i++) {
    const e = createMatchEngine({ ...neutral, goalRate, homeStrength: h, awayStrength: a }, mulberry32(PRESET_SEED + i * 104729));
    const s = e.simulateToEnd();
    if (s.homeGoals > s.awayGoals) hw++;
    else if (s.homeGoals < s.awayGoals) aw++;
    goals += s.homeGoals + s.awayGoals;
  }
  return { fav: hw / n, und: aw / n, goals: goals / n };
}

describe('goal-rate presets: validation', () => {
  test('defines low, medium and high', () => {
    assert.deepEqual(Object.keys(GOAL_RATE_PRESETS).sort(), ['high', 'low', 'medium']);
  });

  test('unknown preset is rejected with a clear error', () => {
    assert.throws(() => createMatchEngine({ goalRate: 'extreme' }), /unknown goalRate "extreme"/);
  });

  test('medium is the default preset when no goalRate is given', () => {
    const e = createMatchEngine({});
    assert.equal(e.config.goalRate, 'medium');
    assert.equal(e.config.goalDivisor, GOAL_RATE_PRESETS.medium.goalDivisor);
    assert.equal(e.config.goalChanceFloor, GOAL_RATE_PRESETS.medium.goalChanceFloor);
  });

  test('preset values are copied into the match config', () => {
    const e = createMatchEngine({ goalRate: 'medium' });
    assert.equal(e.config.goalDivisor, GOAL_RATE_PRESETS.medium.goalDivisor);
    assert.equal(e.config.goalChanceFloor, GOAL_RATE_PRESETS.medium.goalChanceFloor);
  });

  test('presets are ordered: higher goal rate means lower divisor and higher floor', () => {
    const { low, medium, high } = GOAL_RATE_PRESETS;
    assert.ok(low.goalDivisor > medium.goalDivisor && medium.goalDivisor > high.goalDivisor);
    assert.ok(low.goalChanceFloor < medium.goalChanceFloor && medium.goalChanceFloor < high.goalChanceFloor);
  });
});

describe('goal-rate presets: locked bands and goal totals (N=10,000 each)', () => {
  for (const preset of ['low', 'medium', 'high']) {
    test(`${preset}: 70/30 favourite and underdog stay inside the locked bands`, () => {
      const t = measure(preset, 70, 30);
      assert.ok(t.fav >= 0.63 && t.fav <= 0.68, `${preset} favourite ${t.fav}`);
      assert.ok(t.und >= 0.13 && t.und <= 0.17, `${preset} underdog ${t.und}`);
    });

    test(`${preset}: balanced average goals match the documented value`, () => {
      const expected = GOAL_RATE_PRESETS[preset].balancedGoals;
      const t = measure(preset, 50, 50);
      assert.ok(Math.abs(t.goals - expected) < 0.1, `${preset} goals ${t.goals} vs documented ${expected}`);
    });
  }

  test('goal totals increase monotonically across presets', () => {
    const g = ['low', 'medium', 'high'].map((p) => measure(p, 50, 50, 5000).goals);
    assert.ok(g[0] < g[1] && g[1] < g[2], `goals ${g}`);
  });
});
