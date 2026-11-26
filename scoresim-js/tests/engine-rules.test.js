'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { createMatchEngine, MATCH_STATUS } = require('../js/engine.js');
const { mulberry32, runMatch } = require('./helpers.js');

describe('match rules: second legs, extra time and penalties', () => {
  test('non-second-leg matches have no aggregate or penalty result', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const s = runMatch({}, seed);
      assert.equal(s.aggregateStatus, null);
      assert.equal(s.penalties, null);
    }
  });

  test('second legs: penalties exist if and only if the aggregate is level', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const cfg = { isSecondLeg: true, homeFirstLegGoals: 1, awayFirstLegGoals: 1 };
      const s = runMatch(cfg, seed);
      const aggHome = cfg.homeFirstLegGoals + s.homeGoals;
      const aggAway = cfg.awayFirstLegGoals + s.awayGoals;
      if (aggHome === aggAway) {
        assert.ok(s.penalties, `seed ${seed}: level aggregate without shootout`);
      } else {
        assert.equal(s.penalties, null, `seed ${seed}: shootout despite winner`);
      }
    }
  });

  test('penalty shootouts never end level and set a winner', () => {
    let shootouts = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const s = runMatch({ isSecondLeg: true, homeFirstLegGoals: 0, awayFirstLegGoals: 0 }, seed);
      if (s.penalties) {
        shootouts++;
        assert.notEqual(s.penalties.home, s.penalties.away);
        assert.match(s.aggregateStatus, /win on penalties/);
      }
    }
    assert.ok(shootouts > 0, 'no shootouts exercised; increase seed range');
  });

  test('aggregate winner text names the side with more total goals', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const cfg = { isSecondLeg: true, homeFirstLegGoals: 2, awayFirstLegGoals: 0 };
      const s = runMatch(cfg, seed);
      const aggHome = cfg.homeFirstLegGoals + s.homeGoals;
      const aggAway = cfg.awayFirstLegGoals + s.awayGoals;
      if (aggHome > aggAway) assert.match(s.aggregateStatus, /^HOME win/);
      if (aggHome < aggAway) assert.match(s.aggregateStatus, /^AWAY win/);
    }
  });

  test('injury time is between 0 and 5 minutes for both halves', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const e = createMatchEngine({}, mulberry32(seed));
      e.simulateToEnd();
      assert.ok(e.state.timeAddedH1 >= 0 && e.state.timeAddedH1 <= 5);
      assert.ok(e.state.timeAddedH2 >= 0 && e.state.timeAddedH2 <= 5);
    }
  });
});

describe('regression checks for fixed bugs', () => {
  test('away side can shoot in the same minute as the home side', () => {
    // Original bug: away could only shoot in minutes the home side did not.
    const e = createMatchEngine({}, mulberry32(5));
    e.kickOff();
    e.state.homePotentialShots = 90; // rng < 1 always: shoots every minute
    e.state.awayPotentialShots = 90;
    for (let i = 0; i < 10; i++) e.tick();
    assert.equal(e.state.homeShots, 10);
    assert.equal(e.state.awayShots, 10);
  });

  test('away second yellow is counted against the away side', () => {
    // Original bug: away yellows were pushed into the home counter.
    const e = createMatchEngine({}, mulberry32(11));
    e.kickOff();
    e.state.homePotentialFouls = 0;
    e.state.awayPotentialFouls = 90; // away foul every minute
    for (let i = 0; i < 90; i++) e.tick();
    assert.equal(e.state.homeYellowCards, 0);
    assert.ok(e.state.awayYellowCards > 0);
  });

  test('an empty lineup does not crash the engine', () => {
    const e = createMatchEngine({}, mulberry32(2));
    e.kickOff();
    e.state.homeLineup.length = 0;
    e.state.awayLineup.length = 0;
    assert.doesNotThrow(() => {
      for (let i = 0; i < 60; i++) e.tick();
    });
    assert.equal(e.state.homeGoals + e.state.awayGoals, e.state.homeGoalEvents.length + e.state.awayGoalEvents.length);
  });
});
