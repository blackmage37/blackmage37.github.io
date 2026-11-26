/**
 * ScoreSim Engine — pure, UI-free football match simulation.
 *
 * Ported from the Angular/TypeScript ScoreboardComponent and cleaned up:
 *  - No DOM, no timers, no RxJS: create an engine, call tick() repeatedly.
 *  - Injectable RNG (pass a seeded function for reproducible matches/tests).
 *  - Bugs fixed vs. the original (see docs.html "Bug fixes" section).
 */
'use strict';

const MATCH_STATUS = {
  NOT_STARTED: 'Not started',
  FIRST_HALF: '1st half',
  HALF_TIME: 'Half time',
  SECOND_HALF: '2nd half',
  EXTRA_TIME: 'Extra time',
  PENALTIES: 'Penalty shootout',
  FULL_TIME: 'Full time',
};

function makePlayer(name, position) {
  return {
    name,
    position, // 'GK' | 'DF' | 'MF' | 'FW'
    goalsToday: 0,
    yellowCards: 0,
    yellowCardTimes: [],
    redCard: false,
    redCardTime: null,
  };
}

function makeStartingLineup() {
  return [
    makePlayer('Goalkeeper', 'GK'),
    makePlayer('Defender1', 'DF'),
    makePlayer('Defender2', 'DF'),
    makePlayer('Defender3', 'DF'),
    makePlayer('Defender4', 'DF'),
    makePlayer('Midfielder1', 'MF'),
    makePlayer('Midfielder2', 'MF'),
    makePlayer('Midfielder3', 'MF'),
    makePlayer('Midfielder4', 'MF'),
    makePlayer('Forward1', 'FW'),
    makePlayer('Forward2', 'FW'),
  ];
}

/**
 * @param {object} config
 *   homeStrength / awayStrength : number (30..70, should sum to 100)
 *   homeCrowdSupport            : number (0..8)
 *   homeMorale / awayMorale     : number (0..4)
 *   homeTactics / awayTactics   : number (0.6 defensive .. 1.4 attacking)
 *   isSecondLeg                 : boolean
 *   homeFirstLegGoals / awayFirstLegGoals : number (if isSecondLeg)
 * @param {function} [rng] 0..1 random source (defaults to Math.random)
 */
function createMatchEngine(config, rng) {
  const rand = rng || Math.random;

  const cfg = Object.assign(
    {
      homeStrength: 50,
      awayStrength: 50,
      homeCrowdSupport: 0,
      homeMorale: 2,
      awayMorale: 2,
      homeTactics: 1,
      awayTactics: 1,
      isSecondLeg: false,
      homeFirstLegGoals: 0,
      awayFirstLegGoals: 0,
    },
    config
  );

  /* ---- pre-match derived numbers (same formulas as the original) ---- */
  const allPotentialFouls = Math.round(20 + rand() * 7);
  const h = cfg.homeTactics;
  const a = cfg.awayTactics;
  let allPotentialShots;
  if (h > a) {
    allPotentialShots = (24 * (a + h)) / (3 * a);
  } else if (h < a) {
    allPotentialShots = (24 * (h + a)) / (4 * h);
  } else if (h >= 1) {
    allPotentialShots = (24 * (a + h)) / (2 * a); // both attacking: open game
  } else {
    allPotentialShots = (24 * (a + h)) / (4 * a); // both defensive: closed game
  }

  const state = {
    status: MATCH_STATUS.NOT_STARTED,
    minute: 0,
    timeAddedH1: 0,
    timeAddedH2: 0,
    halfTimeTicks: 0, // simulated "pause" minutes at the break

    // live (mutable) team attributes
    homeStrength: cfg.homeStrength,
    awayStrength: cfg.awayStrength,
    homeMorale: cfg.homeMorale,
    awayMorale: cfg.awayMorale,

    // derived potentials
    allPotentialShots,
    homePotentialShots: Math.round(
      allPotentialShots *
        ((cfg.homeStrength + cfg.homeMorale + cfg.homeCrowdSupport) / 100)
    ),
    awayPotentialShots: Math.round(
      allPotentialShots * ((cfg.awayStrength + cfg.awayMorale) / 100)
    ),
    homePotentialFouls: Math.round(allPotentialFouls * (cfg.awayStrength / 100)),
    awayPotentialFouls: Math.round(allPotentialFouls * (cfg.homeStrength / 100)),

    // per-match shot accuracy constants (as in the original: 0.1..0.5)
    shotOnGoalChanceHome: rand() * 0.4 + 0.1,
    shotOnGoalChanceAway: rand() * 0.4 + 0.1,

    // stats
    homeGoals: 0,
    awayGoals: 0,
    homePossession: 50,
    awayPossession: 50,
    homeShots: 0,
    awayShots: 0,
    homeShotsOnGoal: 0,
    awayShotsOnGoal: 0,
    homeFouls: 0,
    awayFouls: 0,
    homeYellowCards: 0,
    awayYellowCards: 0,
    homeRedCards: 0,
    awayRedCards: 0,

    // squads & events
    homeLineup: makeStartingLineup(),
    awayLineup: makeStartingLineup(),
    homeGoalEvents: [], // {name, minute}
    awayGoalEvents: [],
    homeRedEvents: [], // {name, minute}
    awayRedEvents: [],

    // result descriptors
    aggregateStatus: null,
    penalties: null, // {home, away} if a shootout happened
    isFinished: false,
  };

  function totalHomeGoals() {
    return cfg.homeFirstLegGoals + state.homeGoals;
  }
  function totalAwayGoals() {
    return cfg.awayFirstLegGoals + state.awayGoals;
  }

  /* ---------------- per-minute sub-steps ---------------- */

  function adjustPossession() {
    // random adjuster narrows the gap between unequal teams
    let adjuster = 0;
    if (state.homeStrength < state.awayStrength && state.homeStrength <= 40) adjuster = rand() * 5;
    if (state.homeStrength > state.awayStrength && state.awayStrength <= 40) adjuster = rand() * -5;
    if (state.homeStrength < state.awayStrength && state.homeStrength >= 45) adjuster = rand() * 3;
    if (state.homeStrength > state.awayStrength && state.awayStrength >= 45) adjuster = rand() * -2;

    const moraleShift = rand() * 0.02;
    const gapIsWide = Math.abs(state.homePossession - state.awayPossession) > 20;
    const step = gapIsWide ? Math.round(rand() * 0.75) : Math.round(rand() * 1.4);

    if (rand() < (state.homeStrength + adjuster) / 100) {
      state.homePossession += step;
      state.homeMorale += moraleShift;
      state.awayMorale -= moraleShift;
    } else {
      state.awayPossession += step;
      state.awayMorale += moraleShift;
      state.homeMorale -= moraleShift;
    }
    state.homePossession = Math.min(85, Math.max(15, state.homePossession));
    state.awayPossession = 100 - state.homePossession;
  }

  function randomPlayer(lineup) {
    // FIX: uniform, in-bounds pick (original rounding was biased / could
    // return undefined via index === length).
    return lineup[Math.floor(rand() * lineup.length)];
  }

  function randomOutfieldScorer(lineup) {
    // FIX: goalkeepers no longer score from open play.
    const outfield = lineup.filter((p) => p.position !== 'GK');
    const pool = outfield.length > 0 ? outfield : lineup;
    return pool[Math.floor(rand() * pool.length)];
  }

  function sendOff(side, player) {
    const lineup = side === 'home' ? state.homeLineup : state.awayLineup;
    player.redCard = true;
    player.redCardTime = state.minute;
    lineup.splice(lineup.indexOf(player), 1);
    if (side === 'home') {
      state.homeRedCards++;
      state.homeRedEvents.push({ name: player.name, minute: state.minute });
      state.homeStrength -= state.homeStrength * 0.09;
      state.homeMorale += (rand() > 0.5 ? -1 : 1) * state.homeMorale * 0.15;
    } else {
      state.awayRedCards++;
      state.awayRedEvents.push({ name: player.name, minute: state.minute });
      state.awayStrength -= state.awayStrength * 0.09;
      // FIX: now symmetric with the home side (was -25%/+5%)
      state.awayMorale += (rand() > 0.5 ? -1 : 1) * state.awayMorale * 0.15;
    }
  }

  function simulateFouls(side) {
    const potential = side === 'home' ? state.homePotentialFouls : state.awayPotentialFouls;
    const lineup = side === 'home' ? state.homeLineup : state.awayLineup;
    if (lineup.length === 0) return;
    if (rand() >= potential / 90) return;

    if (side === 'home') state.homeFouls++;
    else state.awayFouls++;

    if (rand() < 1 / 7) {
      const player = randomPlayer(lineup);
      player.yellowCards++;
      player.yellowCardTimes.push(state.minute);
      // FIX: counters now always track the correct side (original pushed the
      // HOME yellow count on away second yellows).
      if (side === 'home') state.homeYellowCards++;
      else state.awayYellowCards++;
      if (player.yellowCards >= 2) sendOff(side, player);
    } else if (rand() < 1 / 500) {
      sendOff(side, randomPlayer(lineup)); // straight red
    }
  }

  function simulateShot(side) {
    const isHome = side === 'home';
    const potential = isHome ? state.homePotentialShots : state.awayPotentialShots;
    const lineup = isHome ? state.homeLineup : state.awayLineup;
    if (lineup.length === 0) return;
    if (rand() >= potential / 90) return;

    if (isHome) state.homeShots++;
    else state.awayShots++;

    const onGoalChance = isHome ? state.shotOnGoalChanceHome : state.shotOnGoalChanceAway;
    if (rand() >= onGoalChance) return;

    if (isHome) {
      state.homeShotsOnGoal++;
      state.homeMorale += 0.2;
    } else {
      state.awayShotsOnGoal++;
      state.awayMorale += 0.2;
    }

    const power = isHome
      ? state.homeStrength + state.homeMorale + cfg.homeCrowdSupport
      : state.awayStrength + state.awayMorale;
    const goalChance = power / 100 / (1.5 + rand());
    if (rand() >= goalChance) return;

    // GOAL
    const scorer = randomOutfieldScorer(lineup);
    scorer.goalsToday++;
    if (isHome) {
      state.homeGoals++;
      state.homeMorale++;
      state.homeGoalEvents.push({ name: scorer.name, minute: state.minute });
    } else {
      state.awayGoals++;
      state.awayMorale++;
      state.awayGoalEvents.push({ name: scorer.name, minute: state.minute });
    }
  }

  function runPenaltyShootout() {
    let home = Math.round(rand() * 5);
    let away = Math.round(rand() * 5);
    while (home === away) {
      home += Math.round(rand()); // sudden death
      away += Math.round(rand());
    }
    state.penalties = { home, away };
    state.aggregateStatus = `${home}-${away}: ${home > away ? 'HOME' : 'AWAY'} win on penalties`;
    finishMatch();
  }

  function finishMatch() {
    state.status = MATCH_STATUS.FULL_TIME;
    state.isFinished = true;
  }

  function settleAggregate(afterExtraTime) {
    const th = totalHomeGoals();
    const ta = totalAwayGoals();
    if (th > ta) {
      state.aggregateStatus = `HOME win ${th}-${ta} on aggregate`;
      finishMatch();
    } else if (th < ta) {
      state.aggregateStatus = `AWAY win ${th}-${ta} on aggregate`;
      finishMatch();
    } else if (!afterExtraTime) {
      state.status = MATCH_STATUS.EXTRA_TIME;
      state.minute = 90;
    } else {
      state.status = MATCH_STATUS.PENALTIES;
      state.minute = 120;
      runPenaltyShootout();
    }
  }

  /* ---------------- public API ---------------- */

  /** Advance the simulation by one minute of match time. */
  function tick() {
    if (state.isFinished || state.status === MATCH_STATUS.NOT_STARTED) return state;

    if (state.status === MATCH_STATUS.HALF_TIME) {
      state.halfTimeTicks++;
      if (state.halfTimeTicks >= 5) {
        state.status = MATCH_STATUS.SECOND_HALF;
        state.minute = 45;
      }
      return state;
    }

    state.minute++;

    adjustPossession();
    simulateFouls('home');
    simulateFouls('away');
    // FIX: both sides roll shots independently each minute (original only let
    // the away side shoot in minutes the home side didn't).
    simulateShot('home');
    simulateShot('away');

    if (state.minute === 44) state.timeAddedH1 = Math.round(rand() * 5);
    if (state.minute === 89) state.timeAddedH2 = Math.round(rand() * 5);

    if (state.minute >= 45 + state.timeAddedH1 && state.status === MATCH_STATUS.FIRST_HALF) {
      state.status = MATCH_STATUS.HALF_TIME;
      state.halfTimeTicks = 0;
      return state;
    }
    if (state.minute > 90 + state.timeAddedH2 && state.status === MATCH_STATUS.SECOND_HALF) {
      if (cfg.isSecondLeg) settleAggregate(false);
      else finishMatch();
      return state;
    }
    if (state.minute > 120 && state.status === MATCH_STATUS.EXTRA_TIME) {
      settleAggregate(true);
    }
    return state;
  }

  /** Kick the match off (status: NOT_STARTED -> FIRST_HALF). */
  function kickOff() {
    if (state.status === MATCH_STATUS.NOT_STARTED) {
      state.status = MATCH_STATUS.FIRST_HALF;
    }
    return state;
  }

  /** Run the remaining match instantly and return the final state. */
  function simulateToEnd(maxTicks) {
    kickOff();
    let guard = maxTicks || 500;
    while (!state.isFinished && guard-- > 0) tick();
    return state;
  }

  return {
    state,
    config: cfg,
    kickOff,
    tick,
    simulateToEnd,
    totalHomeGoals,
    totalAwayGoals,
  };
}

/* Export for Node (unit tests) without breaking the browser. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createMatchEngine, MATCH_STATUS, makeStartingLineup };
}
