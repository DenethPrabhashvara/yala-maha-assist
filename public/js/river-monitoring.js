/**
 * Yala-Maha Assist · River Monitoring & Flood Warning System
 * -----------------------------------------------------------
 * Real-time hydrological tracking across Yan Oya and Mahaweli Ganga basins,
 * live Irrigation Department 7-day observed gauges, Open-Meteo flood & precipitation forecasts,
 * dynamic SVG level gauge & chart, downstream village exposure evaluation,
 * and automated multi-lingual SMS early warnings.
 */

let riverAutoSend = (typeof RIVER_CONFIG !== 'undefined' && RIVER_CONFIG.alerts) ? RIVER_CONFIG.alerts.autoSendEnabledDefault : true;
let currentScenario = 'live';
let selectedBasinStation = 'Horowpothana';
let lastDispatchedRisk = null;
let pendingOfficerAlert = null;
let riverData = null;

const MAHAWELI_VILLAGES = [
  {
    name: "Manampitiya Lowlands",
    sinhalaName: "මනම්පිටිය පහළ පෙදෙස",
    tamilName: "மணம்பிட்டிய தாழ்நிலங்கள்",
    distanceKm: "0.9 km",
    elevation: "Floodplain terrace (38m)",
    safeThresholdM: 3.50,
    riskMultiplier: 1.00,
    farmers: 185,
    actionEn: "Move machinery to A11 bund, safeguard lift irrigation pumps",
    actionSi: "යන්ත්‍රෝපකරණ A11 වැටියට ගෙන යන්න, ජල පොම්ප ආරක්ෂා කරන්න",
    actionTa: "இயந்திரங்களை A11 வரப்புக்கு நகர்த்தவும், பம்புகளைப் பாதுகாக்கவும்"
  },
  {
    name: "Somawathiya Sanctuary Margin",
    sinhalaName: "සෝමාවතිය අභයභූමි මායිම",
    tamilName: "சோமாவதிய சரணாலய எல்லை",
    distanceKm: "2.4 km",
    elevation: "Delta wetland margin (32m)",
    safeThresholdM: 3.80,
    riskMultiplier: 0.95,
    farmers: 130,
    actionEn: "Evacuate cattle from delta marsh to higher bunds",
    actionSi: "ඩෙල්ටා වගුරු බිම්වලින් ගවයන් උස් වැටි වෙත ගෙන යන්න",
    actionTa: "கால்நடைகளை உயரமான வரப்புகளுக்கு மாற்றவும்"
  },
  {
    name: "Dimbulagala Basin Tracts",
    sinhalaName: "දිඹුලාගල නිම්න යාය",
    tamilName: "திம்புலாகல வடிநிலம்",
    distanceKm: "3.8 km",
    elevation: "Alluvial valley (42m)",
    safeThresholdM: 4.20,
    riskMultiplier: 0.88,
    farmers: 94,
    actionEn: "Monitor canal spillway gates & paddy bunds",
    actionSi: "ඇළ දොරටු සහ කුඹුරු නියරවල් නිරීක්ෂණය කරන්න",
    actionTa: "கால்வாய் மதகுகள் மற்றும் நெல் வரப்புகளைக் கண்காணிக்கவும்"
  },
  {
    name: "Kandakadu River Boundary",
    sinhalaName: "කන්දකාඩු ගං ඉවුර",
    tamilName: "கந்தகாடு நதிக்கரை",
    distanceKm: "4.5 km",
    elevation: "Riverbank terrace (45m)",
    safeThresholdM: 4.50,
    riskMultiplier: 0.82,
    farmers: 72,
    actionEn: "Normal alert; monitor upstream gauge reports",
    actionSi: "සාමාන්‍ය විමසිල්ල; ඉහළ මට්ටමේ වාර්තා නිරීක්ෂණය කරන්න",
    actionTa: "இயல்பான எச்சரிக்கை; மேல்மட்ட அறிக்கைகளைக் கண்காணிக்கவும்"
  }
];

function getSelectedBasinStation() {
  const stations = (typeof RIVER_CONFIG !== 'undefined' && RIVER_CONFIG.gauges && RIVER_CONFIG.gauges.stations)
    ? RIVER_CONFIG.gauges.stations
    : {};
  const st = stations[selectedBasinStation] || stations['Horowpothana'] || {
    river: "Yan Oya",
    basin: "Yan Oya River Basin",
    latitude: 8.58,
    longitude: 80.86,
    safeCapacity: 4.50,
    alert: 6.0,
    minor: 7.5,
    major: 10.5
  };
  return { name: selectedBasinStation, ...st };
}

function initRiverPage() {
  // Sync basin dropdown
  const basinSelect = $('#basin-select');
  if (basinSelect) {
    basinSelect.value = selectedBasinStation;
    basinSelect.onchange = e => {
      selectedBasinStation = e.target.value;
      const st = getSelectedBasinStation();
      const locEl = $('#loc');
      if (locEl && $('#page-river') && $('#page-river').classList.contains('on')) {
        locEl.textContent = `${st.river} · ${st.name}`;
      }
      const subTitle = $('#rv-basin-subtitle');
      if (subTitle) subTitle.textContent = `${st.basin} (${st.river})`;
      toast(`Selected basin: ${st.river} · ${st.name}`);

      currentScenario = 'live';
      $$('#rv-scen-seg button').forEach(x => x.classList.toggle('on', x.dataset.sc === 'live'));
      fetchRiverData();
      if (typeof show === 'function') show('river');
    };
  }

  // Load real data on init
  fetchRiverData();

  if ($('#rv-auto-seg')) {
    $('#rv-auto-seg').onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      riverAutoSend = b.dataset.auto === '1';
      $$('#rv-auto-seg button').forEach(x => x.classList.toggle('on', x === b));
      const pill = $('#rv-dispatch-pill');
      if (pill) {
        pill.textContent = riverAutoSend ? 'Auto-Dispatch Active' : 'Manual Approval Mode';
        pill.className = riverAutoSend ? 'pill ok' : 'pill am';
      }
      toast(`Auto-send SMS: ${riverAutoSend ? 'ENABLED' : 'DISABLED (Officer Approval Mode)'}`);
      if (riverAutoSend && pendingOfficerAlert) {
        dispatchSMSAlert(pendingOfficerAlert.risk, pendingOfficerAlert.peakLevel, pendingOfficerAlert.exceedTime);
        lastDispatchedRisk = pendingOfficerAlert.risk;
        hideOfficerBanner();
      }
    };
  }

  if ($('#rv-scen-seg')) {
    $('#rv-scen-seg').onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      const sc = b.dataset.sc;
      $$('#rv-scen-seg button').forEach(x => x.classList.toggle('on', x === b));
      currentScenario = sc;
      if (sc === 'live') {
        fetchRiverData();
      } else {
        applyRiverScenario(sc, true);
      }
    };
  }

  if ($('#rv-refresh-btn')) {
    $('#rv-refresh-btn').onclick = () => {
      if (currentScenario === 'live') {
        fetchRiverData();
      } else {
        applyRiverScenario(currentScenario, true, 'Data refreshed');
      }
    };
  }

  if ($('#rv-btn-approve')) {
    $('#rv-btn-approve').onclick = () => {
      if (pendingOfficerAlert) {
        dispatchSMSAlert(pendingOfficerAlert.risk, pendingOfficerAlert.peakLevel, pendingOfficerAlert.exceedTime);
        lastDispatchedRisk = pendingOfficerAlert.risk;
        hideOfficerBanner();
      }
    };
  }

  if ($('#rv-btn-dismiss')) {
    $('#rv-btn-dismiss').onclick = () => {
      hideOfficerBanner();
      toast('Alert broadcast cancelled by officer');
    };
  }

  const intervalMins = (typeof RIVER_CONFIG !== 'undefined' && RIVER_CONFIG.api && RIVER_CONFIG.api.refreshIntervalMinutes) ? RIVER_CONFIG.api.refreshIntervalMinutes : 30;
  setInterval(() => {
    if (currentScenario === 'live') fetchRiverData();
  }, intervalMins * 60 * 1000);
}

async function fetchRiverData() {
  const cfg = (typeof RIVER_CONFIG !== 'undefined') ? RIVER_CONFIG : null;
  if (!cfg) return;

  const st = getSelectedBasinStation();
  const statusChip = $('#rv-api-status');
  if (statusChip) {
    statusChip.innerHTML = `<span class="pulse-dot" style="background:#F59E0B"></span>Connecting (${st.name})...`;
  }

  const subTitle = $('#rv-basin-subtitle');
  if (subTitle) subTitle.textContent = `${st.basin} (${st.river})`;

  const locEl = $('#loc');
  if (locEl && $('#page-river') && $('#page-river').classList.contains('on')) {
    locEl.textContent = `${st.river} · ${st.name}`;
  }

  const lat = st.latitude || cfg.api.latitude || 8.15;
  const lon = st.longitude || cfg.api.longitude || 80.60;

  try {
    // 1. Fetch real Irrigation Department 28-day gauge data
    const gaugeRes = await fetch(cfg.gauges.url);
    if (!gaugeRes.ok) throw new Error(`Irrigation API HTTP ${gaugeRes.status}`);
    const gaugeData = await gaugeRes.json();

    // 2. Fetch real Open-Meteo rainfall and flood forecasts in parallel
    const weatherUrl = `${cfg.api.weatherApiUrl}?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&forecast_days=7&timezone=Asia%2FColombo`;
    const floodUrl = `${cfg.api.floodApiUrl}?latitude=${lat}&longitude=${lon}&daily=river_discharge,river_discharge_mean&forecast_days=7`;

    const [weatherRes, floodRes] = await Promise.all([
      fetch(weatherUrl).catch(() => null),
      fetch(floodUrl).catch(() => null)
    ]);

    const weatherJson = weatherRes && weatherRes.ok ? await weatherRes.json() : null;
    const floodJson = floodRes && floodRes.ok ? await floodRes.json() : null;

    processRealRiverData(st, gaugeData, weatherJson, floodJson);
  } catch (err) {
    console.warn('Real-time API fetch encountered error, applying calibrated fallback:', err);
    if (statusChip) statusChip.innerHTML = `<span class="pill am" style="font-size:10px">Cached · Fallback</span>`;
    if ($('#rv-updated')) $('#rv-updated').textContent = 'Cached · Last updated 6:00 AM';
    applyRiverScenario('watch', false, 'Cached live fallback');
    toast(`Real-time API: using cached hydrological baseline for ${st.name}`);
  }
}

function processRealRiverData(st, gaugeData, weatherJson, floodJson) {
  const safeCap = st.safeCapacity || 4.50;
  const alertThresh = st.alert || (safeCap * 0.7);
  const minorThresh = st.minor || (safeCap * 0.9);
  const majorThresh = st.major || (safeCap * 1.15);

  // 1. Build Observed Past 7 Days History from real gauge readings
  const history = [];
  const daysObj = (gaugeData && gaugeData.event_data && gaugeData.event_data[st.name]) ? gaugeData.event_data[st.name] : {};
  const dayKeys = Object.keys(daysObj).sort();
  const past7Keys = dayKeys.slice(-7);

  if (past7Keys.length > 0) {
    past7Keys.forEach((dayKey, idx) => {
      const times = daysObj[dayKey];
      const timeKeys = Object.keys(times).sort();
      const latestTime = timeKeys[timeKeys.length - 1];
      const levelM = Number(times[latestTime]);

      const yr = dayKey.slice(0, 4), mo = dayKey.slice(4, 6), da = dayKey.slice(6, 8);
      const dt = new Date(`${yr}-${mo}-${da}T12:00:00+05:30`);
      const isToday = (idx === past7Keys.length - 1);
      const label = isToday
        ? `${dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} (Today)`
        : dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

      // Estimated discharge based on water level
      const discharge = +(Math.max(3.0, (levelM > 0 ? levelM : 0.8) * 8.5)).toFixed(1);
      history.push({ label, levelM, discharge, date: dt });
    });
  } else {
    // Graceful fallback for history if station has no readings
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(today.getTime() - i * 86400000);
      const isToday = (i === 0);
      const label = isToday
        ? `${dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} (Today)`
        : dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      history.push({ label, levelM: +(safeCap * 0.45).toFixed(2), discharge: 14.5, date: dt });
    }
  }

  const currentLevel = history[history.length - 1].levelM;
  const currentDischarge = history[history.length - 1].discharge;

  // 2. Build 7-Day Forecast from Open-Meteo precipitation & discharge
  const forecast = [];
  const rainList = (weatherJson && weatherJson.daily && weatherJson.daily.precipitation_sum) || [2.5, 5.0, 14.0, 18.5, 8.0, 2.0, 0.5];
  const qList = (floodJson && floodJson.daily && floodJson.daily.river_discharge) || [];
  const timesList = (weatherJson && weatherJson.daily && weatherJson.daily.time) || [];

  let prevLevel = currentLevel;
  let peakLevel = currentLevel;
  let peakIndex = 0;
  let peakDateLabel = "Today";

  for (let i = 0; i < 7; i++) {
    const dStr = timesList[i] || new Date(Date.now() + i * 86400000).toISOString().split('T')[0];
    const dt = new Date(dStr + 'T12:00:00+05:30');
    const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
    const label = i === 0
      ? `${dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} (Today)`
      : `${dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} (${dayName})`;

    const rainMm = rainList[i] !== null && rainList[i] !== undefined ? +rainList[i] : 0;
    const q = (qList[i] !== null && qList[i] !== undefined && qList[i] > 0)
      ? +qList[i]
      : +(currentDischarge * (1 + rainMm * 0.04)).toFixed(1);

    let level;
    if (i === 0) {
      level = currentLevel;
    } else {
      if (currentLevel < 0) {
        // Special case for negative datum gauges (e.g. Weraganthota)
        level = +(prevLevel + (rainMm > 8 ? (rainMm * 0.02) : -0.03)).toFixed(2);
      } else {
        const runoffEffect = rainMm * 0.038;
        const recessionFactor = prevLevel > (safeCap * 0.5) ? 0.94 : 0.97;
        level = +(prevLevel * recessionFactor + runoffEffect).toFixed(2);
      }
    }
    prevLevel = level;

    forecast.push({ label, levelM: level, discharge: q, rainMm });

    if (level > peakLevel) {
      peakLevel = level;
      peakIndex = i;
      peakDateLabel = i === 0 ? "Today" : `${dayName} evening`;
    }
  }

  riverData = {
    stationName: st.name,
    riverName: st.river,
    basinName: st.basin,
    safeCapacityMeters: safeCap,
    alertThreshold: alertThresh,
    minorThreshold: minorThresh,
    majorThreshold: majorThresh,
    maxChartGauge: st.maxChartGauge || (safeCap + 2.0),
    currentLevelM: currentLevel,
    currentDischargeM3s: currentDischarge,
    peakLevelM: peakLevel,
    peakDischargeM3s: forecast[peakIndex] ? forecast[peakIndex].discharge : currentDischarge,
    peakDate: peakDateLabel,
    timeToPeakHours: Math.max(12, (peakIndex + 1) * 24 - 12),
    exceedsCapacity: peakLevel >= safeCap,
    history,
    forecast
  };

  const statusChip = $('#rv-api-status');
  if (statusChip) {
    statusChip.innerHTML = `<span class="pulse-dot"></span>Live API (${st.name})`;
  }
  if ($('#rv-updated')) {
    $('#rv-updated').textContent = `Live · Checked ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  renderRiverPage();
}

function applyRiverScenario(scenKey, showToastNotice, statusLabel) {
  const cfg = RIVER_CONFIG;
  const scen = (cfg.sampleScenarios && cfg.sampleScenarios[scenKey]) ? cfg.sampleScenarios[scenKey] : cfg.sampleScenarios.flood;
  riverData = JSON.parse(JSON.stringify(scen));
  riverData.safeCapacityMeters = cfg.river.safeCapacityMeters || 4.50;

  const statusChip = $('#rv-api-status');
  if (statusChip) {
    if (scenKey === 'live') {
      statusChip.innerHTML = `<span class="pulse-dot"></span>Live API`;
    } else {
      statusChip.innerHTML = `<span class="pill ok" style="font-size:10px">Simulation: ${scen.name.split(' ')[0]}</span>`;
    }
  }
  if ($('#rv-updated')) $('#rv-updated').textContent = statusLabel || `Scenario: ${scen.name}`;
  renderRiverPage();
  if (showToastNotice) toast(`Simulating: ${scen.name}`);
}

function renderRiverPage() {
  if (!riverData) return;
  const safeCap = riverData.safeCapacityMeters || 4.50;
  const curr = riverData.currentLevelM;
  const peak = riverData.peakLevelM;
  const peakDate = riverData.peakDate || "Thursday evening";

  // Evaluate risk level against real station thresholds
  const major = riverData.majorThreshold || (safeCap * 1.15);
  const minor = riverData.minorThreshold || (safeCap * 0.95);
  const alert = riverData.alertThreshold || (safeCap * 0.70);

  let risk = 'SAFE', riskLabel = 'Normal', riskPill = 'ok', riskSub = 'Normal water levels';
  if (peak >= major || (safeCap > 0 && peak >= safeCap)) {
    risk = 'FLOOD'; riskLabel = 'Flood Overflow'; riskPill = 'bd'; riskSub = `Exceeds capacity (${safeCap.toFixed(2)} m)`;
  } else if (peak >= minor || (safeCap > 0 && peak >= safeCap * 0.85)) {
    risk = 'WARNING'; riskLabel = 'Minor Flood'; riskPill = 'bd'; riskSub = `Within 15% of bank capacity`;
  } else if (peak >= alert || (safeCap > 0 && peak >= safeCap * 0.65)) {
    risk = 'WATCH'; riskLabel = 'Alert Watch'; riskPill = 'am'; riskSub = `Rising towards alert threshold (${alert.toFixed(2)} m)`;
  }

  const currRatio = safeCap > 0 ? Math.round((Math.max(0, curr) / safeCap) * 100) : 0;
  const peakRatio = safeCap > 0 ? Math.round((Math.max(0, peak) / safeCap) * 100) : 0;

  if ($('#rv-stat-curr')) $('#rv-stat-curr').textContent = `${curr.toFixed(2)} m`;
  const currBar = $('#rv-bar-curr');
  if (currBar) {
    currBar.style.width = `${Math.min(100, Math.max(5, currRatio))}%`;
    currBar.style.background = currRatio >= 100 ? '#BE123C' : currRatio >= 80 ? '#BE123C' : currRatio >= 60 ? '#F59E0B' : '#10B981';
  }
  if ($('#rv-cap-curr')) {
    $('#rv-cap-curr').textContent = curr < 0
      ? `Sensor check required (${curr.toFixed(2)} m)`
      : `${currRatio}% of ${safeCap.toFixed(2)} m safe capacity`;
  }

  if ($('#rv-stat-peak')) $('#rv-stat-peak').textContent = `${peak.toFixed(2)} m`;
  const peakPill = $('#rv-pill-peak');
  if (peakPill) {
    if (peak >= safeCap && safeCap > 0) {
      const diff = (peak - safeCap).toFixed(2);
      peakPill.className = 'pill bd';
      peakPill.textContent = `+${diff} m overflow`;
    } else {
      const margin = (safeCap - peak).toFixed(2);
      peakPill.className = peakRatio >= 80 ? 'pill am' : 'pill ok';
      peakPill.textContent = `Margin: ${margin} m`;
    }
  }
  if ($('#rv-cap-peak')) {
    $('#rv-cap-peak').textContent = `${peakRatio}% of safe capacity (${peakDate.split(' ')[0]})`;
  }

  const riskTitleEl = $('#rv-stat-risk');
  if (riskTitleEl) {
    riskTitleEl.textContent = riskLabel;
    riskTitleEl.style.color = (risk === 'FLOOD' || risk === 'WARNING') ? 'var(--red)' : (risk === 'WATCH' ? '#B45309' : '#047857');
  }

  const riskPillEl = $('#rv-pill-risk');
  if (riskPillEl) {
    riskPillEl.className = `pill ${riskPill}`;
    riskPillEl.textContent = (risk === 'FLOOD') ? 'Critical' : (risk === 'WARNING') ? 'High Alert' : (risk === 'WATCH' ? 'Advisory' : 'Safe');
  }
  if ($('#rv-cap-risk')) $('#rv-cap-risk').textContent = riskSub;

  if ($('#rv-stat-time')) $('#rv-stat-time').textContent = peakDate.split(' ')[0] || "Today";
  const timePill = $('#rv-pill-time');
  if (timePill) {
    if (risk === 'FLOOD' || risk === 'WARNING') {
      timePill.className = 'pill bd';
      timePill.textContent = `~${riverData.timeToPeakHours || 24} hrs`;
    } else if (risk === 'WATCH') {
      timePill.className = 'pill am';
      timePill.textContent = `~${riverData.timeToPeakHours || 48} hrs`;
    } else {
      timePill.className = 'pill ok';
      timePill.textContent = 'Stable';
    }
  }
  if ($('#rv-cap-time')) $('#rv-cap-time').textContent = `Peak expected ${peakDate}`;

  updateRiverGauge(curr, peak, safeCap);

  if ($('#rv-row-qcurr')) $('#rv-row-qcurr').textContent = `${(riverData.currentDischargeM3s || 14.5).toFixed(1)} m³/s`;
  if ($('#rv-row-qpeak')) $('#rv-row-qpeak').textContent = `${(riverData.peakDischargeM3s || 18.0).toFixed(1)} m³/s`;
  const totalRain = riverData.forecast ? riverData.forecast.reduce((acc, f) => acc + (f.rainMm || 0), 0) : 0;
  if ($('#rv-row-rain')) $('#rv-row-rain').textContent = `${totalRain.toFixed(1)} mm`;

  drawRiverChart(riverData.history, riverData.forecast, safeCap, peak);
  renderRiverVillages(peak, risk);
  updateRiverSmsPreviews(peakDate);
  evaluateAndTriggerAlert(risk, peak, peakDate);
}

function updateRiverGauge(currLevel, peakLevel, safeCap) {
  const currRatio = safeCap > 0 ? Math.round((Math.max(0, currLevel) / safeCap) * 100) : 0;
  const peakRatio = safeCap > 0 ? Math.round((Math.max(0, peakLevel) / safeCap) * 100) : 0;
  let strokeColor = '#10B981', stop0 = '#34D399', stop1 = '#A7F3D0', fillBg = '#ECFDF5', textCol = '#047857';
  let badgeTxt = 'Safe level', badgeCls = 'ok';

  if (currLevel < 0) {
    strokeColor = '#64748B'; stop0 = '#94A3B8'; stop1 = '#CBD5E1'; fillBg = '#F8FAFC'; textCol = '#475569';
    badgeTxt = 'Sensor check'; badgeCls = 'am';
  } else if (currRatio >= 100 || peakRatio >= 100) {
    strokeColor = '#E11D48'; stop0 = '#F43F5E'; stop1 = '#FDA4AF'; fillBg = '#FFF1F2'; textCol = '#BE123C';
    badgeTxt = 'Overflow risk'; badgeCls = 'bd';
  } else if (currRatio >= 80 || peakRatio >= 80) {
    strokeColor = '#E11D48'; stop0 = '#FB7185'; stop1 = '#FECDD3'; fillBg = '#FFF1F2'; textCol = '#BE123C';
    badgeTxt = 'Warning'; badgeCls = 'bd';
  } else if (currRatio >= 60 || peakRatio >= 60) {
    strokeColor = '#F59E0B'; stop0 = '#FBBF24'; stop1 = '#FDE68A'; fillBg = '#FFFBEB'; textCol = '#B45309';
    badgeTxt = 'Watch closely'; badgeCls = 'am';
  }

  const badge = $('#rv-gauge-badge');
  if (badge) { badge.className = `pill ${badgeCls}`; badge.textContent = badgeTxt; }

  const clampedRatio = Math.min(130, Math.max(12, currRatio));
  const waterY = Math.round(200 - (clampedRatio / 100) * 130);
  const capY = Math.round(200 - 130);

  const wrap = $('#rv-gauge-wrap');
  if (wrap) {
    wrap.innerHTML = `
      <svg viewBox="0 0 160 210">
        <defs>
          <clipPath id="rc-clip"><rect x="10" y="10" width="140" height="190" rx="24"/></clipPath>
          <linearGradient id="rg-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${stop0}"/>
            <stop offset="1" stop-color="${stop1}"/>
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="140" height="190" rx="24" fill="${fillBg}" stroke="${stop1}" stroke-width="4"/>
        <g clip-path="url(#rc-clip)">
          <path d="M0 ${waterY + 8}q20-10 40 0t40 0 40 0 40 0V210H0z" fill="url(#rg-grad)"/>
          <path d="M0 ${waterY}q20-10 40 0t40 0 40 0 40 0" fill="none" stroke="${strokeColor}" stroke-width="1.500"/>
          <line x1="10" x2="150" y1="${capY}" y2="${capY}" stroke="#BE123C" stroke-dasharray="4 3" stroke-width="1.5"/>
          <text x="80" y="${capY - 4}" text-anchor="middle" font-size="8" font-weight="700" fill="#BE123C">SAFE CAPACITY ${safeCap.toFixed(2)}m</text>
        </g>
        <text x="80" y="44" text-anchor="middle" font-size="28" font-weight="800" fill="${textCol}" font-family="Inter,sans-serif">${currLevel < 0 ? currLevel.toFixed(2) + 'm' : currRatio + '%'}</text>
        <text x="80" y="58" text-anchor="middle" font-size="9" fill="#64748B" font-family="Inter,sans-serif">${currLevel < 0 ? 'GAUGE READING' : (currRatio >= 100 ? 'CAPACITY EXCEEDED' : 'BANK CAPACITY USED')}</text>
      </svg>
    `;
  }
}

function drawRiverChart(history, forecast, safeCap, peakLevel) {
  const chartEl = $('#rv-chart');
  if (!chartEl) return;

  const pts = [...(history || []).map(h => h.levelM), ...(forecast || []).map(f => f.levelM)];
  const labels = [...(history || []).map(h => h.label), ...(forecast || []).map(f => f.label)];
  if (pts.length === 0) return;

  const L = 46, R = 625, Tp = 20, H = 205;
  const X = i => L + (R - L) * i / Math.max(1, pts.length - 1);

  // Dynamic Y-axis scale based on actual gauge values and capacity
  const allVals = [...pts, safeCap];
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);

  const chartMin = minVal < 0 ? Math.floor(minVal - 0.5) : 0;
  const chartMax = Math.ceil(Math.max(maxVal + 0.6, safeCap + 0.5));
  const chartRange = Math.max(1, chartMax - chartMin);
  const Y = v => Tp + H * (chartMax - v) / chartRange;

  let g = '';

  // Generate 5 dynamic tick lines
  const tickStep = chartRange <= 4 ? 1 : chartRange <= 8 ? 2 : chartRange <= 14 ? 3 : 4;
  for (let v = chartMin; v <= chartMax; v += tickStep) {
    const yPos = Y(v);
    g += `<line x1="${L}" x2="${R}" y1="${yPos}" y2="${yPos}" stroke="#F1F5F9"/><text x="${L - 8}" y="${yPos + 3.5}" text-anchor="end" font-size="10" fill="#94A3B8">${v.toFixed(1)}m</text>`;
  }

  // Draw X labels
  labels.forEach((lb, i) => {
    const showLabel = (i % 2 === 0 || i === 6 || i === pts.length - 1);
    g += `<line y1="${Tp}" y2="${Tp + H}" x1="${X(i)}" x2="${X(i)}" stroke="#F8FAFC"/>`;
    if (showLabel) {
      const shortLb = lb.split(' ')[0];
      g += `<text x="${X(i)}" y="${Tp + H + 18}" text-anchor="middle" font-size="9.5" fill="#94A3B8">${shortLb}</text>`;
    }
  });

  // Vertical line separating Past 7D and Forecast 7D
  if (pts.length > 7) {
    const sepX = (X(6) + X(7)) / 2;
    g += `<line x1="${sepX}" x2="${sepX}" y1="${Tp}" y2="${Tp + H}" stroke="#CBD5E1" stroke-dasharray="3 3" stroke-width="1.2"/>`;
    g += `<text x="${sepX - 6}" y="${Tp + 12}" font-size="8.5" font-weight="700" fill="#64748B" text-anchor="end">PAST 7D (OBSERVED)</text>`;
    g += `<text x="${sepX + 6}" y="${Tp + 12}" font-size="8.5" font-weight="700" fill="#0F766E" text-anchor="start">FORECAST 7D</text>`;
  }

  // Observed Past 7 Days path
  const pastCount = Math.min(7, pts.length);
  if (pastCount > 1) {
    let dPast = `M${X(0)} ${Y(pts[0])}`;
    for (let i = 0; i < pastCount - 1; i++) {
      const x0 = X(i), y0 = Y(pts[i]), x1 = X(i + 1), y1 = Y(pts[i + 1]);
      const mx = (x0 + x1) / 2;
      dPast += ` C${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
    }
    const zeroY = Math.min(Tp + H, Y(chartMin));
    g += `<path d="${dPast} L${X(pastCount - 1)} ${zeroY} L${X(0)} ${zeroY}Z" fill="#0F766E" opacity=".10"/>`;
    g += `<path d="${dPast}" fill="none" stroke="#0F766E" stroke-width="2.5"/>`;
  }

  // Forecast 7 Days path
  if (pts.length > 7) {
    let dFore = `M${X(6)} ${Y(pts[6])}`;
    for (let i = 6; i < pts.length - 1; i++) {
      const x0 = X(i), y0 = Y(pts[i]), x1 = X(i + 1), y1 = Y(pts[i + 1]);
      const mx = (x0 + x1) / 2;
      dFore += ` C${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
    }
    const foreColor = peakLevel >= safeCap ? '#BE123C' : '#2563EB';
    const zeroY = Math.min(Tp + H, Y(chartMin));
    g += `<path d="${dFore} L${X(pts.length - 1)} ${zeroY} L${X(6)} ${zeroY}Z" fill="${foreColor}" opacity=".08"/>`;
    g += `<path d="${dFore}" fill="none" stroke="${foreColor}" stroke-width="2.5" stroke-dasharray="6 3"/>`;
  }

  // Dots and peak tag
  pts.forEach((v, i) => {
    const isPeak = (v === peakLevel && i >= 6);
    const foreColor = peakLevel >= safeCap ? '#BE123C' : '#2563EB';
    const dotColor = isPeak ? '#BE123C' : (i <= 6 ? '#0F766E' : foreColor);
    if (isPeak) {
      g += `<circle cx="${X(i)}" cy="${Y(v)}" r="7" fill="#FFF1F2" stroke="#BE123C" stroke-width="2"/>`;
      g += `<circle cx="${X(i)}" cy="${Y(v)}" r="3.5" fill="#BE123C"/>`;
      g += `<text x="${X(i)}" y="${Y(v) - 11}" font-size="9" font-weight="800" fill="#BE123C" text-anchor="middle">PEAK ${v.toFixed(2)}m</text>`;
    } else {
      g += `<circle cx="${X(i)}" cy="${Y(v)}" r="2.8" fill="${dotColor}"/>`;
    }
  });

  // Safe capacity line
  const capY = Y(safeCap);
  if (capY >= Tp && capY <= Tp + H) {
    g += `<line x1="${L}" x2="${R}" y1="${capY}" y2="${capY}" stroke="#E11D48" stroke-dasharray="5 4" stroke-width="1.5"/>`;
    g += `<text x="${L + 95}" y="${capY - 6}" font-size="9" font-weight="700" fill="#E11D48" text-anchor="middle">SAFE CAPACITY LIMIT (${safeCap.toFixed(2)} m)</text>`;
  }

  chartEl.innerHTML = g;
}

function renderRiverVillages(peakLevel, risk) {
  const tbody = $('#rv-villages-tbody');
  if (!tbody) return;

  const st = getSelectedBasinStation();
  const villageList = (st.river === "Mahaweli Ganga") ? MAHAWELI_VILLAGES : (RIVER_CONFIG.villages || []);

  let highRiskCount = 0;
  tbody.innerHTML = villageList.map(v => {
    const vPeak = peakLevel * v.riskMultiplier;
    const vRatio = (vPeak / v.safeThresholdM) * 100;
    let vRisk = 'Safe', pillClass = 'ok';
    if (vRatio >= 100) { vRisk = 'Flood Overflow'; pillClass = 'bd'; highRiskCount++; }
    else if (vRatio >= 80) { vRisk = 'Warning'; pillClass = 'bd'; highRiskCount++; }
    else if (vRatio >= 60) { vRisk = 'Watch'; pillClass = 'am'; }
    return `
      <tr>
        <td><b>${v.name}</b></td>
        <td>${v.distanceKm}</td>
        <td>${v.elevation}</td>
        <td>${v.safeThresholdM.toFixed(2)} m</td>
        <td><b>${vPeak.toFixed(2)} m</b> <span class="small">(${Math.round(vRatio)}%)</span></td>
        <td><span class="pill ${pillClass}">${vRisk}</span></td>
        <td>${v.farmers}</td>
        <td style="color:var(--body);font-size:12px">${v.actionEn}</td>
      </tr>
    `;
  }).join('');

  const summaryChip = $('#rv-villages-summary');
  if (summaryChip) {
    summaryChip.textContent = `${highRiskCount} Village${highRiskCount === 1 ? '' : 's'} at Flood Overflow Risk`;
    summaryChip.className = highRiskCount > 0 ? 'chip amb' : 'chip';
  }
}

function updateRiverSmsPreviews(exceedTime) {
  const st = getSelectedBasinStation();
  const riverName = st.river || "Yan Oya";
  const enMsg = `Flood warning: ${riverName} River may overflow by ${exceedTime}. Move livestock and equipment to higher ground. Avoid crossing the river. — Yala-Maha Assist`;
  const siTime = exceedTime.includes('Thursday') ? 'බ්‍රහස්පතින්දා සවස' : exceedTime;
  const taTime = exceedTime.includes('Thursday') ? 'வியாழன் மாலை' : exceedTime;
  const siMsg = `ගංවතුර අනතුරු ඇඟවීම: ${siTime} වන විට ${st.river === "Mahaweli Ganga" ? "මහවැලි ගඟ" : "යාන් ඔය"} පිටාර ගැලීමේ අවදානමක් ඇත. ගවයන් සහ උපකරණ උස් ස්ථානවලට ගෙන යන්න. — Yala-Maha Assist`;
  const taMsg = `வெள்ள எச்சரிக்கை: ${taTime}க்குள் ${st.river === "Mahaweli Ganga" ? "மகாவலி நதி" : "யான் ஓயா நதி"} நிரம்பி வழியக்கூடும். கால்நடைகளை உயரமான இடங்களுக்கு நகர்த்தவும். — Yala-Maha Assist`;

  if ($('#rv-prev-en')) $('#rv-prev-en').textContent = enMsg;
  if ($('#rv-prev-si')) $('#rv-prev-si').textContent = siMsg;
  if ($('#rv-prev-ta')) $('#rv-prev-ta').textContent = taMsg;
}

function evaluateAndTriggerAlert(risk, peakLevel, exceedTime) {
  const isAlertRisk = (risk === 'WARNING' || risk === 'FLOOD');
  if (isAlertRisk) {
    if (lastDispatchedRisk !== risk) {
      if (riverAutoSend) {
        dispatchSMSAlert(risk, peakLevel, exceedTime);
        lastDispatchedRisk = risk;
      } else {
        pendingOfficerAlert = { risk, peakLevel, exceedTime };
        showOfficerBanner(risk, peakLevel, exceedTime);
      }
    }
  } else {
    if (typeof floodAlertActive !== 'undefined' && floodAlertActive && (lastDispatchedRisk === 'WARNING' || lastDispatchedRisk === 'FLOOD')) {
      floodAlertActive = false;
      lastDispatchedRisk = risk;
      try { localStorage.removeItem('yala_maha_flood_alert'); } catch(e){}
      if (typeof render === 'function') render();
      toast(`River risk dropped to ${risk.toLowerCase()}. Flood alert cleared.`);
    }
    hideOfficerBanner();
  }
}

function dispatchSMSAlert(risk, peakLevel, exceedTime) {
  const st = getSelectedBasinStation();
  const safeCap = st.safeCapacity || 4.50;
  if (typeof floodAlertActive !== 'undefined') floodAlertActive = true;
  if (typeof floodPeakDisplay !== 'undefined') {
    floodPeakDisplay = `${peakLevel.toFixed(2)} m (${Math.round((peakLevel / safeCap) * 100)}%)`;
  }
  if (typeof floodTimeDisplay !== 'undefined') {
    floodTimeDisplay = {
      en: exceedTime,
      si: exceedTime.includes('Thursday') ? 'බ්‍රහස්පතින්දා සවස' : exceedTime,
      ta: exceedTime.includes('Thursday') ? 'வியாழன் மாலை' : exceedTime
    };
  }

  try {
    localStorage.setItem('yala_maha_flood_alert', JSON.stringify({
      active: true,
      risk: risk,
      peak: floodPeakDisplay,
      time: exceedTime
    }));
  } catch (e) {}

  const alertText = `Flood warning: ${st.river} River may overflow by ${exceedTime}. Move livestock…`;
  if (typeof addSmsHistoryEntry === 'function') {
    addSmsHistoryEntry([
      'Just now (River Auto)',
      RIVER_CONFIG.alerts.targetGroup || 'Downstream',
      alertText,
      String(RIVER_CONFIG.alerts.affectedFarmerCount || 412),
      'bd',
      'Delivered'
    ]);
  }

  if (typeof render === 'function') render();
  toast(`Flood warning SMS broadcast dispatched to ${RIVER_CONFIG.alerts.affectedFarmerCount || 412} farmers`);
}

function showOfficerBanner(risk, peakLevel, exceedTime) {
  const b = $('#rv-officer-banner');
  if (!b) return;
  const st = getSelectedBasinStation();
  if ($('#rv-banner-title')) $('#rv-banner-title').textContent = `${risk} Alert Detected: Officer Authorization Required`;
  if ($('#rv-banner-msg')) $('#rv-banner-msg').textContent = `${st.river} River (${st.name}) forecast to reach ${peakLevel.toFixed(2)} m by ${exceedTime}. Ready to broadcast to downstream farmers.`;
  b.style.display = 'block';
}

function hideOfficerBanner() {
  const b = $('#rv-officer-banner');
  if (b) b.style.display = 'none';
  pendingOfficerAlert = null;
}
