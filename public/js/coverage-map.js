/**
 * Yala-Maha Assist · Officer Farm Coverage Map Module
 * ----------------------------------------------------
 * Schematic interactive map displaying Mahaweli B Zone agricultural plots,
 * dual-axis coverage evaluation (water supply vs mobile/SMS signal),
 * privacy-safe popup inspect cards (first name only), and low-coverage table.
 */

let mapMode = 'combined'; // 'combined' | 'water' | 'signal'
let mapFilters = {
  level: 'all',
  crop: 'all',
  village: 'all'
};
let mapZoomScale = 1;

function initCoverageMap() {
  const modeSeg = $('#map-mode-seg');
  if (modeSeg) {
    modeSeg.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      mapMode = b.dataset.m;
      $$('#map-mode-seg button').forEach(x => x.classList.toggle('on', x === b));
      renderCoverageMap();
    };
  }

  ['level', 'crop', 'village'].forEach(k => {
    const sel = $('#map-filter-' + k);
    if (sel) {
      sel.onchange = () => {
        mapFilters[k] = sel.value;
        renderCoverageMap();
      };
    }
  });

  if ($('#map-zm-in')) $('#map-zm-in').onclick = () => { mapZoomScale = Math.min(2.5, +(mapZoomScale + 0.25).toFixed(2)); applyMapZoom(); };
  if ($('#map-zm-out')) $('#map-zm-out').onclick = () => { mapZoomScale = Math.max(0.75, +(mapZoomScale - 0.25).toFixed(2)); applyMapZoom(); };
  if ($('#map-zm-rst')) $('#map-zm-rst').onclick = () => { mapZoomScale = 1; applyMapZoom(); };
  if ($('#popup-close-btn')) $('#popup-close-btn').onclick = () => {
    const pop = $('#map-farm-popup');
    if (pop) pop.style.display = 'none';
  };

  if ($('#map-btn-sms')) {
    $('#map-btn-sms').onclick = () => {
      if (typeof show === 'function') show('sms');
      const allFarms = (typeof FARM_CONFIG !== 'undefined' && FARM_CONFIG.sampleFarms) ? FARM_CONFIG.sampleFarms : [];
      const lowCount = allFarms.filter(f => Math.min(f.waterScore, f.signalScore) < 70).length || 8;
      if ($('#s1')) $('#s1').textContent = String(lowCount);
      if ($('#rc')) $('#rc').textContent = String(lowCount);
      if ($('#rb')) $('#rb').textContent = lowCount + ' recipients';
      if ($('#msg')) $('#msg').value = 'Urgent notice for Mahaweli B low-coverage farm plots: Water schedule adjustment in progress.';
      toast('Switched to SMS Gateway with ' + lowCount + ' vulnerable farmers selected');
    };
  }

  if ($('#map-btn-refresh')) {
    $('#map-btn-refresh').onclick = () => {
      renderCoverageMap();
      toast('Farm coverage data refreshed from registry');
    };
  }

  renderCoverageMap();
}

function applyMapZoom() {
  const g = $('#officer-map-zoom-group');
  if (g) g.setAttribute('transform', `scale(${mapZoomScale})`);
}

function getFilteredFarms() {
  const farms = (typeof FARM_CONFIG !== 'undefined' && FARM_CONFIG.sampleFarms) ? FARM_CONFIG.sampleFarms : [];
  return farms.filter(f => {
    const score = mapMode === 'water' ? f.waterScore : mapMode === 'signal' ? f.signalScore : Math.min(f.waterScore, f.signalScore);
    if (mapFilters.level === 'good' && score < 70) return false;
    if (mapFilters.level === 'low' && (score < 40 || score >= 70)) return false;
    if (mapFilters.level === 'veryLow' && score >= 40) return false;
    if (mapFilters.crop !== 'all' && !f.crops.some(c => c.category === mapFilters.crop)) return false;
    if (mapFilters.village !== 'all' && !f.village.toLowerCase().includes(mapFilters.village.toLowerCase())) return false;
    return true;
  });
}

function renderCoverageMap() {
  const allFarms = (typeof FARM_CONFIG !== 'undefined' && FARM_CONFIG.sampleFarms) ? FARM_CONFIG.sampleFarms : [];
  const filtered = getFilteredFarms();

  // Summary Stat Cards
  const totAcres = allFarms.reduce((s, f) => s + (f.totalAcres || 0), 0);
  const lowWater = allFarms.filter(f => f.waterScore < 70).length;
  const lowSignal = allFarms.filter(f => f.signalScore < 70).length;
  const critSignal = allFarms.filter(f => f.signalScore < 40).length;

  if ($('#map-stat-farms')) $('#map-stat-farms').textContent = allFarms.length;
  if ($('#map-stat-acres')) $('#map-stat-acres').textContent = totAcres.toFixed(1);
  if ($('#map-stat-low-water')) $('#map-stat-low-water').textContent = lowWater;
  if ($('#map-stat-low-signal')) $('#map-stat-low-signal').textContent = lowSignal;
  if ($('#map-pill-signal')) $('#map-pill-signal').textContent = `${critSignal} Critical (<40%)`;

  // Draw SVG
  const g = $('#officer-map-zoom-group');
  if (g && typeof getSchematicSvgBaseHtml === 'function') {
    let svgContent = getSchematicSvgBaseHtml('officer-map-inner-base');
    let pinsSvg = '<g id="officer-pins-layer">';
    filtered.forEach(f => {
      const score = mapMode === 'water' ? f.waterScore : mapMode === 'signal' ? f.signalScore : Math.min(f.waterScore, f.signalScore);
      const col = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
      pinsSvg += `
        <g class="map-farm-pin" data-fid="${f.id}" transform="translate(${f.x}, ${f.y})" style="cursor:pointer">
          <ellipse cx="0" cy="4" rx="7" ry="2.5" fill="#000000" opacity="0.22"/>
          <path d="M 0 0 C -6 -8 -9 -14 -9 -20 A 9 9 0 1 1 9 -20 C 9 -14 6 -8 0 0 Z" fill="${col}" stroke="#FFFFFF" stroke-width="1.5"/>
          <circle cx="0" cy="-20" r="3.2" fill="#FFFFFF"/>
          <text x="0" y="15" text-anchor="middle" font-size="9" font-weight="700" fill="#0F172A" stroke="#FFFFFF" stroke-width="2.5" paint-order="stroke">${f.firstName}</text>
        </g>
      `;
    });
    pinsSvg += '</g>';
    g.innerHTML = svgContent + pinsSvg;

    $$('.map-farm-pin').forEach(pin => {
      pin.onclick = e => {
        e.stopPropagation();
        const fid = pin.dataset.fid;
        const f = allFarms.find(x => x.id === fid);
        if (f) showFarmDetailPopup(f, pin);
      };
    });
  }

  // Populate Low Coverage Table
  const lowFarms = allFarms.filter(f => f.waterScore < 70 || f.signalScore < 70);
  const tbody = $('#map-farms-tbody');
  if (tbody) {
    tbody.innerHTML = lowFarms.map(f => {
      const wPill = f.waterScore >= 70 ? 'ok' : f.waterScore >= 40 ? 'am' : 'bd';
      const sPill = f.signalScore >= 70 ? 'ok' : f.signalScore >= 40 ? 'am' : 'bd';
      const isBoth = f.waterScore < 70 && f.signalScore < 70;
      const defPill = isBoth ? '<span class="pill bd">Water & Signal</span>' : f.waterScore < 70 ? '<span class="pill am">Low Water Access</span>' : '<span class="pill bd">Weak Signal</span>';
      const act = f.signalScore < 40 ? '<span class="pill bd">Physical Officer Visit</span>' : '<span class="pill ok">SMS Dispatch Ready</span>';
      return `
        <tr>
          <td><b>${f.id}</b></td>
          <td><b>${f.firstName}</b></td>
          <td>${f.village}</td>
          <td>${f.crops[0].crop} (${f.totalAcres} ac)</td>
          <td><span class="pill ${wPill}">${f.waterScore}%</span></td>
          <td><span class="pill ${sPill}">${f.signalScore}%</span></td>
          <td>${defPill}</td>
          <td>${act}</td>
        </tr>
      `;
    }).join('');

    if ($('#map-table-summary')) {
      $('#map-table-summary').textContent = `${lowFarms.length} Farms Require Action`;
    }
  }
}

function showFarmDetailPopup(f, pinEl) {
  const pop = $('#map-farm-popup');
  if (!pop) return;

  if ($('#popup-farmer-name')) $('#popup-farmer-name').textContent = f.firstName;
  if ($('#popup-farmer-village')) $('#popup-farmer-village').textContent = f.village;
  if ($('#popup-crop-info')) $('#popup-crop-info').textContent = `${f.crops[0].crop} (${f.crops[0].species || ''}) · ${f.totalAcres} acres`;

  const wColor = f.waterScore >= 70 ? '#10B981' : f.waterScore >= 40 ? '#F59E0B' : '#EF4444';
  const sColor = f.signalScore >= 70 ? '#10B981' : f.signalScore >= 40 ? '#F59E0B' : '#EF4444';

  if ($('#popup-water-val')) {
    $('#popup-water-val').textContent = `${f.waterScore}% (${f.waterScore >= 70 ? 'Good' : f.waterScore >= 40 ? 'Low' : 'Critical'})`;
    $('#popup-water-val').style.color = wColor;
  }
  if ($('#popup-water-bar')) {
    $('#popup-water-bar').style.width = f.waterScore + '%';
    $('#popup-water-bar').style.background = wColor;
  }

  if ($('#popup-signal-val')) {
    $('#popup-signal-val').textContent = `${f.signalScore}% (${f.signalScore >= 70 ? 'Good' : f.signalScore >= 40 ? 'Low' : 'Critical'})`;
    $('#popup-signal-val').style.color = sColor;
  }
  if ($('#popup-signal-bar')) {
    $('#popup-signal-bar').style.width = f.signalScore + '%';
    $('#popup-signal-bar').style.background = sColor;
  }

  const pill = $('#popup-action-pill');
  if (pill) {
    if (f.signalScore < 40) {
      pill.className = 'pill bd';
      pill.textContent = 'Physical Visit Needed';
    } else {
      pill.className = 'pill ok';
      pill.textContent = 'SMS Reachable';
    }
  }

  const container = $('#officer-map-container');
  if (container) {
    const cRect = container.getBoundingClientRect();
    const pRect = pinEl.getBoundingClientRect();
    let left = pRect.left - cRect.left + 15;
    let top = pRect.top - cRect.top - 40;
    if (left + 290 > cRect.width) left = cRect.width - 300;
    if (top < 10) top = 10;
    if (top + 260 > cRect.height) top = cRect.height - 270;
    pop.style.left = Math.max(10, left) + 'px';
    pop.style.top = Math.max(10, top) + 'px';
    pop.style.display = 'block';
  }
}
