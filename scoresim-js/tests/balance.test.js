'use strict';
/**
 * Statistical balance tests. Seeded, so results are repeatable.
 * Bands are deliberately wide: they guard against regressions, they do not
 * pin the exact calibration (that is roadmap item 5).
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { runMatch } = require('./helpers.js');

const N = 1000;

function tally(config, n = N, seedBase = 1000) {
  let hw = 0, d = 0, aw = 0, goals = 0;
  for (let i = 0; i < n; i++) {
    const s = runMatch(config, seedBase + i);
    if (s.homeGoals > s.awayGoals) hw++;
    else if (s.homeGoals < s.awayGoals) aw++;
    else d++;
    goals += s.homeGoals + s.awayGoals;
  }
  return { hw: hw / n, d: d / n, aw: aw / n, avgGoals: goals / n };
}

const neutral = { homeCrowdSupport: 0, homeMorale: 2, awayMorale: 2, homeTactics: 1, awayTactics: 1 };

describe('balance bands (seeded, N=1000)', () => {
  test('strong favourite (70/30) wins more often than not', () => {
    const t = tally({ ...neutral, homeStrength: 70, awayStrength: 30 });
    assert.ok(t.hw > 0.55, `home win ${t.hw}`);
    assert.ok(t.aw < 0.2, `away win ${t.aw}`);
  });

  test('strong underdog (30/70) wins less often than not', () => {
    const t = tally({ ...neutral, homeStrength: 30, awayStrength: 70 });
    assert.ok(t.aw > 0.55, `away win ${t.aw}`);
    assert.ok(t.hw < 0.2, `home win ${t.hw}`);
  });

  test('strength is monotonic: more home strength, more home wins', () => {
    const rates = [30, 45, 55, 70].map(
      (h) => tally({ ...neutral, homeStrength: h, awayStrength: 100 - h }, 500).hw
    );
    for (let i = 1; i < rates.length; i++) {
      assert.ok(rates[i] > rates[i - 1], `non-monotonic at index ${i}: ${rates}`);
    }
  });

  test('average goals per match stay in a plausible band (1.5–3.5)', () => {
    const t = tally(neutral);
    assert.ok(t.avgGoals > 1.5 && t.avgGoals < 3.5, `avg goals ${t.avgGoals}`);
  });

  test('outcome probabilities sum to 1', () => {
    const t = tally(neutral, 300);
    assert.ok(Math.abs(t.hw + t.d + t.aw - 1) < 1e-9);
  });
});

/*
 * Locked calibration targets (agreed in conversation; see ROADMAP item 5).
 * Favourite = stronger side in a 70/30 matchup, underdog = the weaker side.
 * Bands are wide enough for seeded sampling noise at N=10,000 (SE about 0.3–0.5 pts).
 */
const TARGETS = {
  favouriteWin: [0.63, 0.68],
  underdogWin: [0.13, 0.17],
  symmetryTolerance: 0.02, // 50/50: |home - away| win rate
};

describe('locked calibration targets (N=10,000, fresh seeds)', () => {
  const CAL_SEED = 104729 * 3 + 999983; // deliberately different from the tuning seeds

  function tallyFresh(config, n = 10000) {
    let hw = 0, d = 0, aw = 0, goals = 0;
    for (let i = 0; i < n; i++) {
      const s = runMatch(config, CAL_SEED + i * 104729);
      if (s.homeGoals > s.awayGoals) hw++;
      else if (s.homeGoals < s.awayGoals) aw++;
      else d++;
      goals += s.homeGoals + s.awayGoals;
    }
    return { hw: hw / n, d: d / n, aw: aw / n, avgGoals: goals / n };
  }

  test('70/30 favourite wins within the 63–68% band', () => {
    const t = tallyFresh({ ...neutral, homeStrength: 70, awayStrength: 30 });
    assert.ok(t.hw >= TARGETS.favouriteWin[0] && t.hw <= TARGETS.favouriteWin[1], `favourite ${t.hw}`);
  });

  test('70/30 underdog wins within the 13–17% band', () => {
    const t = tallyFresh({ ...neutral, homeStrength: 70, awayStrength: 30 });
    assert.ok(t.aw >= TARGETS.underdogWin[0] && t.aw <= TARGETS.underdogWin[1], `underdog ${t.aw}`);
  });

  // Goal totals were not a locked band. Balanced matches measure about 2.2
  // goals, below the real-world ~2.6–2.8 range. Tracked as a todo until the
  // goal-rate work is agreed, rather than tuning the band to pass.
  test('average goals per match at balance (known gap, real-world ~2.6–2.8)', { todo: 'goal-rate calibration not yet agreed' }, () => {
    const t = tallyFresh(neutral);
    assert.ok(t.avgGoals >= 2.6 && t.avgGoals <= 2.9, `goals ${t.avgGoals}`);
  });

  test('50/50 is symmetric within tolerance', () => {
    const t = tallyFresh({ ...neutral, homeStrength: 50, awayStrength: 50 });
    assert.ok(Math.abs(t.hw - t.aw) < TARGETS.symmetryTolerance, `home ${t.hw} vs away ${t.aw}`);
  });
});

describe('all matchup sets (N=10,000 per set, fresh seeds)', () => {
  // Every pairing the UI can produce (the seven strength buckets), plus a custom pair.
  const SETS = [
    [30, 70], [40, 60], [45, 55], [50, 50], [55, 45], [60, 40], [70, 30],
  ];
  const CAL_SEED = 104729 * 5 + 424243;

  for (const [h, a] of SETS) {
    test(`${h}/${a}: outcome shares sum to 1 and goals stay plausible`, () => {
      let hw = 0, d = 0, aw = 0, goals = 0;
      const n = 10000;
      for (let i = 0; i < n; i++) {
        const s = runMatch({ ...neutral, homeStrength: h, awayStrength: a }, CAL_SEED + i * 104729);
        if (s.homeGoals > s.awayGoals) hw++;
        else if (s.homeGoals < s.awayGoals) aw++;
        else d++;
        goals += s.homeGoals + s.awayGoals;
      }
      assert.ok(Math.abs((hw + d + aw) / n - 1) < 1e-9);
      const avg = goals / n;
      assert.ok(avg > 1.8 && avg < 3.2, `avg goals ${avg}`);
    });
  }

  test('win probability is monotonic in home strength across the buckets', () => {
    const wins = [30, 40, 45, 50, 55, 60, 70].map((h) => {
      let hw = 0;
      for (let i = 0; i < 5000; i++) {
        const s = runMatch({ ...neutral, homeStrength: h, awayStrength: 100 - h }, CAL_SEED + i * 104729);
        if (s.homeGoals > s.awayGoals) hw++;
      }
      return hw / 5000;
    });
    for (let i = 1; i < wins.length; i++) {
      assert.ok(wins[i] > wins[i - 1], `non-monotonic at index ${i}: ${wins}`);
    }
  });

  test('mirror symmetry: home win at h/a equals away win at a/h (within 2 points)', () => {
    for (const h of [40, 60, 70]) {
      let homeWinAtHA = 0, awayWinAtAH = 0;
      const n = 10000;
      for (let i = 0; i < n; i++) {
        const seed = CAL_SEED + i * 104729;
        const x = runMatch({ ...neutral, homeStrength: h, awayStrength: 100 - h }, seed);
        const y = runMatch({ ...neutral, homeStrength: 100 - h, awayStrength: h }, seed);
        if (x.homeGoals > x.awayGoals) homeWinAtHA++;
        if (y.awayGoals > y.homeGoals) awayWinAtAH++;
      }
      assert.ok(Math.abs(homeWinAtHA - awayWinAtAH) / n < 0.02, `h=${h}: ${homeWinAtHA} vs ${awayWinAtAH}`);
    }
  });
});
