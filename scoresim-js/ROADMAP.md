# ScoreSim — Roadmap

Status key: 🔲 not started · 🟡 in design · ✅ done

This document tracks planned changes to the vanilla JS port (`scoresim-js/`).
Findings from the engine audit are recorded under each item so decisions can be made with the data in front of us.

---

## Baseline (current state, measured)

Measured with `createMatchEngine` over 3,000 matches per row, crowd = 0, morale = 2/2, tactics = 1/1:

| Strength (H/A) | Home win | Draw | Away win | Avg total goals | Avg shots (both) |
|---|---|---|---|---|---|
| 30/70 | 8.4% | 20.5% | 71.1% | 2.49 | 26.8 |
| 40/60 | 18.2% | 27.4% | 54.4% | 2.18 | 26.8 |
| 45/55 | 26.0% | 26.9% | 47.1% | 2.23 | 26.6 |
| 50/50 | 34.1% | 29.2% | 36.6% | 2.07 | 25.4 |
| 55/45 | 47.5% | 27.6% | 24.9% | 2.18 | 26.6 |
| 60/40 | 55.2% | 26.3% | 18.5% | 2.25 | 26.5 |
| 70/30 | 72.2% | 19.6% | 8.2% | 2.47 | 26.6 |

### Observations

1. **Strength is not symmetric at 50/50.** With no crowd bonus, the away side wins 36.6% and the home side 34.1%. The gap is about 2.5 points on 3,000 matches, roughly 2 standard errors, so it needs confirming with a larger run. Probable causes to check: home-only crowd and morale terms, and the order of the shot and foul rolls. The earlier docs note about a "mild home edge" was based on the default crowd setting and should be treated as unverified.
2. **Goal totals sit below real-world averages.** The average is about 2.1–2.5 goals per match. Top-flight football is around 2.6–2.8. Item 3 covers making this tunable.
3. **Strength is not clamped.** `createMatchEngine({homeStrength: 90, awayStrength: 90})` is accepted without complaint and produces inflated goal chances. Nothing validates that the pair sums to 100 or that each value is within 30–70.
4. **Custom strength is only reachable through code.** The UI offers the seven fixed buckets. Arbitrary values would need the editor (item 6) or the options page (item 3).
5. **Extremes are very lopsided.** At 30/70 the stronger side wins 71% of matches, which is a large swing for a linear strength input. Strength needs a nonlinear mapping to win probability (item 5).
6. **Morale is unbounded.** It rises on every shot on target and every goal, and the red-card and possession paths move it proportionally. Over a long match it can grow well beyond the 0–4 setup range, which quietly inflates the goal formula `(strength + morale + crowd) / 100`.

---


## Current status (latest)

### Completed
- ✅ **Morale clamp and decay** (item 4): morale bounded 0–10, decays 2%/minute toward setup value.
- ✅ **Strength normalisation** (part of item 5): custom strengths are converted to shares; 10.93/7.31 now behaves like its 60/40 equivalent.
- ✅ **Continuous tactics formula**: removes the discontinuity at equal tactics; symmetric.
- ✅ **Shot-volume mapping** (sqrt share, option B): softens the underdog's shot share.
- ✅ **50/50 asymmetry** investigated: noise, confirmed by mirror tests on fresh seeds.
- ✅ **Calibration to locked targets** (item 5, 70/30 matchup).
- ✅ **Goal-rate presets** (new, replaces the single goal-rate setting): low / medium / high.

### Locked calibration targets (agreed)
| Target | Band | Status |
|---|---|---|
| 70/30 favourite win | 63–68% | met (low preset 63.6–64.0%) |
| 70/30 underdog win | 13–17% | met (low preset 13.4–13.7%) |
| 50/50 home/away symmetry | within noise | met (gap under 1 point, mirror tests) |

### Goal-rate presets (measured)
Each preset was checked on fresh seeds (30,000 matches) against the locked bands. The divisor and floor trade off: a lower divisor raises goal totals and the favourite's share, and a higher floor lifts the underdog and goals together.

| Preset | Divisor | Floor | 50/50 goals/match | 70/30 favourite | 70/30 underdog | Status |
|---|---|---|---|---|---|---|
| low | 1.4 | 0.20 | 2.18 | 64.0% | 13.4% | in band |
| medium | 1.2 | 0.25 | 2.46 | 65.0% | 14.6% | in band |
| high | 1.0 | 0.30 | 2.85 | 66.5% | 15.2% | in band |

Real-world reference (top-flight football): about 2.6–2.8 goals per match, so **medium** and **high** sit at or near that range, while **low** sits below it. Goal rate is now a user-facing option, not a fixed value.

**Default preset: medium** (set by agreement). Its 50/50 goal average (2.46) is slightly below the 2.6–2.8 real-world reference, so the goal-average todo in the balance suite stays open.

### Deferred
- **Non-neutral settings** (crowd support, morale extremes, tactics extremes): not yet measured against the locked bands. Deferred by agreement.
- **Balanced goal average as a todo** (balance suite): will be promoted to a test once a preset is chosen as the default.
- **Known data gaps**: Omonia 29is Maiou has no logo; FIFA ranks 14 and 82 are each shared by two nations.

## Roadmap items

### 1. 🔲 Display RNG seed with result (reproducibility)
- Generate a seed per match (32-bit integer) and display it on the result screen. Users can enter a seed to replay that match.
- Use a seedable PRNG (e.g. mulberry32) in place of `Math.random`. The engine already accepts an injectable `rng`, so the change is mostly in `ui.js`.
- **Must preserve:** pre-match random values (crowd "random", morale "random", tactics "random", venue pick) must also come from the seeded RNG, or replay will not match.
- **Decision needed:** should the seed reproduce the whole match, including setup randomness, or only the simulation? Recommendation: the whole match, so one seed is enough to reproduce everything.

### 2. 🔲 Test suite
- Node-based tests using the built-in `node:test` module (Node 18+), with no framework dependency, in `scoresim-js/tests/`.
- Coverage targets:
  - Strength derivation buckets (club and nation branches, boundary values).
  - Engine invariants: scores never negative, possession sums to 100, no player gets more than two yellows, sent-off players are removed from the lineup, every match finishes, second-leg aggregate logic, and penalty shootouts always produce a winner.
  - Seeded determinism: the same seed gives an identical result.
  - Regression checks for each bug listed in `docs.html`.
  - Statistical tests with tolerance bands (e.g. a 50/50 home win rate within a range over N seeded runs) to catch balance regressions.
- Write this before items 4–8 so changes can be checked against the baseline table above.

### 3. 🔲 Config options page
- A separate `config.html` with inputs for tunable constants, saved to `localStorage` and loaded by the engine at construction.
- Candidate constants, grouped:
  - **Goal rate:** goal-chance divisor (`1.5 + rand`), shot accuracy range (0.1–0.5).
  - **Discipline:** yellow probability (1/7), straight red probability (1/500), post-red strength penalty (9%).
  - **Shots and fouls:** potential shots scaling (`/90`), potential fouls base (20–27).
  - **Morale:** per-shot and per-goal morale increments, and a cap.
  - **Clock:** injury-time range, half-time length.
- Include a "reset to defaults" button and a live preview (run N simulations, show average goals and win/draw/loss) so users can see the effect of a change.
- Store the config used with each match, so a seed plus config reproduces the result (ties into item 1).

### 4. 🔲 Clamp / bound morale
- Options under consideration:
  - **Hard clamp** to the setup range (0–4), or a wider band such as 0–10.
  - **Soft decay:** morale drifts back toward its starting value each minute, so it cannot run away.
  - **Diminishing returns:** increments shrink as morale approaches the cap.
- Measure the morale distribution at full time before choosing. Recommendation: soft decay plus a 0–10 clamp, then re-run the baseline table.


### 5. 🔲 Strength input handling and probability balance
- Replace the linear `strength / 100` usage with a documented mapping from relative strength to match probabilities. Target real-world calibration, so that a 70/30 match does not give the weaker side only 8%.
- Add validation: values must be within a declared range, and the pair must sum to 100 or be normalised by the engine.
- Fix the 50/50 home/away asymmetry from Observation 1 before tuning anything else, then re-measure with 20,000+ matches.
- Deliverable: a calibration table (target vs. measured win/draw/loss for each bucket), kept in `docs.html`.

### 6. 🔲 In-browser team and lineup editor
- An editor page to create and edit custom teams: name, logo URL, venue, strength, morale and squad.
- Squad: 11 starters plus substitutes, each with name, position and goalscoring weight (item 8).
- Storage: `localStorage`, with import and export as JSON files, so custom teams can be shared without a server.
- Validation: exactly 11 starters, at least one goalkeeper, unique names, and a sensible positional split.

### 7. 🔲 Substitution logic
- Trigger points: half time, after a goal, after a red card, and late in the game.
- Decision inputs:
  - **Score state:** a losing side is more likely to bring on attacking players, and a winning side defensive ones.
  - **Game time:** substitutions become more likely after about the 60th minute, within a fixed number of windows (3 in most modern competitions).
  - **Tactical approach:** the team's tactics setting (defensive to attacking) changes which positions are chosen. Example: when losing at half time, an attacking team is more likely to bring on a forward for a midfielder or defender.
- Engine effects: the substitute replaces a player in the lineup, a substitute's goal weight applies once they are on, and the event is logged for the UI.
- Open questions: maximum number of substitutions, whether injuries are modelled, and whether bench quality should depend on squad depth.

### 8. 🔲 Goalscorer weighting as a player property
- Add a `goalWeight` (or `scoringShare`) field to each player. The current behaviour is equivalent to every outfield player having weight 1.
- Scorer selection becomes a weighted random draw over the players on the pitch. Goalkeepers default to weight 0 but can be configured.
- **Open question: substitutes.** If weights are per player, a substitute's weight only counts after they come on, so the total weight on the pitch changes during a match. Options:
  - (a) Use only on-pitch weights, renormalised each time. Simple and realistic.
  - (b) Use a team-level scoring rate that is split across on-pitch players by weight. This keeps the goal rate stable when substitutions happen.
  - (c) Give substitutes a reduced weight for their first minutes.
  Recommendation: (b), so a substitution changes who scores but not how often the team scores.
- Default weights come from position (forwards highest, defenders lowest), so existing rosters behave sensibly.

---

## Suggested order

1. Test suite (item 2): establishes the baseline measured above as regression protection.
2. Morale clamp (item 4) and the 50/50 asymmetry investigation (part of item 5).
3. Strength calibration (item 5), then the seeded RNG (item 1), since calibration results should be reproducible.
4. Goalscorer weights (item 8) and substitutions (item 7), which share the lineup data model.
5. Editor (item 6) and options page (item 3), which expose the constants and data built above.

## Open questions for discussion

- Should the 50/50 asymmetry be treated as a bug or as an intentional home/away convention? The current code gives the home side extra crowd and shot terms, so an away edge at equal strength is unexpected.
- Target goal average: real-world calibration (~2.7), or a configurable default?
- Should match results be saved and shared (for example, via a seed in the URL), or is displaying the seed enough?
