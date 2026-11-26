'use strict';
/**
 * ScoreSim — Config options page logic.
 * Lets the user tune goal-rate constants and preview their effect via live
 * simulation before saving.
 */
const LOCKED = {
  favouriteWin: [0.63, 0.68],
  underdogWin: [0.13, 0.17],
};
const DEFAULTS = { goalDivisor: 1.1, goalChanceFloor: 0.3 };
const PRESETS = {
  low: { label: 'Low', divisor: 1.4, floor: 0.225, goals: 2.54 },
  medium: { label: 'Medium', divisor: 1.2, floor: 0.25, goals: 2.85 },
  high: { label: 'High', divisor: 1.1, floor: 0.3, goals: 3.14 },
};
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const app = { divisor: DEFAULTS.goalDivisor, floor: DEFAULTS.goalChanceFloor, customName: '', timer: null };

function loadSaved() {
  try {
    const raw = localStorage.getItem('scoresim-config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.goalDivisor === 'number') app.divisor = parsed.goalDivisor;
      if (typeof parsed.goalChanceFloor === 'number') app.floor = parsed.goalChanceFloor;
      if (typeof parsed.customPresetName === 'string') app.customName = parsed.customPresetName;
    }
  } catch (e) { /* ignore */ }
}
function save() {
  try {
    localStorage.setItem('scoresim-config', JSON.stringify({
      goalDivisor: app.divisor, goalChanceFloor: app.floor, customPresetName: app.customName,
    }));
    $('#saveNote').textContent = 'Saved to browser storage.';
    setTimeout(() => { $('#saveNote').textContent = ''; }, 2000);
  } catch (e) {
    $('#saveNote').textContent = 'Could not save (storage unavailable).';
  }
}
function formatNum(n, d = 2) { return n.toFixed(d); }
function renderPresets() {
  const grid = $('#presetGrid');
  grid.innerHTML = Object.entries(PRESETS).map(([key, p]) => {
    const isActive = Math.abs(p.divisor - app.divisor) < 0.001 && Math.abs(p.floor - app.floor) < 0.001;
    return `
      <button class="presetBtn ${isActive ? 'active' : ''}" data-key="${key}">
        <strong>${p.label}</strong>
        <div class="presetStats">
          div ${formatNum(p.divisor, 2)} · floor ${formatNum(p.floor, 3)} · goals ${formatNum(p.goals, 2)}/match
        </div>
      </button>
    `;
  }).join('');
  $$('.presetBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = PRESETS[btn.dataset.key];
      app.divisor = p.divisor;
      app.floor = p.floor;
      $('#goalDivisor').value = p.divisor;
      $('#goalChanceFloor').value = p.floor;
      updateDisplays();
      debouncedPreview();
    });
  });
}
function updateDisplays() {
  $('#divisorVal').textContent = formatNum(app.divisor, 2);
  $('#divisorDisp').textContent = formatNum(app.divisor, 2);
  $('#floorVal').textContent = formatNum(app.floor, 3);
  $('#floorDisp').textContent = formatNum(app.floor, 3);
  $('#customPresetName').value = app.customName;
  $$('.presetBtn').forEach(btn => {
    const p = PRESETS[btn.dataset.key];
    const isActive = Math.abs(p.divisor - app.divisor) < 0.001 && Math.abs(p.floor - app.floor) < 0.001;
    btn.classList.toggle('active', isActive);
  });
}

function runPreview() {
  const { createMatchEngine } = window;
  const { mulberry32 } = window;
  const N = 500;
  const base = { homeCrowdSupport: 0, homeMorale: 2, awayMorale: 2, homeTactics: 1, awayTactics: 1 };
  const SEED = 104729 * 17 + 123457;
  function tally(h, a) {
    let hw = 0, d = 0, aw = 0, g = 0;
    for (let i = 0; i < N; i++) {
      const s = createMatchEngine(
        { ...base, goalDivisor: app.divisor, goalChanceFloor: app.floor, homeStrength: h, awayStrength: a },
        mulberry32(SEED + i * 104729)
      ).simulateToEnd();
      if (s.homeGoals > s.awayGoals) hw++;
      else if (s.homeGoals < s.awayGoals) aw++;
      else d++;
      g += s.homeGoals + s.awayGoals;
    }
    return { hw: hw / N, d: d / N, aw: aw / N, goals: g / N };
  }
  const v7030 = tally(70, 30);
  const v5050 = tally(50, 50);
  const favInBand = v7030.hw >= LOCKED.favouriteWin[0] && v7030.hw <= LOCKED.favouriteWin[1];
  const undInBand = v7030.aw >= LOCKED.underdogWin[0] && v7030.aw <= LOCKED.underdogWin[1];
  $('#previewGrid').innerHTML = `
    <div class="previewCard">
      <h4>70/30 matchup (strong favourite)</h4>
      <div class="statRow"><span>Favourite win:</span> <strong>${formatNum(v7030.hw * 100, 1)}%</strong></div>
      <div class="statRow"><span>Draw:</span> <strong>${formatNum(v7030.d * 100, 1)}%</strong></div>
      <div class="statRow"><span>Underdog win:</span> <strong>${formatNum(v7030.aw * 100, 1)}%</strong></div>
      <div class="statRow"><span>Goals/match:</span> <strong>${formatNum(v7030.goals, 2)}</strong></div>
    </div>
    <div class="previewCard">
      <h4>50/50 matchup (balanced)</h4>
      <div class="statRow"><span>Home win:</span> <strong>${formatNum(v5050.hw * 100, 1)}%</strong></div>
      <div class="statRow"><span>Draw:</span> <strong>${formatNum(v5050.d * 100, 1)}%</strong></div>
      <div class="statRow"><span>Away win:</span> <strong>${formatNum(v5050.aw * 100, 1)}%</strong></div>
      <div class="statRow"><span>Goals/match:</span> <strong>${formatNum(v5050.goals, 2)}</strong></div>
    </div>
  `;
  const favOk = favInBand ? '✓ in band' : '✗ outside band';
  const undOk = undInBand ? '✓ in band' : '✗ outside band';
  $('#bandCheck').innerHTML = `
    <div class="bandResult ${favInBand && undInBand ? 'good' : 'bad'}">
      <strong>Locked-band check (70/30):</strong><br>
      Favourite ${formatNum(v7030.hw * 100, 1)}% — ${favOk}<br>
      Underdog ${formatNum(v7030.aw * 100, 1)}% — ${undOk}
    </div>
  `;
}
let previewPending = false;
function debouncedPreview() {
  if (previewPending) return;
  previewPending = true;
  setTimeout(() => {
    previewPending = false;
    runPreview();
  }, 300);
}
function init() {
  loadSaved();
  updateDisplays();
  renderPresets();
  $('#goalDivisor').addEventListener('input', (e) => {
    app.divisor = parseFloat(e.target.value) || 1.1;
    updateDisplays();
    debouncedPreview();
  });
  $('#goalChanceFloor').addEventListener('input', (e) => {
    app.floor = parseFloat(e.target.value) || 0.3;
    updateDisplays();
    debouncedPreview();
  });
  $('#customPresetName').addEventListener('input', (e) => {
    app.customName = e.target.value;
  });
  $('#saveCustomBtn').addEventListener('click', () => {
    const name = app.customName.trim();
    if (!name) {
      $('#saveNote').textContent = 'Enter a name first.';
      setTimeout(() => { $('#saveNote').textContent = ''; }, 2000);
      return;
    }
    save();
  });
  $('#resetBtn').addEventListener('click', () => {
    app.divisor = DEFAULTS.goalDivisor;
    app.floor = DEFAULTS.goalChanceFloor;
    app.customName = '';
    $('#goalDivisor').value = app.divisor;
    $('#goalChanceFloor').value = app.floor;
    $('#customPresetName').value = '';
    updateDisplays();
    renderPresets();
    debouncedPreview();
  });
  runPreview();
}
document.addEventListener('DOMContentLoaded', init);

