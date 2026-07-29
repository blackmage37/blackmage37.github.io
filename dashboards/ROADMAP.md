# 🗺️ Ligue Akach Dashboard — Project Roadmap

Welcome to the **Ligue Akach Dashboard** development roadmap. This document outlines planned feature additions, structural layout refinements, data algorithms, and upcoming module extensions for the project.

---

## 📌 Status Overview

| Phase | Focus Area | Status |
| :--- | :--- | :--- |
| **Phase 1** | Core Layout, UI Scaling & Dynamic Contrast | 🟡 In Progress |
| **Phase 2** | Squad Roster Enhancements & Data Formatting | 🔴 Planned |
| **Phase 3** | Financial Engine & Valuations | 🔴 Planned |
| **Phase 4** | Advanced Squad Analytics & Attribute Schema | 🔴 Planned |
| **Phase 5** | Tactical & Transfer Market Side Widgets | 🔴 Planned |
| **Phase 6** | Expanded Hub Ecosystem (Standalone Pages) | 🔴 Planned |

---

## 🚀 Phases & Objectives

### 📐 Phase 1: Layout Scaling & Dynamic Contrast Auto-Tuning
> *Goal: Expand dashboard screen real estate, decouple static values, and guarantee 100% WCAG-compliant text readability regardless of dynamic team palettes.*

- [ ] **1.1 Expanded Container Width**
  - Increase `<main>` container max-width (or convert to a flexible high-percentage layout) to take up significantly more window width on widescreen displays.
- [ ] **1.2 Data-Driven Club Overview**
  - Bind all profile fields (`nickname`, `stadium.name`, `stadium.capacity`, `stadium.photo`, `staff.senior.manager`, `squad[captain]`, `sponsor.name`, `sponsor.logo`) dynamically to the active `leagueDatabase` object.
- [ ] **1.3 Universal Color-Pass Contrast Resolver**
  - Refactor all elements utilizing secondary accent styling (`.card .label`, `h2`, `th`, active radio inputs) to calculate background-versus-text contrast dynamically via `getReadableTextColor(bgColor, preferredColor)`.

---

### ⚽ Phase 2: Squad Roster Enhancements & Visual Formatting
> *Goal: Improve table interactivity with dynamic sorting and visual metadata representations.*

- [ ] **2.1 Interactive Squad Table Sorting**
  - Add click-to-sort functionality on Squad Roster column headers:
    - Shirt Number (`#`), Name, Age, Rating, Archetype, Wage, Value.
  - Implement a custom position priority map under the hood (e.g., `GK: 1, DC: 2, DL: 3, DR: 4...`) to allow logical pitch-order sorting for the Position column.
- [ ] **2.2 Gender Symbols & Flag Integration**
  - **Gender Indicators:** Render a subtle gender symbol (e.g., ♂ / ♀) directly before player names.
  - **Trigramme Flag System:** Replace text-based nationality trigrammes (e.g., `AKC`, `ENG`) with local flag icons named after their trigramme code (e.g., `/flags/AKC.png`).
- [ ] **2.3 Competition Tags in Fixtures**
  - Update the **Upcoming Fixtures** table to include a dedicated column displaying the relevant competition name (e.g., *Ligue Akach*, *Léopold Touré Shield*, *Karamu Plate*).

---

### 💰 Phase 3: Financial Engine & Player Valuation Algorithm
> *Goal: Introduce realistic player valuations and aggregate team financial analytics.*

- [ ] **3.1 Player Valuation Estimator**
  - Implement the player valuation formula derived from the *Google Sheets Player Value Estimator* logic, factoring in Rating, Age, Position, and Archetype weighting.
- [ ] **3.2 Squad Value Summary Card**
  - Add a dedicated **Total Squad Value** KPI card to the top stats grid, summing all individual player market estimates dynamically.

---

### 📊 Phase 4: Advanced Squad Analytics & Attribute Schema
> *Goal: Expand player data models to support sub-attributes and visual squad breakdown widgets.*

- [ ] **4.1 Player Attribute Schema Extension**
  - Expand squad player objects in `leagueDatabase` to include core sub-attributes ($0\text{--}99$ scale):
    - ⚡ **SPD** (Speed) | 🎯 **TEC** (Technique) | ⚽ **PAS** (Passing)
    - 🥅 **SHO** (Shooting) | 🛡️ **DEF** (Defending) | 💪 **STR** (Strength)
- [ ] **4.2 Interactive Player Attribute Drawer**
  - Add expandable row drawers or modal overlays to view individual player attribute cards.
- [ ] **4.3 Squad Strengths Widget (DEF / MID / ATK)**
  - Add a side widget calculating sector ratings across **Defense**, **Midfield**, and **Attack** rendered using animated horizontal progress bars.
- [ ] **4.4 Squad Attribute Radar Chart**
  - Implement a canvas/SVG radar chart displaying overall squad averages across the 6 core attributes.

---

### 📋 Phase 5: Tactical & Transfer Market Side Widgets
> *Goal: Populate the secondary column (`.side-col`) with interactive matchday, tactical, and transfer news feeds.*

- [ ] **5.1 Tactical Pitch & Starting XI Widget**
  - Build an interactive pitch diagram displaying default team formations (e.g., 4-3-3, 4-2-3-1) with dynamic player position markers.
- [ ] **5.2 Transfer Rumours Feed Widget**
  - Extend database schema to support a `rumours` array (`{ player, targetClub, likelihood, estimatedFee, type }`) and render a compact side-column feed card.

---

### 🌐 Phase 6: Standalone Hub Page Extensions
> *Goal: Expand the dashboard into a multi-page web application linked seamlessly from the central hub.*

- [ ] **6.1 Matchday Dashboard (`matchday.html`)**
  - *Triggered via:* `Preview Match →` on the Next Match widget.
  - *Features:* Head-to-head (H2H) records, form guides, detailed pre-match tactical matchups, venue details, and match odds.
- [ ] **6.2 Transfer Hub Dashboard (`transfers.html`)**
  - *Triggered via:* `View All Rumours →` on the Transfer Feed widget.
  - *Features:* Completed transfers feed, league-wide transfer list, and filterable rumour mill.

---

## 🛠️ Tech Stack & Conventions

* **Core:** HTML5, CSS3 (CSS Variables, Flexbox, CSS Grid), Vanilla JavaScript (ES6+)
* **Dependencies:** None (Zero external framework overhead)
* **Assets:** Local Trigramme Flags (`/flags/{ISO}.png`)
* **Design Principles:** Mobile-First Responsive Design, High Contrast / Accessible Color Computation

---

*Note: Feature priorities and technical specifications are subject to revision as development progresses.*