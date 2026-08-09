let currentWageMode = 'weekly';
let currentLoadedTeam = null;

function getContrastingTextColor(hexColor) {
  if (!hexColor) return '#ffffff';
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#0f172a' : '#ffffff';
}

function getReadableTextColor(bgColor, preferredTextColor) {
  if (!bgColor) return '#ffffff';
  if (!preferredTextColor) return getContrastingTextColor(bgColor);

  const getBrightness = (hexColor) => {
	let hex = hexColor.replace('#', '');
	if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);
	return (r * 299 + g * 587 + b * 114) / 1000;
  };

  const bgBrightness = getBrightness(bgColor);
  const textBrightness = getBrightness(preferredTextColor);
  const diff = Math.abs(bgBrightness - textBrightness);

  if (diff < 100) {
	return bgBrightness > 128 ? '#0f172a' : '#ffffff';
  }
  return preferredTextColor;
}

function renderGenderBadge(genderCode) {
  if (!genderCode) return '';
  const code = genderCode.toUpperCase();
  let symbol = '', label = '', cssClass = '';

  switch (code) {
	case 'M': symbol = '♂'; label = 'Male'; cssClass = 'gender-m'; break;
	case 'F': symbol = '♀'; label = 'Female'; cssClass = 'gender-f'; break;
	case 'X': symbol = '⚲'; label = 'Non-Binary / Other'; cssClass = 'gender-x'; break;
	default: return '';
  }
  return `<span class="gender-badge ${cssClass}" title="${label}">${symbol}</span>`;
}

function renderFlagBadge(natCode, nat2Code) {
  if (!natCode) return '-';

  const getFlagHTML = (code) => {
	if (!code) return '';
	const natData = nationalitiesDatabase[code.toUpperCase()];
	if (natData && natData.flag) {
	  return `<img src="${natData.flag}" alt="${natData.name}" title="${natData.name} (${code.toUpperCase()})" class="nat-flag-img">`;
	}
	return `<span>${code.toUpperCase()}</span>`;
  };

  const primaryFlag = getFlagHTML(natCode);
  const secondaryFlag = getFlagHTML(nat2Code);

  if (secondaryFlag) {
	return `<div class="flags-container">${primaryFlag}${secondaryFlag}</div>`;
  }

  return primaryFlag;
}

function renderCompBadge(compCode) {
  if (!compCode) return '-';
  const code = compCode.toUpperCase();
  
  const compKey = Object.keys(competitions).find(key => competitions[key].code === code);
  const comp = compKey ? competitions[compKey] : null;

  if (!comp) {
	return `<span class="comp-badge" style="background: rgba(255,255,255,0.1); color: #fff;">${code}</span>`;
  }

  return `<span class="comp-badge" style="background: ${comp.color}; color: ${comp.textColor};" title="${comp.name}">${comp.code}</span>`;
}

function getProficiencyColor(rating) {
  if (!rating || rating < 30) return 'rgb(239, 68, 68)';
  const val = Math.min(Math.max(rating, 0), 100);
  let r, g, b;

  if (val >= 85) {
	const factor = (val - 85) / 15;
	r = Math.round(132 - (132 - 34) * factor);
	g = Math.round(204 + (197 - 204) * factor);
	b = Math.round(22 + (94 - 22) * factor);
  } else if (val >= 65) {
	const factor = (val - 65) / 19;
	r = Math.round(234 - (234 - 132) * factor);
	g = Math.round(179 + (204 - 179) * factor);
	b = Math.round(8 + (22 - 8) * factor);
  } else {
	const factor = Math.max(0, (val - 45) / 20);
	r = Math.round(249 + (234 - 249) * factor);
	g = Math.round(115 + (179 - 115) * factor);
	b = Math.round(22 - (22 - 8) * factor);
  }
  return `rgb(${r}, ${g}, ${b})`;
}

function getPositionCoordinates(posKey) {
  if (!posKey) return null;
  const key = posKey.toUpperCase();
  const canonicalKey = positionAliases[key] || key;
  
  return {
    canonicalKey: canonicalKey,
    coords: basePitchCoordinates[canonicalKey] || null
  };
}

function generatePitchTooltip(player) {
  if (!player.positions) return '';

  // Store resolved positions to prevent duplicate/overpainted nodes on the pitch
  const resolvedPositions = {};

  Object.keys(player.positions).forEach(posKey => {
    const rawKey = posKey.toUpperCase();
    const resolved = getPositionCoordinates(rawKey);

    if (resolved && resolved.coords) {
      const canonicalKey = resolved.canonicalKey;
      const rating = player.positions[posKey];

      // Keep the highest rating if two aliases resolve to the same coordinate spot
      if (!resolvedPositions[canonicalKey] || rating > resolvedPositions[canonicalKey].rating) {
        resolvedPositions[canonicalKey] = {
          displayTag: rawKey,
          coords: resolved.coords,
          rating: rating
        };
      }
    }
  });

  // Render nodes using the resolved coordinates
  const nodesHTML = Object.keys(resolvedPositions).map(key => {
    const node = resolvedPositions[key];
    const bgColor = getProficiencyColor(node.rating);

    return `
      <div class="pitch-node" 
           style="left: ${node.coords.x}%; top: ${node.coords.y}%; background-color: ${bgColor};"
           title="${node.displayTag}: ${node.rating}/100">
        ${node.displayTag}
      </div>
    `;
  }).join("");

  return `
    <div class="pos-tooltip">
      <div class="pitch-card">
        <div class="pitch-title">${player.name}</div>
        <div class="pitch-graphic">${nodesHTML}</div>
        <div class="pitch-legend">
          <div class="gradient-bar"></div>
          <div class="legend-labels">
            <span>45</span><span>65</span><span>85</span><span>100</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function calculatePayroll(squad = [], annualOverhead = 0) {
  const squadWageAnnual = squad.reduce((sum, p) => sum + (p.wage || 0), 0);
  const totalAnnual = squadWageAnnual + annualOverhead;
  const totalMonthly = totalAnnual / 12;
  const totalWeekly = totalAnnual / 52;

  return {
	squadAnnual: squadWageAnnual,
	overheadAnnual: annualOverhead,
	totalAnnual: totalAnnual,
	formatted: {
	  annual: `£${totalAnnual.toFixed(2)}M`,
	  monthly: `£${totalMonthly.toFixed(2)}M`,
	  weekly: totalWeekly < 1 ? `£${Math.round(totalWeekly * 1000)}k` : `£${totalWeekly.toFixed(2)}M`
	}
  };
}

function formatPlayerWage(annualWageM, mode) {
  if (mode === 'monthly') {
	const monthlyK = (annualWageM / 12) * 1000;
	return monthlyK < 1000 ? `£${monthlyK.toFixed(1)}k / mo` : `£${(annualWageM / 12).toFixed(2)}M / mo`;
  } else if (mode === 'weekly') {
	const weeklyK = (annualWageM / 52) * 1000;
	return weeklyK < 1000 ? `£${weeklyK.toFixed(1)}k / wk` : `£${(annualWageM / 52).toFixed(2)}M / wk`;
  } else {
	return `£${annualWageM.toFixed(2)}M / yr`;
  }
}

function setWageMode(mode) {
  currentWageMode = mode;
  const thHeader = document.getElementById('th-wage-header');
  if (thHeader) {
	thHeader.textContent = mode === 'monthly' ? 'Monthly Wage' : (mode === 'weekly' ? 'Weekly Wage' : 'Annual Wage');
  }
  if (currentLoadedTeam && currentLoadedTeam.squad) {
	renderSquadTable(currentLoadedTeam.squad);
  }
}

function renderSquadTable(squad = []) {
  const squadTable = document.querySelector("#squad-table tbody");
  if (!squadTable) return;

  squadTable.innerHTML = squad.map(p => {
	const genderHTML = renderGenderBadge(p.gender);
	const flagHTML = renderFlagBadge(p.nat, p.nat2);
	const isCaptain = p.captainOrder === 1;
	const armbandHTML = isCaptain ? `<span class="captain-armband" title="Club Captain">&equals;C&equals;</span>` : '';
	const primaryPosition = p.primaryPos || p.pos || '-';

	return `
	  <tr>
		<td>${p.num || '-'}</td>
		<td style="text-align: center;">${flagHTML}</td>
		<td>
		  ${genderHTML}<strong>${p.name}</strong>${armbandHTML}
		</td>
		<td class="pos-cell">
		  <span class="pos-badge-trigger">${primaryPosition}</span>
		  ${generatePitchTooltip(p)}
		</td>
		<td>${p.age || '-'}</td>
		<td><strong>${p.rating}</strong></td>
		<td>${p.archetype || '-'}</td>
		<td><strong>${formatPlayerWage(p.wage, currentWageMode)}</strong></td>
	  </tr>
	`;
  }).join("");

  document.querySelectorAll('.pos-cell').forEach(cell => {
	cell.addEventListener('mouseenter', () => {
	  const rect = cell.getBoundingClientRect();
	  if (rect.top < 250) {
		cell.classList.add('tooltip-below');
	  } else {
		cell.classList.remove('tooltip-below');
	  }
	});
  });
}

function renderTrophyCabinet(teamHonours) {
  const cabinetEl = document.getElementById("trophy-cabinet");
  if (!cabinetEl) return;

  if (!teamHonours || Object.keys(teamHonours).length === 0) {
	cabinetEl.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">No major honours.</div>`;
	return;
  }

  cabinetEl.innerHTML = Object.keys(teamHonours).map(compKey => {
	const seasons = teamHonours[compKey];
	const compDetails = competitions[compKey];
	if (!compDetails) return '';

	return `
	  <div class="compact-trophy-row" title="${compDetails.name} (Seasons: ${seasons.map(s => 'S'+s).join(', ')})">
		<img src="${compDetails.trophyImg}" alt="" class="compact-trophy-icon">
		<span class="compact-trophy-count">${seasons.length}x</span>
		<span class="compact-trophy-name">${compDetails.name}</span>
	  </div>
	`;
  }).join("");
}

function renderNextFixtureWidget(fixtures = []) {
  const widgetEl = document.getElementById("next-fixture-widget");
  if (!widgetEl) return;

  if (!fixtures || fixtures.length === 0) {
	widgetEl.innerHTML = `<div style="color: var(--text-muted); font-style: italic;">No upcoming fixtures scheduled.</div>`;
	return;
  }

  const nextMatch = fixtures[0];
  const compBadgeHTML = renderCompBadge(nextMatch.competition);

  widgetEl.innerHTML = `
	<div style="display: flex; gap: 6px; align-items: center;">
	  ${compBadgeHTML}
	  <span class="match-badge">${nextMatch.venue} Game</span>
	</div>
	<div class="opponent-name">vs ${nextMatch.opponent}</div>
	<div class="match-meta">📅 <strong>${nextMatch.date}</strong></div>
	<a href="matchday.html?opponent=${encodeURIComponent(nextMatch.opponent)}" class="match-link-btn">
	  Preview Match →
	</a>
  `;
}

function selectTeam(teamId) {
  const selectedTeam = leagueDatabase[teamId];
  if (!selectedTeam) return;

  currentLoadedTeam = selectedTeam;

  const secondaryContrastText = getContrastingTextColor(selectedTeam.colors.secondary);
  const primaryContrastText = getContrastingTextColor(selectedTeam.colors.primary);

  document.documentElement.style.setProperty('--primary-color', selectedTeam.colors.primary);
  document.documentElement.style.setProperty('--secondary-color', selectedTeam.colors.secondary);
  document.documentElement.style.setProperty('--accent-color', selectedTeam.colors.accent);

  document.documentElement.style.setProperty('--secondary-text-color', secondaryContrastText);
  document.documentElement.style.setProperty('--primary-text-color', primaryContrastText);

  loadDashboard(selectedTeam);

  const splash = document.getElementById("splash");
  if (splash) splash.classList.add("hidden");
}

function loadDashboard(data) {
  currentLoadedTeam = data;

  const crestImg = document.getElementById("team-crest");
  if (crestImg && data.crest) { crestImg.src = data.crest; crestImg.alt = `${data.name} Crest`; }

  const teamName = document.getElementById("team-name");
  if (teamName) teamName.textContent = data.name;

  const teamMotto = document.getElementById("team-motto");
  if (teamMotto) teamMotto.textContent = data.motto;

  const overhead = data.staffOverhead || leagueConfig.defaults.staffOverheadAnnual;
  const payroll = calculatePayroll(data.squad, overhead);

  const statRank = document.getElementById("stat-rank");
  if (statRank) statRank.textContent = "#" + data.stats.rank;

  const statPayrollAnnual = document.getElementById("stat-payroll-annual");
  if (statPayrollAnnual) statPayrollAnnual.textContent = payroll.formatted.annual;

  const statPayrollSub = document.getElementById("stat-payroll-sub");
  if (statPayrollSub) {
	statPayrollSub.textContent = `Squad £${payroll.squadAnnual.toFixed(1)}M + Ops £${payroll.overheadAnnual.toFixed(1)}M`;
  }

  const statPayrollWeekly = document.getElementById("stat-payroll-weekly");
  if (statPayrollWeekly) statPayrollWeekly.textContent = payroll.formatted.weekly;

  const statSquadSize = document.getElementById("stat-squad-size");
  if (statSquadSize) statSquadSize.textContent = data.squad.length;

  const nicknameEl = document.getElementById("meta-nickname");
  if (nicknameEl) nicknameEl.textContent = data.nickname || data.name;

  const stadiumEl = document.getElementById("meta-stadium");
  if (stadiumEl && data.stadium) {
	stadiumEl.textContent = `${data.stadium.name} (${data.stadium.capacity.toLocaleString()})`;
  }

  const stadiumImg = document.getElementById("stadium-img");
  if (stadiumImg && data.stadium && (data.stadium.photo || data.stadium.img)) {
	stadiumImg.src = data.stadium.photo || data.stadium.img;
	stadiumImg.alt = `${data.stadium.name} Photo`;
  }

  // Dynamic Manager Binding with Flags
  const managerEl = document.getElementById("meta-manager");
  if (managerEl && data.staff) {
	const mgr = (data.staff.senior && data.staff.senior.manager) ? data.staff.senior.manager : data.staff.manager;
	if (mgr) {
	  const flagsHTML = renderFlagBadge(mgr.nat, mgr.nat2);
	  managerEl.innerHTML = `${flagsHTML} <span>${mgr.name}</span>`;
	}
  }

  // Dynamic Captain Binding with Flags
  const captainEl = document.getElementById("meta-captain");
  if (captainEl && data.squad) {
	const primaryCaptain = data.squad.find(p => p.captainOrder === 1) || data.squad[0];
	if (primaryCaptain) {
	  const flagsHTML = renderFlagBadge(primaryCaptain.nat, primaryCaptain.nat2);
	  captainEl.innerHTML = `${flagsHTML} <span>${primaryCaptain.name}</span>`;
	} else {
	  captainEl.textContent = '-';
	}
  }

  const sponsorEl = document.getElementById("sponsor-name");
  if (sponsorEl && data.sponsor) {
	sponsorEl.innerHTML = `${data.sponsor.name} <span class="sponsor-sector">(${data.sponsor.sector})</span>`;
  }

  const sponsorLogoImg = document.getElementById("sponsor-logo");
  if (sponsorLogoImg && data.sponsor && data.sponsor.logo) {
	sponsorLogoImg.src = data.sponsor.logo;
	sponsorLogoImg.alt = `${data.sponsor.name} Logo`;
  }
  
  renderTrophyCabinet(data.honours);
  renderNextFixtureWidget(data.fixtures);
  renderSquadTable(data.squad);

  // Render Upcoming Fixtures with Competition Tags
  const fixturesTable = document.querySelector("#fixtures-table tbody");
  if (fixturesTable && data.fixtures) {
	fixturesTable.innerHTML = data.fixtures.map(f => {
	  const compBadge = renderCompBadge(f.competition);
	  return `
		<tr>
		  <td>${compBadge}</td>
		  <td><strong>${f.opponent}</strong></td>
		  <td>${f.venue}</td>
		  <td>${f.date}</td>
		</tr>
	  `;
	}).join("");
  }
}

function openSplash() {
  const splash = document.getElementById("splash");
  if (splash) splash.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.style.setProperty('--league-primary', leagueConfig.colors.primary);
  document.documentElement.style.setProperty('--league-secondary', leagueConfig.colors.secondary);
  document.documentElement.style.setProperty('--league-accent', leagueConfig.colors.accent);

  const leagueName = document.getElementById("league-name");
  if (leagueName) leagueName.textContent = leagueConfig.name;

  const leagueMotto = document.getElementById("league-motto");
  if (leagueMotto) leagueMotto.textContent = leagueConfig.motto;

  const leagueLogo = document.getElementById("league-logo");
  if (leagueLogo) leagueLogo.src = leagueConfig.logo;

  const teamPicker = document.querySelector(".team-picker");
  if (teamPicker) {
	teamPicker.innerHTML = Object.keys(leagueDatabase).map(teamId => {
	  const team = leagueDatabase[teamId];
	  const nameColor = getReadableTextColor(team.colors.primary, team.colors.secondary);
	  const mottoColor = getReadableTextColor(team.colors.primary, team.colors.accent);

	  return `
		<button class="team-btn" 
				onclick="selectTeam('${teamId}')"
				style="background: ${team.colors.primary}; 
					   border: 1px solid ${team.colors.secondary}; 
					   border-left: 5px solid ${team.colors.accent};">
		  <img src="${team.crest}" alt="" class="team-btn-crest">
		  <div>
			<div style="font-size: 0.95rem; line-height: 1.2; font-weight: 800; color: ${nameColor};">
			  ${team.name}
			</div>
			<div style="font-size: 0.75rem; color: ${mottoColor}; font-weight: 600; margin-top: 2px;">
			  ${team.motto}
			</div>
		  </div>
		</button>
	  `;
	}).join("");
  }

  loadDashboard(leagueDatabase["dubisha-flames"]);
});
