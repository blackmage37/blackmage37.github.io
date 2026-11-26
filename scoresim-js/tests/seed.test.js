'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { mulberry32, newSeed, parseSeed } = require('../js/rng.js');
const { createMatchEngine, drawSetupChoices } = require('../js/engine.js');

describe('seeded generator', () => {
  test('same seed gives the same stream', () => {
    const a = mulberry32(12345), b = mulberry32(12345);
    for (let i = 0; i < 1000; i++) assert.equal(a(), b());
  });

  test('different seeds give different streams', () => {
    const a = mulberry32(1), b = mulberry32(2);
    let same = 0;
    for (let i = 0; i < 100; i++) if (a() === b()) same++;
    assert.ok(same < 3);
  });

  test('values stay in [0, 1)', () => {
    const r = mulberry32(99);
    for (let i = 0; i < 10000; i++) {
      const v = r();
      assert.ok(v >= 0 && v < 1);
    }
  });

  test('newSeed returns a 32-bit unsigned integer', () => {
    for (let i = 0; i < 20; i++) {
      const s = newSeed();
      assert.ok(Number.isInteger(s) && s >= 0 && s <= 0xffffffff);
    }
  });
});

describe('seed parsing', () => {
  test('accepts whole numbers in range', () => {
    assert.equal(parseSeed('0'), 0);
    assert.equal(parseSeed(' 42 '), 42);
    assert.equal(parseSeed('4294967295'), 4294967295);
  });

  test('rejects out-of-range, negative, fractional and non-numeric input', () => {
    assert.equal(parseSeed('4294967296'), null);
    assert.equal(parseSeed('-1'), null);
    assert.equal(parseSeed('1.5'), null);
    assert.equal(parseSeed('abc'), null);
    assert.equal(parseSeed(''), null);
  });
});

describe('seed reproduces the whole match', () => {
  const cfg = { homeStrength: 70, awayStrength: 30, homeCrowdSupport: 5, homeMorale: 3, awayMorale: 1, homeTactics: 1.4, awayTactics: 0.6 };

  test('same seed and settings give an identical match', () => {
    const a = createMatchEngine(cfg, mulberry32(777)).simulateToEnd();
    const b = createMatchEngine(cfg, mulberry32(777)).simulateToEnd();
    assert.equal(JSON.stringify(a), JSON.stringify(b));
  });

  test('different seed gives a different match', () => {
    const a = createMatchEngine(cfg, mulberry32(777)).simulateToEnd();
    const c = createMatchEngine(cfg, mulberry32(778)).simulateToEnd();
    assert.notEqual(JSON.stringify(a), JSON.stringify(c));
  });

  test('pre-match setup choices reproduce from the same seed', () => {
    const venues = ['A', 'B', 'C'];
    const a = drawSetupChoices(mulberry32(9), venues);
    const b = drawSetupChoices(mulberry32(9), venues);
    assert.deepEqual(a, b);
    assert.ok(a.venueIndex >= 0 && a.venueIndex < venues.length);
  });
});
