'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { createMatchEngine } = require('../js/engine.js');
const { mulberry32 } = require('./helpers.js');

const volume = (h, a) =>
  createMatchEngine({ homeTactics: h, awayTactics: a }, mulberry32(1)).state.allPotentialShots;

describe('tactics shot-volume formula', () => {
  test('balanced tactics give the 24-shot baseline', () => {
    assert.equal(volume(1, 1), 24);
  });

  test('is continuous: a 0.01 change moves volume by a tiny amount', () => {
    const points = [0.6, 0.8, 1, 1.2, 1.4];
    for (const p of points) {
      const jump = Math.abs(volume(p + 0.01, p) - volume(p, p));
      assert.ok(jump < 0.5, `jump of ${jump} near ${p}`);
      const jump2 = Math.abs(volume(p, p + 0.01) - volume(p, p));
      assert.ok(jump2 < 0.5, `jump of ${jump2} near ${p}`);
    }
  });

  test('is symmetric: swapping home and away tactics leaves volume unchanged', () => {
    for (const [h, a] of [[1.4, 0.6], [1.2, 0.8], [0.6, 1.4], [1.01, 1]]) {
      assert.equal(volume(h, a), volume(a, h), `${h} vs ${a}`);
    }
  });

  test('volume increases with the average tactics value', () => {
    assert.ok(volume(0.6, 0.6) < volume(1, 1));
    assert.ok(volume(1, 1) < volume(1.4, 1.4));
  });

  test('stronger mutual attacking produces more shots in simulation', () => {
    let low = 0, high = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const a = createMatchEngine({ homeTactics: 0.6, awayTactics: 0.6 }, mulberry32(seed)).simulateToEnd();
      const b = createMatchEngine({ homeTactics: 1.4, awayTactics: 1.4 }, mulberry32(seed)).simulateToEnd();
      low += a.homeShots + a.awayShots;
      high += b.homeShots + b.awayShots;
    }
    assert.ok(high > low * 1.3, `high ${high} vs low ${low}`);
  });
});
