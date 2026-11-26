/**
 * ScoreSim — DOM wiring. No frameworks, no dependencies.
 * Reads the settings form, builds a MatchConfig, drives the engine on a
 * timer and renders the scoreboard + stats each tick.
 */
'use strict';

/* ------------------------------------------------------------------ */
/* Static option data (from the original matchsettings component)      */
/* ------------------------------------------------------------------ */
// Team source: which list the team inputs draw from. Competition names no
// longer affect the simulation, so they are not part of the settings.
const TEAM_SOURCES = {
  clubs: { label: 'Clubs (UEFA database)', kind: 'clubs' },
  nations: { label: 'Nations (UEFA database)', kind: 'nations' },
  samples: { label: 'Sample teams (test set)', kind: 'samples' },
  custom: { label: 'Custom teams', kind: 'custom' },
};

/** Display name for a team from any of the three sources. */
function teamName(team) {
  return team.club_name || team.nation_name || team.name;
}

/** Sources where strengths are typed or given directly (not derived from a database). */
function usesDirectStrength(kind) {
  return kind === 'custom' || kind === 'samples';
}

// Each option has value() for fixed settings and random(rand) for the
// "Random" entry, which draws from the match's seeded generator.
const CROWD_OPTIONS = [
  { label: 'Hosts have no support', value: () => 0 },
  { label: 'Hosts have weak support', value: () => 2 },
  { label: 'Hosts have average support', value: () => 3 },
  { label: 'Hosts enjoy good support', value: () => 5 },
  { label: 'Hosts enjoy outstanding support', value: () => 7 },
  { label: 'Teams play on neutral venue', value: () => 0 },
  { label: 'Random support', random: (r) => Math.round(r() * 8) },
];

const MORALE_OPTIONS = [
  { label: 'Extremely low', value: () => 0 },
  { label: 'Low', value: () => 1 },
  { label: 'Average', value: () => 2 },
  { label: 'High', value: () => 3 },
  { label: 'Extremely high', value: () => 4 },
  { label: 'Random', random: (r) => Math.round(r() * 4) },
];

const TACTICS_OPTIONS = [
  { label: 'Defensive', value: () => 0.6 },
  { label: 'Counter', value: () => 0.8 },
  { label: 'Balanced', value: () => 1 },
  { label: 'Possession', value: () => 1.2 },
  { label: 'Attacking', value: () => 1.4 },
  { label: 'Random', random: (r) => r() * 0.8 + 0.6 },
];

const DEFAULT_LOGO = 'img/fantasy_team.png';
const MS_PER_MINUTE = 150; // simulation speed: 1 match minute each 150ms

/* ------------------------------------------------------------------ */
/* App state                                                           */
/* ------------------------------------------------------------------ */
const app = {
  teams: [], // active pool (clubs or nations) for the chosen source
  teamKind: 'clubs',
  source: 'clubs', // key into TEAM_SOURCES
  home: null, // selected team objects (or null for free-typed names)
  away: null,
  strength: { home: 50, away: 50, bucket: 3 },
  strengthIsRecommended: false,
  engine: null,
  timer: null,
};

const $ = (sel) => document.querySelector(sel);

/* ------------------------------------------------------------------ */
/* Settings form                                                       */
/* ------------------------------------------------------------------ */
function fillSelect(sel, labels) {
  sel.innerHTML = labels.map((l) => `<option>${l}</option>`).join('');
}

function applyTeamSource() {
  const src = TEAM_SOURCES[app.source];
  app.teamKind = src.kind;
  const isCustom = src.kind === 'custom';
  const isSamples = src.kind === 'samples';
  $('#customTeams').style.display = isCustom ? 'flex' : 'none';
  $('#homeTeam').style.display = isCustom ? 'none' : '';
  $('#awayTeam').style.display = isCustom ? 'none' : '';
  $('#strengthRecommended').style.display = 'none';
  $('#relativeStrength').disabled = usesDirectStrength(src.kind);
  if (isCustom) {
    app.teams = [];
    $('#teamList').innerHTML = '';
  } else {
    app.teams = isSamples
      ? SAMPLE_TEAMS
      : src.kind === 'clubs' ? UEFA_CLUBS : UEFA_NATIONS;
    $('#teamList').innerHTML = app.teams
      .map((team) => `<option value="${teamName(team)}">`)
      .join('');
  }
  app.home = null;
  app.away = null;
  $('#homeTeam').value = '';
  $('#awayTeam').value = '';
}

/**
 * Read and validate the custom team inputs. Strengths are any positive
 * numbers; the engine normalises them into shares, so no bucket is used.
 * Returns { error } or { home, away } with names and strengths.
 */
function readCustomTeams() {
  const homeName = $('#customHomeName').value.trim();
  const awayName = $('#customAwayName').value.trim();
  const homeRaw = $('#customHomeStrength').value;
  const awayRaw = $('#customAwayStrength').value;
  if (homeName === '' || awayName === '') {
    return { error: 'Please enter both custom team names' };
  }
  if (homeName.toLowerCase() === awayName.toLowerCase()) {
    return { error: 'Home and away teams need different names' };
  }
  const home = Number(homeRaw);
  const away = Number(awayRaw);
  if (homeRaw === '' || awayRaw === '' || !Number.isFinite(home) || !Number.isFinite(away)) {
    return { error: 'Please enter a strength for both teams' };
  }
  if (home <= 0 || away <= 0) {
    return { error: 'Strengths must be greater than zero' };
  }
  return { home: { name: homeName, strength: home }, away: { name: awayName, strength: away } };
}

function findTeam(name) {
  return app.teams.find((t) => teamName(t) === name) || null;
}

function recommendStrength() {
  app.strengthIsRecommended = false;
  if (usesDirectStrength(app.teamKind)) {
    // strengths come from the team entries (samples) or the custom inputs
    $('#strengthRecommended').style.display = 'none';
    return;
  }
  if (app.home && app.away) {
    if (app.teamKind === 'clubs') {
      if (
        app.home.club_points_last_season != null &&
        app.away.club_points_last_season != null
      ) {
        app.strength = clubStrengths(
          {
            points: app.home.club_points_last_season,
            division: app.home.club_division_last_season,
            divisionGroup: app.home.club_division_group_last_season,
          },
          {
            points: app.away.club_points_last_season,
            division: app.away.club_division_last_season,
            divisionGroup: app.away.club_division_group_last_season,
          }
        );
        app.strengthIsRecommended = true;
      }
    } else if (app.home.fifa_nation_rank && app.away.fifa_nation_rank) {
      app.strength = nationStrengths(
        app.home.fifa_nation_rank,
        app.away.fifa_nation_rank
      );
      app.strengthIsRecommended = true;
    }
  }
  if (!app.strengthIsRecommended) app.strength = { home: 50, away: 50, bucket: 3 };
  $('#relativeStrength').selectedIndex = app.strength.bucket;
  $('#strengthRecommended').style.display = app.strengthIsRecommended
    ? 'inline'
    : 'none';
}

function pickVenue(team, rand) {
  if (!team || !team.venues) return null;
  const v = team.venues;
  if (!Array.isArray(v)) return v;
  return v[Math.floor((rand ? rand() : Math.random()) * v.length)];
}

function teamLogo(team) {
  if (!team) return DEFAULT_LOGO;
  return team.club_logo_large || team.nation_flag_large || DEFAULT_LOGO;
}

/* ------------------------------------------------------------------ */
/* Build config & start the match                                      */
/* ------------------------------------------------------------------ */
function readOption(selectId, options, rand) {
  // 'Random' options (last entry) draw from the seeded generator, not Math.random
  const idx = $(selectId).selectedIndex;
  const opt = options[idx];
  return opt.random ? opt.random(rand) : opt.value();
}

function proceedToMatch() {
  const isCustom = app.teamKind === 'custom';
  const isSamples = app.teamKind === 'samples';
  let homeName, awayName, customShares = null;
  if (isCustom) {
    const c = readCustomTeams();
    if (c.error) {
      alert(c.error);
      return;
    }
    homeName = c.home.name;
    awayName = c.away.name;
    customShares = normaliseStrength(c.home.strength, c.away.strength);
  } else if (isSamples) {
    homeName = $('#homeTeam').value.trim();
    awayName = $('#awayTeam').value.trim();
    const h = findTeam(homeName);
    const a = findTeam(awayName);
    if (!h || !a) {
      alert('Pick both teams from the sample list');
      return;
    }
    if (h === a) {
      alert('Home and away teams must be different');
      return;
    }
    homeName = teamName(h);
    awayName = teamName(a);
    app.home = h;
    app.away = a;
    customShares = normaliseStrength(h.strength, a.strength);
  } else {
    homeName = $('#homeTeam').value.trim();
    awayName = $('#awayTeam').value.trim();
  }

  // One seed fixes the whole match: setup choices and simulation.
  // A seed typed into the form replays an earlier match exactly.
  const typedSeed = $('#seedInput').value.trim();
  let seed;
  if (typedSeed === '') {
    seed = newSeed();
  } else {
    seed = parseSeed(typedSeed);
    if (seed === null) {
      alert('Seed must be a whole number from 0 to 4294967295');
      return;
    }
  }
  const rand = mulberry32(seed);
  app.seed = seed;

  if (!isCustom && (homeName === '' || awayName === '')) {
    alert('Please enter team names');
    return;
  }
  const isSecondLeg = $('#isSecondLeg').checked;
  const homeLeg1 = $('#homeLeg1Goals').value;
  const awayLeg1 = $('#awayLeg1Goals').value;
  if (isSecondLeg && (homeLeg1 === '' || awayLeg1 === '')) {
    alert('Please specify first leg result between these two teams');
    return;
  }

  // custom and sample teams pass their own strengths; database play uses the dropdown
  const bucket = STRENGTH_BUCKETS[$('#relativeStrength').selectedIndex];
  const crowdIdx = $('#crowdSupport').selectedIndex;
  const neutralVenue = crowdIdx === 5;
  const directShares = usesDirectStrength(app.teamKind) ? customShares : null;

  const config = {
    homeStrength: directShares ? directShares.home : bucket.home,
    awayStrength: directShares ? directShares.away : bucket.away,
    homeCrowdSupport: CROWD_OPTIONS[crowdIdx].random
      ? CROWD_OPTIONS[crowdIdx].random(rand)
      : CROWD_OPTIONS[crowdIdx].value(),
    homeMorale: readOption('#homeMorale', MORALE_OPTIONS, rand),
    awayMorale: readOption('#awayMorale', MORALE_OPTIONS, rand),
    homeTactics: readOption('#homeTactics', TACTICS_OPTIONS, rand),
    awayTactics: readOption('#awayTactics', TACTICS_OPTIONS, rand),
    isSecondLeg,
    homeFirstLegGoals: isSecondLeg ? Number(homeLeg1) : 0,
    awayFirstLegGoals: isSecondLeg ? Number(awayLeg1) : 0,
  };

  // the engine draws the rest of its randomness from the same seeded stream
  app.engine = createMatchEngine(config, rand);

  // scoreboard header
  $('#sbHomeName').textContent = homeName.toUpperCase();
  $('#sbAwayName').textContent = awayName.toUpperCase();
  $('#sbHomeLogo').src = teamLogo(app.home);
  $('#sbAwayLogo').src = teamLogo(app.away);
  $('#sbSource').textContent = TEAM_SOURCES[app.source].label;
  // sample and custom teams have no venue list, so only the neutral option applies
  const venue = neutralVenue
    ? 'Neutral venue'
    : directShares ? null : pickVenue(app.home, rand);
  $('#sbVenue').textContent = venue || '';
  $('#sbSeed').textContent = `Seed ${seed}`;

  // swap views
  $('#settingsView').style.display = 'none';
  $('#intro').style.display = 'none';
  $('#matchView').style.display = 'flex';
  render();
}

/* ------------------------------------------------------------------ */
/* Match loop & rendering                                              */
/* ------------------------------------------------------------------ */
function kickOff() {
  $('#kickOffBtn').style.display = 'none';
  app.engine.kickOff();
  app.timer = setInterval(() => {
    app.engine.tick();
    render();
    if (app.engine.state.isFinished) {
      clearInterval(app.timer);
      app.timer = null;
      $('#playAnotherBtn').style.display = 'inline-block';
    }
  }, MS_PER_MINUTE);
}

function eventList(goals, reds) {
  const g = goals
    .map((e) => `<li class="scorer">&#9917; ${e.name} ${e.minute}'</li>`)
    .join('');
  const r = reds
    .map((e) => `<li class="sentOff">&#128997; ${e.name} ${e.minute}'</li>`)
    .join('');
  return g + r;
}

function render() {
  const s = app.engine.state;
  $('#sbScore').textContent = `${s.homeGoals}-${s.awayGoals}`;
  $('#sbMinute').textContent = `${s.minute}'`;
  $('#sbStatus').textContent = s.status;

  // aggregate line (2-leg ties only)
  const agg = $('#sbAggregate');
  if (app.engine.config.isSecondLeg) {
    agg.style.display = 'block';
    agg.textContent = s.isFinished && s.aggregateStatus
      ? s.aggregateStatus
      : `agg: ${app.engine.totalHomeGoals()}:${app.engine.totalAwayGoals()}`;
  } else {
    agg.style.display = 'none';
  }

  $('#homeEvents').innerHTML = eventList(s.homeGoalEvents, s.homeRedEvents);
  $('#awayEvents').innerHTML = eventList(s.awayGoalEvents, s.awayRedEvents);

  // stats table
  const stats = [
    [`${s.homePossession}%`, `${s.awayPossession}%`],
    [s.homeShots, s.awayShots],
    [s.homeShotsOnGoal, s.awayShotsOnGoal],
    [s.homeFouls, s.awayFouls],
    [s.homeYellowCards, s.awayYellowCards],
    [s.homeRedCards, s.awayRedCards],
  ];
  document.querySelectorAll('#statsTable tbody tr').forEach((row, i) => {
    row.cells[0].textContent = stats[i][0];
    row.cells[2].textContent = stats[i][1];
  });
}

/* ------------------------------------------------------------------ */
/* Init                                                                */
/* ------------------------------------------------------------------ */
function init() {
  fillSelect($('#teamSource'), Object.values(TEAM_SOURCES).map((t) => t.label));
  $('#teamSource').selectedIndex = 0;
  fillSelect($('#relativeStrength'), STRENGTH_LABELS);
  fillSelect($('#crowdSupport'), CROWD_OPTIONS.map((o) => o.label));
  fillSelect($('#homeMorale'), MORALE_OPTIONS.map((o) => o.label));
  fillSelect($('#awayMorale'), MORALE_OPTIONS.map((o) => o.label));
  fillSelect($('#homeTactics'), TACTICS_OPTIONS.map((o) => o.label));
  fillSelect($('#awayTactics'), TACTICS_OPTIONS.map((o) => o.label));
  $('#relativeStrength').selectedIndex = 3; // equal
  $('#crowdSupport').selectedIndex = 6; // random
  $('#homeMorale').selectedIndex = 5; // random
  $('#awayMorale').selectedIndex = 5;
  $('#homeTactics').selectedIndex = 5;
  $('#awayTactics').selectedIndex = 5;

  applyTeamSource();

  $('#teamSource').addEventListener('change', (e) => {
    app.source = Object.keys(TEAM_SOURCES)[e.target.selectedIndex];
    applyTeamSource();
    recommendStrength();
  });
  $('#homeTeam').addEventListener('change', (e) => {
    app.home = findTeam(e.target.value.trim());
    recommendStrength();
  });
  $('#awayTeam').addEventListener('change', (e) => {
    app.away = findTeam(e.target.value.trim());
    recommendStrength();
  });
  $('#isSecondLeg').addEventListener('change', (e) => {
    $('#firstLegGoals').style.visibility = e.target.checked
      ? 'visible'
      : 'hidden';
  });
  $('#proceedBtn').addEventListener('click', proceedToMatch);
  $('#kickOffBtn').addEventListener('click', kickOff);
  $('#playAnotherBtn').addEventListener('click', () => location.reload());
}

document.addEventListener('DOMContentLoaded', init);
