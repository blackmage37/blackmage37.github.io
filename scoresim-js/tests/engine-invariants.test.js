'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { createMatchEngine, MATCH_STATUS } = require('../js/engine.js');
const { mulberry32, runMatch } = require('./helpers.js');

describe('engine invariants (per minute)', () => {
  test('possession always sums to 100 and stays within 15–85', () => {
    const e = createMatchEngine({ homeStrength: 70, awayStrength: 30 }, mulberry32(9));
    e.kickOff();
    for (let i = 0; i < 100 && !e.state.isFinished; i++) {
      e.tick();
      const s = e.state;
      assert.equal(s.homePossession + s.awayPossession, 100);
      assert.ok(s.homePossession >= 15 && s.homePossession <= 85);
    }
  });

  test('shots on goal never exceed shots, goals never exceed shots on goal', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const s = runMatch({ homeCrowdSupport: 6, homeTactics: 1.4, awayTactics: 0.6 }, seed);
      assert.ok(s.homeShotsOnGoal <= s.homeShots);
      assert.ok(s.awayShotsOnGoal <= s.awayShots);
      assert.ok(s.homeGoals <= s.homeShotsOnGoal);
      assert.ok(s.awayGoals <= s.awayShotsOnGoal);
    }
  });

  test('goal counters match goal events', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const s = runMatch({}, seed);
      assert.equal(s.homeGoals, s.homeGoalEvents.length);
      assert.equal(s.awayGoals, s.awayGoalEvents.length);
    }
  });

  test('card counters match card events and nobody has more than two yellows', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const e = createMatchEngine({ homeStrength: 60, awayStrength: 40 }, mulberry32(seed));
      e.simulateToEnd();
      const s = e.state;
      assert.equal(s.homeRedCards, s.homeRedEvents.length);
      assert.equal(s.awayRedCards, s.awayRedEvents.length);
      for (const p of [...s.homeLineup, ...s.awayLineup]) {
        assert.ok(p.yellowCards <= 2, `${p.name} had ${p.yellowCards} yellows`);
      }
    }
  });

  test('sent-off players leave the lineup and lineups shrink accordingly', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const e = createMatchEngine({ homeStrength: 50, awayStrength: 50 }, mulberry32(seed));
      e.simulateToEnd();
      const s = e.state;
      assert.equal(s.homeLineup.length, 11 - s.homeRedCards);
      assert.equal(s.awayLineup.length, 11 - s.awayRedCards);
      const onPitch = new Set(s.homeLineup.map((p) => p.name));
      for (const ev of s.homeRedEvents) assert.ok(!onPitch.has(ev.name));
    }
  });

  test('goalkeepers never score from open play', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const s = runMatch({ homeCrowdSupport: 8 }, seed);
      for (const ev of [...s.homeGoalEvents, ...s.awayGoalEvents]) {
        assert.notEqual(ev.name, 'Goalkeeper');
      }
    }
  });

  test('event minutes are within the match clock', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const s = runMatch({}, seed);
      for (const ev of [...s.homeGoalEvents, ...s.awayGoalEvents, ...s.homeRedEvents, ...s.awayRedEvents]) {
        assert.ok(ev.minute >= 1 && ev.minute <= s.minute, `event at ${ev.minute}`);
      }
    }
  });
});
