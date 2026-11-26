/*
 * Sample teams for testing. Strengths are relative values supplied by the
 * project owner; the engine normalises any pair into shares, so only the
 * ratio between two teams matters (e.g. 100 vs 50 behaves like 2 vs 1).
 * Rosters are not yet included (see ROADMAP: sample team rosters).
 */
const SAMPLE_TEAMS = [
  // International teams
  { name: 'Akach', group: 'International', strength: 95 },
  { name: 'Cobrio', group: 'International', strength: 85 },
  { name: 'Osarius', group: 'International', strength: 75 },
  { name: 'Limey Isles', group: 'International', strength: 50 },
  { name: 'Aquillian', group: 'International', strength: 35 },
  { name: 'Eristicea', group: 'International', strength: 20 },
  { name: 'Kryosis', group: 'International', strength: 10 },
  // Club teams
  { name: 'Bahia Rojo', group: 'Club', strength: 100 },
  { name: 'Hastmead Diamante', group: 'Club', strength: 90 },
  { name: 'Alissar Phoenix', group: 'Club', strength: 80 },
  { name: 'Jraxville FC', group: 'Club', strength: 70 },
  { name: 'Firewood City', group: 'Club', strength: 60 },
  { name: 'Dynapolis United', group: 'Club', strength: 50 },
  { name: 'Utica United', group: 'Club', strength: 50 },
  { name: 'Negus Koromanti', group: 'Club', strength: 40 },
  { name: 'Callisto City', group: 'Club', strength: 30 },
  { name: 'Karikinui FC', group: 'Club', strength: 20 },
  { name: 'AED Ajna', group: 'Club', strength: 10 },
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SAMPLE_TEAMS };
}
