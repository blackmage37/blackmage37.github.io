/**
 * ScoreSim — seeded random number generation.
 *
 * Every match gets one 32-bit seed. The same seed plus the same settings
 * reproduces the same match exactly, so a seed can be shared for verification.
 * mulberry32 is used because it is small, fast and has no dependencies.
 */
'use strict';

/** Returns a function that yields floats in [0, 1) for the given 32-bit seed. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh random 32-bit seed, e.g. for a new match. */
function newSeed() {
  const buf = new Uint32Array(1);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    buf[0] = Math.floor(Math.random() * 4294967296);
  }
  return buf[0];
}

/** Parse a user-entered seed string. Returns null if it is not a valid seed. */
function parseSeed(text) {
  const s = String(text).trim();
  if (!/^\d{1,10}$/.test(s)) return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 && n <= 0xffffffff ? n : null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { mulberry32, newSeed, parseSeed };
}
