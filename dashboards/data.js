// data.js
import leagueData from './league.json' with { type: 'json' };

// Also expose globally so existing non-module code can still access it seamlessly
window.leagueDatabase = leagueData;

// Nationalities Lookup Database
const nationalitiesDatabase = {
  "AKC": { name: "Akach", flag: "https://nssportwiki.com/images/3/3d/AkachFlag.svg" },
  "CBR": { name: "Cobrio", flag: "https://nssportwiki.com/images/thumb/4/43/Flag_of_Cobrio.png/300px-Flag_of_Cobrio.png" },
  "YUC": { name: "Yucatán", flag: "https://nssportwiki.com/images/thumb/e/ed/Flag_of_Yucatan.png/300px-Flag_of_Yucatan.png" }
};

// 1. PHYSICAL GRID DEFINITIONS (Single Source of Truth)
const basePitchCoordinates = {
  // Goalkeeper
  "GK":   { x: 50, y: 88 },

  // Defenders (Y: 72)
  "LB":   { x: 18, y: 72 },
  "LCB":  { x: 36, y: 72 },
  "CB":   { x: 50, y: 72 },
  "RCB":  { x: 64, y: 72 },
  "RB":   { x: 82, y: 72 },

  // Defensive Midfielders (Y: 58)
  "LWB":  { x: 18, y: 58 },
  "DMLC": { x: 36, y: 58 },
  "DMC":  { x: 50, y: 58 },
  "DMRC": { x: 64, y: 58 },
  "RWB":  { x: 82, y: 58 },

  // Central Midfielders (Y: 44)
  "LM":   { x: 18, y: 44 },
  "LCM":  { x: 36, y: 44 },
  "CM":   { x: 50, y: 44 },
  "RCM":  { x: 64, y: 44 },
  "RM":   { x: 82, y: 44 },

  // Attacking Midfielders (Y: 28)
  "AML":  { x: 18, y: 28 },
  "AMLC": { x: 36, y: 28 },
  "AMC":  { x: 50, y: 28 },
  "AMRC": { x: 64, y: 28 },
  "AMR":  { x: 82, y: 28 },

  // Forwards / Wingers (Y: 12)
  "LW":   { x: 18, y: 12 },
  "FLC":  { x: 36, y: 12 },
  "CF":   { x: 50, y: 12 },
  "FRC":  { x: 64, y: 12 },
  "RW":   { x: 82, y: 12 }
};

// POSITION ALIAS LOOKUP MAP
const positionAliases = {
  "DL": "LB",
  "DLC": "LCB",
  "DC": "CB",
  "DRC": "RCB",
  "DR": "RB",
  "DML": "LWB",
  "DMR": "RWB",
  "ML": "LM",
  "MLC": "LCM",
  "MC": "CM",
  "MRC": "RCM",
  "MR": "RM",
  "FL": "LW",
  "FC": "CF",
  "ST": "FC",
  "FR": "RW"
};
	
const leagueConfig = {
  name: "Ligue Akach",
  motto: "Official Squad Hub",
  logo: "https://placehold.co/300/013220/ffd700?text=LAK",
  colors: { primary: "#013220", secondary: "#ffd700", accent: "#c00000" },
  defaults: { staffOverheadAnnual: 2.50 }
};

const competitions = {
  "league-title": { 
	name: "Ligue Akach", 
	code: "LAK", 
	trophyImg: "https://placehold.co/40x40/d69e2e/000000?text=LAK",
	color: "#d69e2e",
	textColor: "#000000"
  },
  "cup-winner": { 
	name: "Léopold Touré Shield", 
	code: "LTS", 
	trophyImg: "https://placehold.co/40x40/2563eb/ffffff?text=LTS",
	color: "#2563eb",
	textColor: "#ffffff"
  },
  "super-cup": { 
	name: "Karamu Plate", 
	code: "KP", 
	trophyImg: "https://placehold.co/40x40/b45309/ffffff?text=KP",
	color: "#b45309",
	textColor: "#ffffff"
  }
};
