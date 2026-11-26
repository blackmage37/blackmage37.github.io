/**
 * ScoreSim Engine — pure, UI-free football match simulation.
 *
 * Ported from the Angular/TypeScript ScoreboardComponent and cleaned up:
 *  - No DOM, no timers, no RxJS: create an engine, call tick() repeatedly.
 *  - Injectable RNG (pass a seeded function for reproducible matches/tests).
 *  - Bugs fixed vs. the original (see docs.html "Bug fixes" section).
 */
'use strict';

/* Tunable limits (candidates for the options page, roadmap item 3). */
const MORALE_LIMITS = { MIN: 0, MAX: 10, DECAY: 0.02 }; // DECAY: fraction of gap to setup value per minute
const STRENGTH_SHARE_LIMITS = { MIN: 5, MAX: 95 }; // keeps extreme ratios from becoming degenerate
const BASE_SHOTS_PER_MATCH = 24; // total shot volume at balanced tactics (1 vs 1)

/* Goal-rate presets (user-facing option). Each was measured on fresh seeds
 * against the locked bands: favourite 63–68%, underdog 13–17% in a 70/30 match.
 * balancedGoals = average total goals in a 50/50 match at neutral settings.
 * See ROADMAP item 5 and docs.html for the measurements behind these values. */
const GOAL_RATE_PRESETS = {
  low: { goalDivisor: 1.4, goalChanceFloor: 0.2, balancedGoals: 2.18 },
  medium: { goalDivisor: 1.2, goalChanceFloor: 0.25, balancedGoals: 2.46 },
  high: { goalDivisor: 1.0, goalChanceFloor: 0.3, balancedGoals: 2.85 },
};

/* Experimental switches for the strength-conversion comparison (see ROADMAP).
 *   conversionUsesStrength: false = option A (goal chance ignores strength share)
 *   volumeMapping: 'linear' (current) | 'sqrt' = option B (softened shot share)
 * Defaults reproduce the current behaviour. */
const EXPERIMENT = {
  conversionUsesStrength: true,
  volumeMapping: 'sqrt', // option B, adopted as default
  conversionExponent: 1, // 1 = linear (current); 0.5 = sqrt (option D); see conversionStrength
  accuracyExponent: 0, // lever 1: 0 = accuracy ignores strength (current); >0 stronger sides convert better on target

};

/**
 * Convert any pair of positive strengths into shares that sum to 100.
 * 10.93 / 7.31 and 109.3 / 73.1 give the same result, so the scale of the
 * input no longer matters, only the ratio between the two teams.
 */
function normaliseStrength(home, away) {
  const h = Number(home);
  const a = Number(away);
  if (!Number.isFinite(h) || !Number.isFinite(a) || h <= 0 || a <= 0) {
    throw new RangeError(`strengths must be positive numbers (got ${home} / ${away})`);
  }
  const raw = (h / (h + a)) * 100;
  const share = Math.min(STRENGTH_SHARE_LIMITS.MAX, Math.max(STRENGTH_SHARE_LIMITS.MIN, raw));
  return { home: share, away: 100 - share };
}

/**
 * Share of total shot volume for a team with the given strength share (0-100).
 * linear: s / 100 (current). sqrt: normalised sqrt, which softens the gap.
 * The two shares still sum to 1 for any pair.
 */
function shotShare(strengthShare) {
  if (EXPERIMENT.volumeMapping === 'sqrt') {
    return Math.sqrt(strengthShare) / (Math.sqrt(strengthShare) + Math.sqrt(100 - strengthShare));
  }
  return strengthShare / 100;
}

/**
 * Strength term used in the goal-chance formula, on the same 0-100 scale.
 * linear: s (current). sqrt: 50 * sqrt(s / 50), which keeps 50 -> 50 (so
 * balanced matches are unchanged) but compresses the gap between teams.
 */
function conversionStrength(strengthShare) {
  // power-law compression around 50: p = 1 is linear, p = 0.5 is sqrt
  return 50 * Math.pow(strengthShare / 50, EXPERIMENT.conversionExponent);
}

/**
 * Per-match shot-on-target accuracy for one side (lever 1).
 * base is the random 0.1–0.5 draw; with accuracyExponent 0 it is unchanged.
 */
function accuracyFor(strengthShare, base) {
  const scaled = base * Math.pow(strengthShare / 50, EXPERIMENT.accuracyExponent);
  return Math.min(0.8, Math.max(0.05, scaled));
}

/**
 * Shared seeded setup. Returns the pre-match choices that the UI would
 * otherwise make with Math.random (crowd, morale and tactics "random" options,
 * and the venue), using the supplied generator so a seed fixes them too.
 */
function drawSetupChoices(rand, venues) {
  return {
    crowdRandom: Math.round(rand() * 8),
    moraleRandom: Math.round(rand() * 4),
    tacticsRandom: rand() * 0.8 + 0.6,
    venueIndex: venues && venues.length ? Math.floor(rand() * venues.length) : 0,
  };
}

function clampMorale(value) {
  return Math.min(MORALE_LIMITS.MAX, Math.max(MORALE_LIMITS.MIN, value));
}

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
  // Every random draw comes from this one source. Pass a seeded rng (see rng.js)
  // for reproducible matches; Math.random is only the fallback for ad-hoc use.
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
      goalRate: 'medium', // 'low' | 'medium' | 'high' (see GOAL_RATE_PRESETS); default chosen in conversation
    },
    config
  );

  // goal-rate preset: sets the per-match divisor and floor (see GOAL_RATE_PRESETS)
  if (!Object.prototype.hasOwnProperty.call(GOAL_RATE_PRESETS, cfg.goalRate)) {
    throw new RangeError(
      `unknown goalRate "${cfg.goalRate}" (expected one of: ${Object.keys(GOAL_RATE_PRESETS).join(', ')})`
    );
  }
  cfg.goalDivisor = GOAL_RATE_PRESETS[cfg.goalRate].goalDivisor;
  cfg.goalChanceFloor = GOAL_RATE_PRESETS[cfg.goalRate].goalChanceFloor;

  // ratio-based strengths and bounded morale (see ROADMAP items 4 and 5)
  const shares = normaliseStrength(cfg.homeStrength, cfg.awayStrength);
  cfg.homeStrength = shares.home;
  cfg.awayStrength = shares.away;
  cfg.homeMorale = clampMorale(cfg.homeMorale);
  cfg.awayMorale = clampMorale(cfg.awayMorale);

  /* ---- pre-match derived numbers (same formulas as the original) ---- */
  const allPotentialFouls = Math.round(20 + rand() * 7);
  const h = cfg.homeTactics;
  const a = cfg.awayTactics;
  // Continuous and symmetric: total match shot volume scales with the average
  // tactics value. 24 shots at balanced tactics (1 vs 1), 14.4 at 0.6 vs 0.6,
  // 33.6 at 1.4 vs 1.4. Swapping home and away leaves the result unchanged.
  const allPotentialShots = (BASE_SHOTS_PER_MATCH * (h + a)) / 2;

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
    // Unrounded potentials (step C): the per-minute roll is potential / 90, so
    // fractional values keep the expected volume exact. Shares sum to 100 by
    // construction because they are derived from the normalised strengths.
    homePotentialShots: allPotentialShots * shotShare(cfg.homeStrength),
    awayPotentialShots: allPotentialShots * shotShare(cfg.awayStrength),
    homePotentialFouls: allPotentialFouls * (cfg.awayStrength / 100),
    awayPotentialFouls: allPotentialFouls * (cfg.homeStrength / 100),

    // per-match shot accuracy constants (as in the original: 0.1..0.5)
    shotOnGoalChanceHome: accuracyFor(cfg.homeStrength, rand() * 0.4 + 0.1),
    shotOnGoalChanceAway: accuracyFor(cfg.awayStrength, rand() * 0.4 + 0.1),

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
      addMorale('home', moraleShift);
      addMorale('away', -moraleShift);
    } else {
      state.awayPossession += step;
      addMorale('away', moraleShift);
      addMorale('home', -moraleShift);
    }
    state.homePossession = Math.min(85, Math.max(15, state.homePossession));
    state.awayPossession = 100 - state.homePossession;
  }

  /** All morale writes go through here so the bounds always apply. */
  function addMorale(side, delta) {
    if (side === 'home') state.homeMorale = clampMorale(state.homeMorale + delta);
    else state.awayMorale = clampMorale(state.awayMorale + delta);
  }

  /** Pull morale a small fraction of the way back to its setup value. */
  function decayMorale() {
    state.homeMorale = clampMorale(
      state.homeMorale + (cfg.homeMorale - state.homeMorale) * MORALE_LIMITS.DECAY
    );
    state.awayMorale = clampMorale(
      state.awayMorale + (cfg.awayMorale - state.awayMorale) * MORALE_LIMITS.DECAY
    );
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
      addMorale('home', (rand() > 0.5 ? -1 : 1) * state.homeMorale * 0.15);
    } else {
      state.awayRedCards++;
      state.awayRedEvents.push({ name: player.name, minute: state.minute });
      state.awayStrength -= state.awayStrength * 0.09;
      // FIX: now symmetric with the home side (was -25%/+5%)
      addMorale('away', (rand() > 0.5 ? -1 : 1) * state.awayMorale * 0.15);
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
      addMorale('home', 0.2);
    } else {
      state.awayShotsOnGoal++;
      addMorale('away', 0.2);
    }

    // Goal chance is driven by the team's share of strength, plus morale and
    // crowd as bounded adjustments (morale is already clamped to 0..10).
    const power = EXPERIMENT.conversionUsesStrength
      ? isHome
        ? conversionStrength(state.homeStrength) + state.homeMorale + cfg.homeCrowdSupport
        : conversionStrength(state.awayStrength) + state.awayMorale
      : isHome
        ? state.homeMorale + cfg.homeCrowdSupport
        : state.awayMorale;
    // Lever 3: a floor applies the same minimum to both sides, so it cannot
    // favour either team by construction.
    const goalChance = Math.max(
      cfg.goalChanceFloor,
      power / 100 / (cfg.goalDivisor + rand())
    );
    if (rand() >= goalChance) return;

    // GOAL
    const scorer = randomOutfieldScorer(lineup);
    scorer.goalsToday++;
    if (isHome) {
      state.homeGoals++;
      addMorale('home', 1);
      state.homeGoalEvents.push({ name: scorer.name, minute: state.minute });
    } else {
      state.awayGoals++;
      addMorale('away', 1);
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
    decayMorale();
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
  module.exports = {
  EXPERIMENT,
  GOAL_RATE_PRESETS,
  drawSetupChoices,
  shotShare,
  conversionStrength,
  accuracyFor,
  createMatchEngine,
  MATCH_STATUS,
  makeStartingLineup,
  normaliseStrength,
  clampMorale,
  MORALE_LIMITS,
  STRENGTH_SHARE_LIMITS,
};
}
