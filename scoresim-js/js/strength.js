/**
 * ScoreSim — team strength derivation.
 * Consolidates the duplicated club/nation logic from the Angular
 * MatchsettingsComponent into two pure functions.
 * Returns { home, away, bucket } where bucket is 0..6
 * (0 = hosts much weaker ... 3 = equal ... 6 = hosts much stronger).
 */
'use strict';

const STRENGTH_BUCKETS = [
  { home: 30, away: 70 },
  { home: 40, away: 60 },
  { home: 45, away: 55 },
  { home: 50, away: 50 },
  { home: 55, away: 45 },
  { home: 60, away: 40 },
  { home: 70, away: 30 },
];

const STRENGTH_LABELS = [
  'Hosts much weaker than Visitors',
  'Hosts weaker than Visitors',
  'Hosts a bit weaker than Visitors',
  'Hosts and Visitors equal in class',
  'Hosts a bit stronger than Visitors',
  'Hosts stronger than Visitors',
  'Hosts much stronger than Visitors',
];

function bucketResult(bucket) {
  return Object.assign({ bucket }, STRENGTH_BUCKETS[bucket]);
}

/**
 * Derive strengths for two CLUBS from last-season division + points.
 * @param {object} home {points, division, divisionGroup}
 * @param {object} away {points, division, divisionGroup}
 */
function clubStrengths(home, away) {
  const hp = Number(home.points) || 0;
  const ap = Number(away.points) || 0;
  const divDiff = Number(home.division) - Number(away.division);

  if (ap === 0) return bucketResult(6); // unknown/zero away points: hosts favoured
  if (divDiff === 1) return bucketResult(1); // home plays a division lower
  if (divDiff >= 2) return bucketResult(0);
  if (divDiff === -1) return bucketResult(5);
  if (divDiff <= -2) return bucketResult(6);

  // same division: compare points ratio (different groups => equal)
  const ratio = hp / ap;
  if (
    (ratio > 0.9412 && ratio < 1.0625) ||
    (home.divisionGroup || null) !== (away.divisionGroup || null)
  ) {
    return bucketResult(3);
  }
  if (ratio > 0.8889 && ratio <= 0.9412) return bucketResult(2);
  if (ratio > 0.8 && ratio <= 0.8889) return bucketResult(1);
  if (ratio <= 0.8) return bucketResult(0);
  if (ratio >= 1.0625 && ratio < 1.125) return bucketResult(4);
  if (ratio >= 1.125 && ratio < 1.25) return bucketResult(5);
  return bucketResult(6); // ratio >= 1.25
}

/**
 * Derive strengths for two NATIONS from FIFA rankings
 * (lower rank number = better team).
 */
function nationStrengths(homeRank, awayRank) {
  const diff = Number(homeRank) - Number(awayRank);
  if (diff > 30) return bucketResult(0);
  if (diff > 10) return bucketResult(1);
  if (diff > 5) return bucketResult(2);
  if (diff >= -5) return bucketResult(3);
  if (diff >= -10) return bucketResult(4);
  if (diff >= -30) return bucketResult(5);
  return bucketResult(6);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { clubStrengths, nationStrengths, STRENGTH_BUCKETS, STRENGTH_LABELS };
}
