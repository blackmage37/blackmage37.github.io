/**
 * ScoreSim — DOM wiring. No frameworks, no dependencies.
 * Reads the settings form, builds a MatchConfig, drives the engine on a
 * timer and renders the scoreboard + stats each tick.
 */
'use strict';

/* ------------------------------------------------------------------ */
/* Static option data (from the original matchsettings component)      */
/* ------------------------------------------------------------------ */
const TOURNAMENTS = [
  { name: 'UEFA Champions League', teams: 'clubs' },
  { name: 'UEFA Europa League', teams: 'clubs' },
  { name: 'UEFA Europa Conference League', teams: 'clubs' },
  { name: 'UEFA European Championship', teams: 'nations' },
  { name: 'UEFA Euro qualifiers', teams: 'nations' },
  { name: 'UEFA friendly (clubs)', teams: 'clubs' },
  { name: 'International friendly (UEFA nations)', teams: 'nations' },
  { name: 'UEFA World Cup qualifiers', teams: 'nations' },
];

const CROWD_OPTIONS = [
  { label: 'Hosts have no support', value: () => 0 },
  { label: 'Hosts have weak support', value: () => 2 },
  { label: 'Hosts have average support', value: () => 3 },
  { label: 'Hosts enjoy good support', value: () => 5 },
  { label: 'Hosts enjoy outstanding support', value: () => 7 },
  { label: 'Teams play on neutral venue', value: () => 0 },
  { label: 'Random support', value: () => Math.round(Math.random() * 8) },
];

const MORALE_OPTIONS = [
  { label: 'Extremely low', value: () => 0 },
  { label: 'Low', value: () => 1 },
  { label: 'Average', value: () => 2 },
  { label: 'High', value: () => 3 },
  { label: 'Extremely high', value: () => 4 },
  { label: 'Random', value: () => Math.round(Math.random() * 4) },
];

const TACTICS_OPTIONS = [
  { label: 'Defensive', value: () => 0.6 },
  { label: 'Counter', value: () => 0.8 },
  { label: 'Balanced', value: () => 1 },
  { label: 'Possession', value: () => 1.2 },
  { label: 'Attacking', value: () => 1.4 },
  { label: 'Random', value: () => Math.random() * 0.8 + 0.6 },
];

const DEFAULT_LOGO = 'img/fantasy_team.png';
const MS_PER_MINUTE = 150; // simulation speed: 1 match minute each 150ms

/* ------------------------------------------------------------------ */
/* App state                                                           */
/* ------------------------------------------------------------------ */
const app = {
  teams: [], // active pool (clubs or nations) for the chosen tournament
  teamKind: 'clubs',
  tournament: TOURNAMENTS[0].name,
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

function loadTeamsForTournament() {
  const t = TOURNAMENTS.find((x) => x.name === app.tournament);
  app.teamKind = t.teams;
  app.teams = t.teams === 'clubs' ? UEFA_CLUBS : UEFA_NATIONS;
  const list = $('#teamList');
  list.innerHTML = app.teams
    .map((team) => `<option value="${team.club_name || team.nation_name}">`)
    .join('');
  app.home = null;
  app.away = null;
  $('#homeTeam').value = '';
  $('#awayTeam').value = '';
}

function findTeam(name) {
  return (
    app.teams.find((t) => (t.club_name || t.nation_name) === name) || null
  );
}

function recommendStrength() {
  app.strengthIsRecommended = false;
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

function pickVenue(team) {
  if (!team || !team.venues) return null;
  const v = team.venues;
  return Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v;
}

function teamLogo(team) {
  if (!team) return DEFAULT_LOGO;
  return team.club_logo_large || team.nation_flag_large || DEFAULT_LOGO;
}

/* ------------------------------------------------------------------ */
/* Build config & start the match                                      */
/* ------------------------------------------------------------------ */
function readOption(selectId, options) {
  return options[$(selectId).selectedIndex].value();
}

function proceedToMatch() {
  const homeName = $('#homeTeam').value.trim();
  const awayName = $('#awayTeam').value.trim();
  if (homeName === '' || awayName === '') {
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

  const bucket = STRENGTH_BUCKETS[$('#relativeStrength').selectedIndex];
  const crowdIdx = $('#crowdSupport').selectedIndex;
  const neutralVenue = crowdIdx === 5;

  const config = {
    homeStrength: bucket.home,
    awayStrength: bucket.away,
    homeCrowdSupport: CROWD_OPTIONS[crowdIdx].value(),
    homeMorale: readOption('#homeMorale', MORALE_OPTIONS),
    awayMorale: readOption('#awayMorale', MORALE_OPTIONS),
    homeTactics: readOption('#homeTactics', TACTICS_OPTIONS),
    awayTactics: readOption('#awayTactics', TACTICS_OPTIONS),
    isSecondLeg,
    homeFirstLegGoals: isSecondLeg ? Number(homeLeg1) : 0,
    awayFirstLegGoals: isSecondLeg ? Number(awayLeg1) : 0,
  };

  app.engine = createMatchEngine(config);

  // scoreboard header
  $('#sbHomeName').textContent = homeName.toUpperCase();
  $('#sbAwayName').textContent = awayName.toUpperCase();
  $('#sbHomeLogo').src = teamLogo(app.home);
  $('#sbAwayLogo').src = teamLogo(app.away);
  $('#sbTournament').textContent = app.tournament;
  const venue = neutralVenue ? 'Neutral venue' : pickVenue(app.home);
  $('#sbVenue').textContent = venue || '';

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
  fillSelect($('#tournament'), TOURNAMENTS.map((t) => t.name));
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

  loadTeamsForTournament();

  $('#tournament').addEventListener('change', (e) => {
    app.tournament = e.target.value;
    loadTeamsForTournament();
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
