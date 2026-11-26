'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { createMatchEngine, MATCH_STATUS } = require('../js/engine.js');
const { mulberry32, runMatch } = require('./helpers.js');

describe('engine lifecycle', () => {
  test('does not advance before kick-off', () => {
    const e = createMatchEngine({}, mulberry32(1));
    e.tick();
    e.tick();
    assert.equal(e.state.status, MATCH_STATUS.NOT_STARTED);
    assert.equal(e.state.minute, 0);
  });

  test('kickOff moves to 1st half and is idempotent', () => {
    const e = createMatchEngine({}, mulberry32(1));
    e.kickOff();
    e.tick();
    const minuteAfterOneTick = e.state.minute;
    e.kickOff();
    assert.equal(e.state.status, MATCH_STATUS.FIRST_HALF);
    assert.equal(e.state.minute, minuteAfterOneTick);
  });

  test('half time lasts exactly 5 ticks and resumes at minute 45', () => {
    const e = createMatchEngine({}, mulberry32(7));
    e.kickOff();
    let guard = 200;
    while (e.state.status !== MATCH_STATUS.HALF_TIME && guard-- > 0) e.tick();
    assert.equal(e.state.status, MATCH_STATUS.HALF_TIME);
    for (let i = 0; i < 4; i++) {
      e.tick();
      assert.equal(e.state.status, MATCH_STATUS.HALF_TIME);
    }
    e.tick();
    assert.equal(e.state.status, MATCH_STATUS.SECOND_HALF);
    assert.equal(e.state.minute, 45);
  });

  test('a finished match stops changing when ticked again', () => {
    const e = createMatchEngine({}, mulberry32(3));
    e.simulateToEnd();
    const before = JSON.stringify(e.state);
    e.tick();
    e.tick();
    assert.equal(JSON.stringify(e.state), before);
  });

  test('every match finishes within the expected clock bounds (200 seeds)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const s = runMatch({}, seed);
      assert.equal(s.isFinished, true, `seed ${seed} did not finish`);
      assert.equal(s.status, MATCH_STATUS.FULL_TIME);
      // non-2nd-leg: ends at most at 90 + 5 injury + 1
      assert.ok(s.minute <= 96, `seed ${seed} ended at ${s.minute}`);
    }
  });

  test('second-leg matches never exceed extra time (200 seeds)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const s = runMatch(
        { isSecondLeg: true, homeFirstLegGoals: 1, awayFirstLegGoals: 1 },
        seed
      );
      assert.equal(s.isFinished, true, `seed ${seed} did not finish`);
      assert.ok(s.minute <= 121, `seed ${seed} ran to ${s.minute}`);
    }
  });

  test('same seed gives an identical match', () => {
    const a = runMatch({ homeCrowdSupport: 4 }, 12345);
    const b = runMatch({ homeCrowdSupport: 4 }, 12345);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
  });

  test('different seeds produce varied results', () => {
    const scorelines = new Set();
    for (let seed = 1; seed <= 30; seed++) {
      const s = runMatch({}, seed);
      scorelines.add(`${s.homeGoals}-${s.awayGoals}`);
    }
    assert.ok(scorelines.size > 5, `only ${scorelines.size} distinct scorelines`);
  });
});
