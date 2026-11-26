'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  createMatchEngine,
  normaliseStrength,
  clampMorale,
  MORALE_LIMITS,
  STRENGTH_SHARE_LIMITS,
} = require('../js/engine.js');
const { mulberry32, runMatch } = require('./helpers.js');

describe('strength normalisation', () => {
  test('shares always sum to 100', () => {
    for (const [h, a] of [[50, 50], [10.93, 7.31], [3, 9], [1000, 1]]) {
      const s = normaliseStrength(h, a);
      assert.ok(Math.abs(s.home + s.away - 100) < 1e-9, `${h}/${a}`);
    }
  });

  test('scale does not matter, only the ratio', () => {
    const small = normaliseStrength(10.93, 7.31);
    const large = normaliseStrength(109.3, 73.1);
    assert.ok(Math.abs(small.home - large.home) < 1e-9);
  });

  test('10.93 vs 7.31 gives roughly a 60/40 share', () => {
    const s = normaliseStrength(10.93, 7.31);
    assert.ok(s.home > 59 && s.home < 60, `home share ${s.home}`);
  });

  test('equal strengths give 50/50', () => {
    assert.deepEqual(normaliseStrength(7, 7), { home: 50, away: 50 });
  });

  test('extreme ratios are clamped to the declared share limits', () => {
    const s = normaliseStrength(1000, 1);
    assert.equal(s.home, STRENGTH_SHARE_LIMITS.MAX);
    assert.equal(s.away, 100 - STRENGTH_SHARE_LIMITS.MAX);
  });

  test('rejects zero, negative and non-numeric strengths', () => {
    assert.throws(() => normaliseStrength(0, 5), RangeError);
    assert.throws(() => normaliseStrength(-1, 5), RangeError);
    assert.throws(() => normaliseStrength('abc', 5), RangeError);
    assert.throws(() => normaliseStrength(NaN, 5), RangeError);
  });

  test('engine uses normalised shares: 10.93/7.31 matches 60/40 raw buckets', () => {
    const custom = createMatchEngine({ homeStrength: 10.93, awayStrength: 7.31 }, mulberry32(1));
    assert.ok(Math.abs(custom.config.homeStrength - normaliseStrength(10.93, 7.31).home) < 1e-9);
  });

  test('custom small-scale teams produce the same results as their percentage equivalents', () => {
    const shares = normaliseStrength(10.93, 7.31);
    for (let seed = 1; seed <= 50; seed++) {
      const a = runMatch({ homeStrength: 10.93, awayStrength: 7.31 }, seed);
      const b = runMatch({ homeStrength: shares.home, awayStrength: shares.away }, seed);
      assert.equal(a.homeGoals, b.homeGoals, `seed ${seed}`);
      assert.equal(a.awayGoals, b.awayGoals, `seed ${seed}`);
    }
  });
});

describe('morale bounds and decay', () => {
  test('clampMorale keeps values inside the declared range', () => {
    assert.equal(clampMorale(-5), MORALE_LIMITS.MIN);
    assert.equal(clampMorale(99), MORALE_LIMITS.MAX);
    assert.equal(clampMorale(4), 4);
  });

  test('morale never leaves the range during a match (200 seeds)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const e = createMatchEngine(
        { homeStrength: 70, awayStrength: 30, homeCrowdSupport: 8, homeMorale: 4, awayMorale: 0, homeTactics: 1.4, awayTactics: 0.6 },
        mulberry32(seed)
      );
      e.kickOff();
      while (!e.state.isFinished) {
        e.tick();
        for (const m of [e.state.homeMorale, e.state.awayMorale]) {
          assert.ok(m >= MORALE_LIMITS.MIN && m <= MORALE_LIMITS.MAX, `seed ${seed}: morale ${m}`);
        }
      }
    }
  });

  test('morale drifts back toward its setup value when no events happen', () => {
    const e = createMatchEngine({ homeMorale: 2, awayMorale: 2 }, mulberry32(4));
    e.kickOff();
    e.state.homeMorale = 9;
    e.state.homePotentialShots = 0;
    e.state.awayPotentialShots = 0;
    e.state.homePotentialFouls = 0;
    e.state.awayPotentialFouls = 0;
    const before = e.state.homeMorale;
    e.tick();
    assert.ok(e.state.homeMorale < before, 'morale did not decay');
    assert.ok(e.state.homeMorale > 2, 'decay overshot the setup value');
  });
});
