# 🗺️ Ligue Akach Dashboard — Project Roadmap

Welcome to the **Ligue Akach Dashboard** development roadmap. This document outlines the planned feature additions, structural updates, and upcoming module extensions for the project.

---

## 📌 Status Overview

| Phase | Focus Area | Status |
| :--- | :--- | :--- |
| **Phase 1** | Core Engine & Dynamic Contrast Auto-Tuning | 🟡 In Progress |
| **Phase 2** | Deep Squad Analytics & Attribute Extension | 🔴 Planned |
| **Phase 3** | Tactical & Transfer Market Side Widgets | 🔴 Planned |
| **Phase 4** | Expanded Hub Ecosystem (Standalone Pages) | 🔴 Planned |

---

## 🚀 Phases & Objectives

### 🧩 Phase 1: Core Engine & Contrast Auto-Tuning
> *Goal: Fully decouple components from static values and guarantee 100% WCAG-compliant text readability regardless of dynamic team palettes.*

- [ ] **1.1 Data-Driven Club Overview**
  - Fully decouple the **Club Overview** component from hardcoded fallback values.
  - Bind all profile fields (`nickname`, `stadium.name`, `stadium.capacity`, `stadium.photo`, `staff.senior.manager`, `squad[captain]`, `sponsor.name`, `sponsor.logo`) dynamically to the active `leagueDatabase` object.
- [ ] **1.2 Universal Color-Pass Contrast Resolver**
  - Refactor all text utilizing secondary accent styling (`.card .label`, `h2`, `th`, active radio inputs) to calculate background-versus-text contrast dynamically via `getReadableTextColor(bgColor, preferredColor)`.
  - Ensure contrast updates seamlessly during live team switches without breaking custom color branding.

---

### 📊 Phase 2: Deep Squad Analytics & Attribute Schema
> *Goal: Expand player data models to support sub-attributes and visual squad breakdown widgets.*

- [ ] **2.1 Player Attribute Schema Extension**
  - Expand squad player objects in `leagueDatabase` to include core sub-attributes ($0\text{--}99$ scale):
    - ⚡ **SPD** (Speed)
    - 🎯 **TEC** (Technique)
    - ⚽ **PAS** (Passing)
    - 🥅 **SHO** (Shooting)
    - 🛡️ **DEF** (Defending)
    - 💪 **STR** (Strength)
- [ ] **2.2 Interactive Squad Table Attribute Drawer**
  - Add expandable row drawers or modal overlays to view individual player attribute cards.
- [ ] **2.3 Squad Strengths Widget (DEF / MID / ATK)**
  - Add a side widget calculating sector ratings across **Defense** (GK/DC/DL/DR), **Midfield** (MC/DM/AM/ML/MR), and **Attack** (ST/FC/FL/FR).
  - Render sector scores using animated horizontal progress bars styled in active team colors.
- [ ] **2.4 Squad Attribute Radar Chart**
  - Implement a canvas/SVG radar chart displaying overall squad averages across the 6 core attributes (SPD, TEC, PAS, SHO, DEF, STR).

---

### 📋 Phase 3: Tactical & Transfer Market Side Widgets
> *Goal: Populate the secondary column (`.side-col`) with interactive matchday, tactical, and transfer news feeds.*

- [ ] **3.1 Tactical Pitch & Starting XI Widget**
  - Build an interactive pitch diagram widget displaying default team formations (e.g., 4-3-3, 4-2-3-1).
  - Dynamically position player tags on the pitch graphic based on squad data.
- [ ] **3.2 Transfer Rumours Feed Widget**
  - Extend database schema to support a `rumours` array (`{ player, targetClub, likelihood, estimatedFee, type }`).
  - Build a compact side-column feed highlight card with probability meters.

---

### 🌐 Phase 4: Standalone Hub Page Extensions
> *Goal: Expand the dashboard into a multi-page web application linked seamlessly from the central hub.*

- [ ] **4.1 Matchday Dashboard (`matchday.html`)**
  - *Triggered via:* `Preview Match →` on the Next Match widget.
  - *Features:* Head-to-head (H2H) records, form guides, detailed pre-match tactical matchups, venue details, and match odds.
- [ ] **4.2 Transfer Hub Dashboard (`transfers.html`)**
  - *Triggered via:* `View All Rumours →` on the Transfer Feed widget.
  - *Features:* 
    - **Completed Transfers:** League-wide incoming/outgoing deals and fees.
    - **Transfer List:** Available listed/loan players across all clubs.
    - **Rumour Mill:** Filterable rumour feed by credibility, club, or valuation.

---

## 🛠️ Tech Stack & Conventions

* **Core:** HTML5, CSS3 (CSS Variables, Flexbox, CSS Grid), Vanilla JavaScript (ES6+)
* **Dependencies:** None (Zero external framework overhead)
* **Design Principles:** Mobile-First Responsive Design, High Contrast / Accessible Color Computation

---

*Note: Feature priorities and technical specifications are subject to revision as development progresses.*