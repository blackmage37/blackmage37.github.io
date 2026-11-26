'use strict';
/**
 * Headless check of the settings-form logic in js/ui.js.
 * Runs the real page scripts against a minimal DOM stub, so the
 * custom-team path can be exercised without a browser.
 * Run: node tests/ui-harness.js
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const els = {};
function el(id) {
  if (!els[id]) {
    els[id] = {
      id, value: '', checked: false, selectedIndex: 0, style: {},
      textContent: '', innerHTML: '', disabled: false,
      addEventListener() {},
    };
  }
  return els[id];
}

const ctx = {
  console,
  alert(msg) { ctx.__alerts.push(msg); },
  setInterval, clearInterval,
  location: { reload() {} },
  crypto: require('node:crypto').webcrypto,
  document: {
    querySelector: (s) => el(s.replace(/^#/, '')),
    querySelectorAll: () => [],
    addEventListener() {},
  },
  __alerts: [],
};
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['data/clubs.js', 'data/nations.js', 'data/sample-teams.js', 'js/strength.js', 'js/rng.js', 'js/engine.js', 'js/ui.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
}
vm.runInContext('init()', ctx);

const get = (expr) => vm.runInContext(expr, ctx);
let failures = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS ${name}`);
  else { failures++; console.log(`FAIL ${name} ${detail}`); }
}

// Select a team source by key (clubs | nations | samples | custom), so the
// harness does not depend on the order of options in the dropdown.
function setSource(key) {
  const index = get(`Object.keys(TEAM_SOURCES).indexOf('${key}')`);
  el('teamSource').selectedIndex = index;
  get(`app.source = '${key}'; applyTeamSource();`);
}

function fillCustom(homeName, awayName, homeS, awayS, seed = '2024') {
  el('customHomeName').value = homeName;
  el('customAwayName').value = awayName;
  el('customHomeStrength').value = homeS;
  el('customAwayStrength').value = awayS;
  el('seedInput').value = seed;
  el('crowdSupport').selectedIndex = 5; // neutral venue
  for (const id of ['homeMorale', 'awayMorale', 'homeTactics', 'awayTactics']) el(id).selectedIndex = 2;
}

// 1. Mode switching
setSource('custom');
check('custom: custom fields visible', el('customTeams').style.display === 'flex');
check('custom: database name inputs hidden', el('homeTeam').style.display === 'none');
check('custom: strength dropdown disabled', el('relativeStrength').disabled === true);
setSource('clubs');
check('clubs: custom fields hidden', el('customTeams').style.display === 'none');
check('clubs: strength dropdown enabled', el('relativeStrength').disabled === false);

// 2. Validation
setSource('custom');
fillCustom('', 'Beta', '10', '7');
get('proceedToMatch()');
check('validation: blank name rejected', /both custom team names/.test(get('__alerts') ? ctx.__alerts.at(-1) : ''));
fillCustom('Same', 'same', '10', '7');
get('proceedToMatch()');
check('validation: duplicate name rejected', /different names/.test(ctx.__alerts.at(-1)));
fillCustom('Alpha', 'Beta', '', '7');
get('proceedToMatch()');
check('validation: missing strength rejected', /strength for both/.test(ctx.__alerts.at(-1)));
fillCustom('Alpha', 'Beta', '0', '7');
get('proceedToMatch()');
check('validation: zero strength rejected', /greater than zero/.test(ctx.__alerts.at(-1)));
fillCustom('Alpha', 'Beta', '-3', '7');
get('proceedToMatch()');
check('validation: negative strength rejected', /greater than zero/.test(ctx.__alerts.at(-1)));

// 3. Custom match reaches the engine with the raw ratio preserved
setSource('custom');
fillCustom('Team Alpha', 'Team Beta', '10.93', '7.31', '2024');
get('proceedToMatch()');
const shares = get('[app.engine.config.homeStrength, app.engine.config.awayStrength]');
const expected = (10.93 / (10.93 + 7.31)) * 100;
check('custom: home share matches 10.93 / (10.93+7.31)', Math.abs(shares[0] - expected) < 1e-9, `got ${shares[0]}`);
check('custom: shares sum to 100', Math.abs(shares[0] + shares[1] - 100) < 1e-9);
check('custom: scoreboard shows team names', el('sbHomeName').textContent === 'TEAM ALPHA' && el('sbAwayName').textContent === 'TEAM BETA', `${el('sbHomeName').textContent} / ${el('sbAwayName').textContent}`);
check('custom: scoreboard shows source label', el('sbSource').textContent === 'Custom teams');
check('custom: seed shown', el('sbSeed').textContent === 'Seed 2024');

// 4. Same seed and custom strengths reproduce the same match
const first = get('JSON.stringify(app.engine.simulateToEnd())');
get('app.engine = null');
fillCustom('Team Alpha', 'Team Beta', '10.93', '7.31', '2024');
get('proceedToMatch()');
const second = get('JSON.stringify(app.engine.simulateToEnd())');
check('custom: same seed + strengths reproduces the match', first === second);

// 5. Sample teams: pick from the list, strengths come from the sample entries
setSource('samples');
el('homeTeam').value = 'Bahia Rojo';
el('awayTeam').value = 'AED Ajna';
el('seedInput').value = '7';
el('crowdSupport').selectedIndex = 5;
for (const id of ['homeMorale', 'awayMorale', 'homeTactics', 'awayTactics']) el(id).selectedIndex = 2;
get('proceedToMatch()');
const sampleShares = get('[app.engine.config.homeStrength, app.engine.config.awayStrength]');
check('samples: Bahia Rojo 100 vs AED Ajna 10 gives 100/11 share', Math.abs(sampleShares[0] - (100 / 110) * 100) < 1e-9, `got ${sampleShares[0]}`);
check('samples: scoreboard uses sample names', el('sbHomeName').textContent === 'BAHIA ROJO' && el('sbAwayName').textContent === 'AED AJNA');
check('samples: source label shown', el('sbSource').textContent === 'Sample teams (test set)');

get('app.engine = null');
el('homeTeam').value = 'Nobody FC';
el('awayTeam').value = 'AED Ajna';
get('proceedToMatch()');
check('samples: unknown team rejected', /sample list/.test(ctx.__alerts.at(-1)));

el('homeTeam').value = 'Utica United';
el('awayTeam').value = 'Utica United';
get('proceedToMatch()');
check('samples: same team on both sides rejected', /must be different/.test(ctx.__alerts.at(-1)));

// 6. Sample file contents match the owner's list exactly
const SAMPLE_TEAMS = get('SAMPLE_TEAMS'); // loaded into the same context as ui.js
const expectedSamples = {
  Akach: 95, Cobrio: 85, Osarius: 75, 'Limey Isles': 50, Aquillian: 35, Eristicea: 20, Kryosis: 10,
  'Bahia Rojo': 100, 'Hastmead Diamante': 90, 'Alissar Phoenix': 80, 'Jraxville FC': 70, 'Firewood City': 60,
  'Dynapolis United': 50, 'Utica United': 50, 'Negus Koromanti': 40, 'Callisto City': 30, 'Karikinui FC': 20, 'AED Ajna': 10,
};
check('samples: 18 teams present', SAMPLE_TEAMS.length === 18, `got ${SAMPLE_TEAMS.length}`);
for (const [name, strength] of Object.entries(expectedSamples)) {
  const t = SAMPLE_TEAMS.find((x) => x.name === name);
  check(`samples: ${name} = ${strength}`, !!t && t.strength === strength, t ? `got ${t.strength}` : 'missing');
}

// 7. Relative strength display: sample and custom teams show the real split,
// not a bucket label, and the misleading dropdown is hidden.
setSource('samples');
el('homeTeam').value = 'Akach';
el('awayTeam').value = 'Limey Isles';
get('recommendStrength(); updateStrengthDisplay();');
check('display: samples hide the bucket dropdown', el('relativeStrength').style.display === 'none');
const sampleNote = el('directStrengthNote').textContent;
check('display: Akach vs Limey Isles shows real split (65.5% / 34.5%)', sampleNote.includes('Akach 65.5%') && sampleNote.includes('Limey Isles 34.5%'), sampleNote);
check('display: no "equal in class" label for mismatched samples', !/equal in class/i.test(sampleNote));
check('display: note states the dropdown does not apply', /dropdown does not apply/.test(sampleNote));

el('homeTeam').value = 'Utica United';
el('awayTeam').value = 'Dynapolis United';
get('updateStrengthDisplay();');
check('display: equal sample teams show 50.0% / 50.0%', /Utica United 50\.0% vs Dynapolis United 50\.0%/.test(el('directStrengthNote').textContent));

setSource('custom');
el('customHomeName').value = '';
get('updateStrengthDisplay();');
check('display: custom with missing input asks for values', /Enter both custom teams/.test(el('directStrengthNote').textContent));
fillCustom('Team Alpha', 'Team Beta', '10.93', '7.31', '2024');
get('updateStrengthDisplay();');
check('display: custom shows the 10.93/7.31 split', /Team Alpha 59\.9% vs Team Beta 40\.1%/.test(el('directStrengthNote').textContent), el('directStrengthNote').textContent);

setSource('clubs');
check('display: database play shows the dropdown again', el('relativeStrength').style.display === '');
check('display: database play hides the sample/custom note', el('directStrengthNote').style.display === 'none');

console.log(failures === 0 ? '\nALL UI CHECKS PASSED' : `\n${failures} UI CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
