'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { clubStrengths, nationStrengths, STRENGTH_BUCKETS, STRENGTH_LABELS } = require('../js/strength.js');

const pair = (r) => [r.home, r.away];

describe('strength buckets', () => {
  test('seven buckets, each summing to 100 and symmetric in order', () => {
    assert.equal(STRENGTH_BUCKETS.length, 7);
    assert.equal(STRENGTH_LABELS.length, 7);
    for (const b of STRENGTH_BUCKETS) assert.equal(b.home + b.away, 100);
    const homes = STRENGTH_BUCKETS.map((b) => b.home);
    assert.deepEqual(homes, [...homes].sort((x, y) => x - y));
  });
});

describe('clubStrengths', () => {
  const club = (points, division, group = null) => ({ points, division, divisionGroup: group });

  test('home one division lower gives bucket 1 (40/60)', () => {
    assert.deepEqual(pair(clubStrengths(club(50, 2), club(50, 1))), [40, 60]);
  });

  test('home two or more divisions lower gives bucket 0 (30/70)', () => {
    assert.deepEqual(pair(clubStrengths(club(50, 3), club(50, 1))), [30, 70]);
  });

  test('home one division higher gives bucket 5 (60/40)', () => {
    assert.deepEqual(pair(clubStrengths(club(50, 1), club(50, 2))), [60, 40]);
  });

  test('home two or more divisions higher gives bucket 6 (70/30)', () => {
    assert.deepEqual(pair(clubStrengths(club(50, 1), club(50, 3))), [70, 30]);
  });

  test('zero away points favours the home side (70/30)', () => {
    assert.deepEqual(pair(clubStrengths(club(50, 1), club(0, 1))), [70, 30]);
  });

  test('same division, ratio within the equal band gives 50/50', () => {
    assert.deepEqual(pair(clubStrengths(club(50, 1), club(50, 1))), [50, 50]);
  });

  test('same division, different groups are treated as equal', () => {
    assert.deepEqual(pair(clubStrengths(club(30, 1, 'A'), club(60, 1, 'B'))), [50, 50]);
  });

  test('ratio thresholds map to the expected buckets', () => {
    // ratio = home / away with same division and group
    const cases = [
      [1.3, [70, 30]],   // >= 1.25
      [1.2, [60, 40]],   // 1.125 - 1.25
      [1.1, [55, 45]],   // 1.0625 - 1.125
      [0.95, [50, 50]],  // within 0.9412 - 1.0625
      [0.9, [45, 55]],   // 0.8889 - 0.9412
      [0.85, [40, 60]],  // 0.8 - 0.8889
      [0.7, [30, 70]],   // <= 0.8
    ];
    for (const [ratio, expected] of cases) {
      const away = 100;
      const home = Math.round(ratio * away * 1000) / 1000;
      assert.deepEqual(pair(clubStrengths(club(home, 1), club(away, 1))), expected, `ratio ${ratio}`);
    }
  });
});

describe('nationStrengths', () => {
  test('rank gaps map to the documented buckets', () => {
    assert.deepEqual(pair(nationStrengths(10, 10)), [50, 50]);
    assert.deepEqual(pair(nationStrengths(1, 20)), [60, 40]); // diff -19: away is 10–30 places lower
    assert.deepEqual(pair(nationStrengths(20, 1)), [40, 60]); // diff +19: home is 10–30 places lower
    assert.deepEqual(pair(nationStrengths(2, 43)), [70, 30]);
    assert.deepEqual(pair(nationStrengths(43, 2)), [30, 70]);
  });

  test('boundary values: diff of exactly 5, 10 and 30', () => {
    assert.deepEqual(pair(nationStrengths(15, 10)), [50, 50]); // diff 5
    assert.deepEqual(pair(nationStrengths(16, 10)), [45, 55]); // diff 6
    assert.deepEqual(pair(nationStrengths(20, 10)), [45, 55]); // diff 10 is still bucket 2
    assert.deepEqual(pair(nationStrengths(21, 10)), [40, 60]); // diff 11
    assert.deepEqual(pair(nationStrengths(40, 10)), [40, 60]); // diff 30 is still bucket 1
    assert.deepEqual(pair(nationStrengths(41, 10)), [30, 70]); // diff 31
  });

  test('accepts string ranks as stored in the JSON', () => {
    assert.deepEqual(pair(nationStrengths('7', '11')), [50, 50]);
  });
});
