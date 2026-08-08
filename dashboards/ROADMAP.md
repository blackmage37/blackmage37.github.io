# 🗺️ League Dashboard — Project Roadmap

Welcome to the **League Dashboard** development roadmap. This document outlines planned feature additions, structural layout refinements, data algorithms, and upcoming module extensions for the project.

---

## 📌 Status Overview

| Phase | Focus Area | Status | Progress
| :--- | :--- | :--- | :---
| **Phase 1** | Core Layout, UI Scaling & Dynamic Contrast | 🟡 In Progress | 🟢🟢🔴
| **Phase 2** | Squad Roster Enhancements & Data Formatting | 🔴 Planned | 🔴🟢🟢🟢🔴🔴🟢
| **Phase 3** | Financial Engine & Valuations | 🔴 Planned | 🔴🔴
| **Phase 4** | Advanced Squad Analytics & Attribute Schema | 🔴 Planned | 🔴🔴🔴🔴🔴
| **Phase 5** | Tactical & Transfer Market Side Widgets | 🔴 Planned | 🔴🔴🔴
| **Phase 6** | Expanded Hub Ecosystem (addition of standalone pages) | 🔴 Planned | 🔴🔴🔴
| **Phase 7** | Full Integration with Ikenga (full simulation software) | 🔴 Planned | 🔴

---

## 🚀 Phases & Objectives

### 📐 Phase 1: Layout Scaling & Dynamic Contrast Auto-Tuning
> *Goal: Expand dashboard screen real estate, decouple static values, and guarantee 100% WCAG-compliant text readability regardless of dynamic team palettes.*

- [x] **1.1 Expanded Container Width**
  - Increase `<main>` container max-width (or convert to a flexible high-percentage layout) to take up significantly more window width on widescreen displays.
- [x] **1.2 Data-Driven Club Overview**
  - Bind all profile fields (`nickname`, `stadium.name`, `stadium.capacity`, `stadium.photo`, `staff.senior.manager`, `squad[captain]`, `sponsor.name`, `sponsor.logo`) dynamically to the active `leagueDatabase` object.
- [ ] **1.3 Universal Color-Pass Contrast Resolver**
  - Refactor all elements utilising secondary accent styling (`.card .label`, `h2`, `th`, active radio inputs) to calculate background-versus-text contrast dynamically via `getReadableTextColor(bgColor, preferredColor)`.

---

### ⚽ Phase 2: Squad Roster Enhancements & Visual Formatting
> *Goal: Improve table interactivity with dynamic sorting and visual metadata representations.*

- [ ] **2.1 Interactive Squad Table Sorting**
  - Add click-to-sort functionality on Squad Roster column headers:
    - Shirt Number (`#`), Name, Age, Rating, Nationality, Archetype, Wage, Value.
  - Implement a custom position priority map under the hood (e.g., `GK: 1, DC: 2, DL: 3, DR: 4...`) to allow logical pitch-order sorting for the Position column.
- [x] **2.2 Gender Symbols & Flag Integration**
  - **Gender Indicators:** Render a subtle gender symbol (e.g., ♂ / ♀) directly before player names.
  - **Trigramme Flag System:** Replace text-based nationality trigrammes (e.g., `AKC`, `CBR`) with local flag icons named after their trigramme code (e.g., `/flags/AKC.png`).
- [x] **2.3 Captain Armband Badge (`=C=`)** 🟡 [Proof of Concept](https://jsfiddle.net/chamber37/1gLj3oqp/)
  - Render a stylized captain's armband box (`=C=`) next to the team captain's name in the squad table.
  - Implement a dual-check resolver: evaluate `player.captainOrder` first, falling back to matching against `team.captain` metadata.
    - `1` for captain, `2` for vice-captain, etc. If the value is missing, default to `99` to ensure missing values don't break the hierarchy
  - Implement a matchday resolver function that assigns the `=C=` armband to the player with the lowest `captainOrder` rank present in any active starting XI lineup.
- [x] **2.4 Competition Tags in Fixtures**
  - Update the **Upcoming Fixtures** table to include a dedicated column displaying the relevant competition name (e.g., *Ligue Akach*, *Léopold Touré Shield*, *Karamu Plate* etc).
- [ ] **2.5 Stat Leader Widgets**
  - Add top scorer, most assists, etc as cards at the top of the page.
    - Card header: Stat
    - Below left: Player portrait
    - Below right: Player name and count/value
- [ ] **2.6 Add Quota/Cap Trackers**
  - Add a widget at the top to show graph bars representing rules and restrictions, using green/amber/red indicators for statuses:
    * Percentage of salary cap used 
    * Number of overseas players 
    * Number of homegrown / club-trained players 
- [x] **2.7 Advanced Position Map & Proficiency Heatmap Tooltip** 🟡 [Proof of Concept](https://jsfiddle.net/chamber37/1gLj3oqp/)
  - Refactor player position attributes into a structured map (`positions: { "DC": 100, "DR": 75 }`).
  - Render a primary position tag in the squad table with an interactive hover tooltip displaying a miniature pitch diagram.
  - Colour-code position nodes on the pitch map based on proficiency ratings:
    - 🟢 **Green** ($85\text{--}100$): Natural
    - 🟡 **Amber** ($65\text{--}84$): Accomplished
    - 🟠 **Red** ($45\text{--}64$): Emergency
---

### 💰 Phase 3: Financial Engine & Player Valuation Algorithm
> *Goal: Introduce realistic player valuations and aggregate team financial analytics.*

- [ ] **3.1 Player Valuation Estimator**
  - Implement the player valuation formula derived from the [Player Value Estimator](https://docs.google.com/spreadsheets/d/1EmzH6rvWbmbhd1jfDfwxDGr64uxJDb-jNggAMuj3gYQ/edit?gid=211504365#gid=211504365) logic.
- [ ] **3.2 Squad Value Summary Card**
  - Add a dedicated **Total Squad Value** KPI card to the top stats grid, summing all individual player market estimates dynamically.

---

### 📊 Phase 4: Advanced Squad Analytics & Attribute Schema
> *Goal: Expand player data models to support sub-attributes and visual squad breakdown widgets.*

- [ ] **4.1 Dynamic Player Age Calculation**
  - Store date of birth in database object rather than "age" for dynamic age calculation
- [ ] **4.2 Player Attribute Schema Extension**
  - Expand squad player objects in `leagueDatabase` to include core sub-attributes ($0\text{--}99$ scale):
    - ⚡ **SPD** (Speed) | 🎯 **TEC** (Technique) | ⚽ **PAS** (Passing)
    - 🥅 **SHO** (Shooting) | 🛡️ **DEF** (Defending) | 💪 **STR** (Strength)
- [ ] **4.3 Interactive Player Attribute Drawer**
  - Add expandable row drawers or modal overlays to view individual player attribute cards.
  - Add gradient colour to player overall ratings in the squad table, and each attribute in the expandable drawer
- [ ] **4.4 Squad Strengths Widget (DEF / MID / ATK)**
  - Add a side widget calculating sector ratings across **Defense**, **Midfield**, and **Attack** rendered using animated horizontal progress bars.
- [ ] **4.5 Squad Attribute Radar Chart**
  - Implement a canvas/SVG radar chart displaying overall squad averages across the 6 core attributes.

---

### 📋 Phase 5: Tactical & Transfer Market Side Widgets
> *Goal: Populate the secondary column (`.side-col`) with interactive matchday, tactical, and transfer news feeds.*

- [ ] **5.1 Tactical Pitch & Starting XI Widget**
  - Build an interactive pitch diagram displaying default team formations (e.g., 4-3-3, 4-2-3-1) with dynamic player position markers.
- [ ] **5.2 Transfers Widget**
  - Build a widget displaying squad changes (first team only?)
  - Green for incoming, Red for outgoing. { Player Name, Relevant Club Icon, Fee }
- [ ] **5.3 Transfer Rumours Feed Widget**
  - Extend database schema to support a `rumours` array (`{ player, targetClub, likelihood, estimatedFee, type }`) and render a compact side-column feed card.

---

### 🌐 Phase 6: Standalone Hub Page Extensions
> *Goal: Expand the dashboard into a multi-page web application linked seamlessly from the central hub.*

- [ ] **6.1 Matchday Dashboard (`/matches/01LAK0403.html`)**
  - *Triggered via:* `Preview Match →` on the Next Match widget.
  - Each page named for the season, competition, round, and match number
    - e.g. `01LAK0101`:
      * `01` - Season 1
      * `LAK` - Ligue Akach
      * `04` - Matchday 4
      * `03` - Third listed match on that day
  - *Features:* Head-to-head (H2H) records, form guides, detailed pre-match tactical matchups, venue details, and match odds.
  - Post match, this can contain stats, shot maps, etc using the data provided by the match engine via StatsBomb open data format
- [ ] **6.2 Transfer Hub Dashboard (`transfers.html`)**
  - *Triggered via:* `View All Rumours →` on the Rumours widget **OR** `View All Transfers` on the Transfers widget
  - *Features:* Completed transfers feed, league-wide transfer list, and filterable rumour mill.
  - Consider archiving this page after each transfer window to allow a historic reference (an associated historical index page will be needed for navigation).
- [ ] **6.3 Individual Player Pages (`players/A95001.html`)**
  - *Triggered via:* `Squad Table →` Click on the player name.
  - Each page named for the player ID in the database
  - *Features:* Overall stats, Appearances table, Position proficiency map, Club history table, Transfer value history line graph
  
---

## 🛠️ Tech Stack & Conventions

* **Core:** HTML5, CSS3 (CSS Variables, Flexbox, CSS Grid), Vanilla JavaScript (ES6+)
* **Dependencies:** None (Zero external framework overhead; possible pivot to SQLite database?)
* **Assets:** Local Trigramme Flags (`/flags/{ISO}.png`), Local Club Icons (`/icons/`), Local Stadium Images (`/stadia/`)
* **Design Principles:** Mobile-First Responsive Design, High Contrast / Accessible Colour Computation

---

*Note: Feature priorities and technical specifications are subject to revision as development progresses.*
