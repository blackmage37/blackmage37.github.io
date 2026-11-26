'use strict';
/**
 * Shared test helpers.
 * mulberry32 gives a seeded, repeatable random sequence, so statistical
 * tests produce the same numbers on every run.
 */

const { mulberry32 } = require('../js/rng.js');

/** Simulate one full match with the given config and seed. */
function runMatch(config, seed) {
  const { createMatchEngine } = require('../js/engine.js');
  return createMatchEngine(config, mulberry32(seed)).simulateToEnd();
}

module.exports = { mulberry32, runMatch };
