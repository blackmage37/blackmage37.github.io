// Nationalities Lookup Database
const nationalitiesDatabase = {
  "AKC": { name: "Akach", flag: "https://nssportwiki.com/images/3/3d/AkachFlag.svg" },
  "CBR": { name: "Cobrio", flag: "https://nssportwiki.com/images/thumb/4/43/Flag_of_Cobrio.png/300px-Flag_of_Cobrio.png" },
  "YUC": { name: "Yucatán", flag: "https://nssportwiki.com/images/thumb/e/ed/Flag_of_Yucatan.png/300px-Flag_of_Yucatan.png" }
};

// Coordinate Map for Position Heatmap Nodes
const pitchCoordinates = {
  "GK":  { x: 50, y: 88 },
  "DL":  { x: 18, y: 72 },
  "DC":  { x: 50, y: 72 },
  "DR":  { x: 82, y: 72 },
  "DML": { x: 18, y: 58 },
  "DMC": { x: 50, y: 58 },
  "DMR": { x: 82, y: 58 },
  "ML":  { x: 18, y: 44 },
  "MC":  { x: 50, y: 44 },
  "MR":  { x: 82, y: 44 },
  "AML": { x: 18, y: 28 },
  "AMC": { x: 50, y: 28 },
  "AMR": { x: 82, y: 28 },
  "ST":  { x: 50, y: 12 },
  "CF":  { x: 50, y: 12 },
  "FL":  { x: 18, y: 16 },
  "FR":  { x: 82, y: 16 },
  "LW":  { x: 18, y: 24 },
  "RW":  { x: 82, y: 24 }
};

// League Configuration
const leagueConfig = {
  name: "Ligue Akach",
  motto: "Official Squad Hub",
  logo: "https://placehold.co/300/013220/ffd700?text=LAK",
  colors: { primary: "#013220", secondary: "#ffd700", accent: "#c00000" },
  defaults: { staffOverheadAnnual: 2.50 }
};

// Competitions Dictionary
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

// Main Team & Squad Database
const leagueDatabase = {
  "dubisha-flames": {
    name: "Dubisha Flames",
    nickname: "The Flames",
    motto: "Branded by Glory",
    crest: "https://placehold.co/300/12853F/ffffff?text=DBF",
    stadium: { 
      name: "Parc des Sports", 
      capacity: 12500, 
      rating: 3,
      photo: "https://www.si.com/.image/t_share/MTY4MjYxMzY3MjQ4NTI4NTQ5/free-state-stadium-mangaungbloemfontain.jpg"
    },
    sponsor: { 
      name: "Onina", 
      sector: "Manufacturing",
      logo: "https://nssportwiki.com/images/9/9f/Onina.png"
    },
    colors: { primary: "#12853F", secondary: "#000000", accent: "#E31B23" },
    stats: { rank: 1 },
    honours: { 
      "league-title": [1, 2, 3, 5, 7],
      "cup-winner": [3, 4, 6, 8],
      "super-cup": [2, 3, 5, 6, 7]
    },
    staff: {
      "top-boss": {
        title: "Owner",
        name: "Théophile SAMUEL",
        nat: "AKC",
        age: 62
      },
      senior: {
        "manager": {
          name: "Benoît PHILLIPS",
          nat: "AKC",
          nat2: "CBR",
          age: 46
        },
        "asst-manager": {
          name: "Jordain AL-SAMPA",
          nat: "AKC",
          age: 27
        }
      },
      youth: { 
        "manager": {
          name: "Constantin MABRUNO",
          nat: "AKC",
          age: 40
        }
      }
    },
    squad: [
      { player_id: "A8725", num: 1, name: "Mikaël ROCHETEAU", nat: "AKC", gender: "M", primaryPos: "GK", age: 29, rating: 77, isStarter: true, squadStatus: "First XI", archetype: "Stopper", wage: 1.20, positions: { "GK": 100 } },
      { player_id: "A8728", num: 3, name: "Randall HUFF", nat: "AKC", gender: "M", primaryPos: "DL", age: 29, rating: 68, isStarter: true, squadStatus: "First XI", archetype: "Cultured", wage: 0.79, positions: { "DL": 100, "DC": 75 } },
      { player_id: "A8611", num: 4, name: "Nathan LANDU", nat: "AKC", gender: "M", primaryPos: "MC", age: 31, rating: 77, isStarter: false, squadStatus: "Veteran", archetype: "Disruptor", wage: 0.61, positions: { "MC": 100 } },
      { player_id: "A8405", num: 5, name: "Charly BOUTELLA", nat: "AKC", gender: "M", primaryPos: "DC", age: 33, rating: 72, isStarter: true, squadStatus: "First XI", captainOrder: 1, archetype: "Instinctive", wage: 1.53, positions: { "DC": 100 } },
      { player_id: "A8619", num: 6, name: "Iraklis MUTOS", nat: "AKC", gender: "M", primaryPos: "DC", age: 30, rating: 73, isStarter: false, squadStatus: "Veteran", archetype: "Cultured", wage: 1.45, positions: { "DC": 100 } },
      { player_id: "F8601", num: 16, name: "Agustin MACIAS", nat: "YUC", nat2: "AKC", gender: "M", primaryPos: "DC", age: 30, rating: 73, isStarter: true, squadStatus: "Veteran", captainOrder: 2, archetype: "Athletic", wage: 2.00, positions: { "DC": 100 } },
      { player_id: "A9136", num: 7, name: "Yoann LUTIC", nat: "AKC", gender: "M", primaryPos: "FR", age: 25, rating: 76, isStarter: true, squadStatus: "Key Player", archetype: "Chalkfoot", wage: 1.53, positions: { "FR": 100, "AMR": 88, "CF": 65 } },
      { player_id: "A9417", num: 13, name: "Friday ENNUI", nat: "AKC", gender: "M", primaryPos: "CF", age: 22, rating: 81, isStarter: true, squadStatus: "Key Player", archetype: "Rapid", wage: 1.53, positions: { "CF": 100, "LW": 95, "RW": 95, "AML": 75, "AMR": 75 } },
      { player_id: "A9130", num: 8, name: "Avery ROBERTSON", nat: "AKC", gender: "M", primaryPos: "MC", age: 25, rating: 78, isStarter: true, squadStatus: "First XI", captainOrder: 3, archetype: "Dynamo", wage: 0.19, positions: { "MC": 100, "DMC": 65 } },
      { player_id: "A8618", num: 10, name: "Aïssatou BOUMEDIENNE", nat: "AKC", gender: "F", primaryPos: "AMC", age: 30, rating: 74, isStarter: false, squadStatus: "Veteran", archetype: "Penetrator", wage: 0.78, positions: { "AMC": 100, "MC": 80 } },
      { player_id: "A9018", num: 11, name: "Marie DOUIS", nat: "AKC", gender: "F", primaryPos: "FL", age: 27, rating: 86, isStarter: true, squadStatus: "Key Player", archetype: "Rapid", wage: 1.42, positions: { "FL": 100, "AML": 90 } },
      { player_id: "A8306", num: 12, name: "Abou LUMUMBA", nat: "AKC", gender: "M", primaryPos: "GK", age: 33, rating: 64, isStarter: false, squadStatus: "Backup", archetype: "Acrobat", wage: 0.89, positions: { "GK": 100 } },
      { player_id: "A8903", num: 14, name: "Von VIGIL", nat: "AKC", gender: "M", primaryPos: "FL", age: 28, rating: 69, isStarter: false, squadStatus: "Veteran", archetype: "Harrier", wage: 1.62, positions: { "FL": 100, "CF": 70, "AML": 70 } },
      { player_id: "A9416", num: 17, name: "Léontine THÉPOT", nat: "AKC", gender: "F", primaryPos: "FR", age: 22, rating: 67, isStarter: false, squadStatus: "Backup", archetype: "Rapid", wage: 1.14, positions: { "FR": 100, "AMR": 70 } },
      { player_id: "A8913", num: 18, name: "Alfred BOUMEDIENNE", nat: "AKC", gender: "M", primaryPos: "DR", age: 27, rating: 68, isStarter: true, squadStatus: "Veteran", archetype: "Winguardian", wage: 1.19, positions: { "DR": 100, "DL": 85 } },
      { player_id: "A8729", num: 19, name: "Angélina MUKÒSI", nat: "AKC", gender: "F", primaryPos: "MC", age: 29, rating: 78, isStarter: true, squadStatus: "Prospect", archetype: "Metronome", wage: 1.75, positions: { "MC": 100, "ML": 85, "DMC": 60 } },
      { player_id: "A9406", num: 26, name: "Perle MARTINI", nat: "AKC", gender: "F", primaryPos: "AMC", age: 23, rating: 69, isStarter: false, squadStatus: "Rotation", archetype: "Penetrator", wage: 0.21, positions: { "AMC": 100, "AMR": 85 } },
      { player_id: "X9601", num: 23, name: "Dieumerci POURRIEN", nat: "AKC", gender: "X", primaryPos: "AMC", age: 22, rating: 91, isStarter: true, squadStatus: "Key Player", archetype: "Advancer", wage: 1.65, positions: { "AMC": 100, "AMR": 98, "AML": 95, "CF": 85, "LW": 90, "RW": 90 } }
    ],
    fixtures: [
	  { opponent: "FC Rockbridge", venue: "Neutral", date: "2026-08-09", competition: "KP" },
	  { opponent: "Cheboygan Iron", venue: "Home", date: "2026-08-15", competition: "LAK" },
	  { opponent: "Emekula Phoenix", venue: "Away", date: "2026-08-22", competition: "LTS" }
    ]
  }
};