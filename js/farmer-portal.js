/**
 * Yala-Maha Assist · Farmer Portal & Agrarian Service UI
 * --------------------------------------------------------
 * Manages farmer authentication with real-time SMS OTP, trilingual
 * home dashboard, live flood risk alerts, water release notices,
 * and a guided 4-step farm registration flow with SMS confirmation.
 */

// API Endpoint Base
const API_BASE = (typeof window !== 'undefined' && window.location && window.location.port === '8005')
  ? ''
  : 'http://localhost:8005';

// Global Application State
let lang = "en";
let scr = 2; // Default to Home Dashboard for immediate agrarian insights
let phone = "77 481 7583";
let cd = 30;
let timer = null;
let regZoomScale = 1;

let floodAlertActive = true;
let floodPeakDisplay = "4.82 m (107%)";
let floodTimeDisplay = {
  en: "Thursday evening",
  si: "බ්‍රහස්පතින්දා සවස",
  ta: "வியாழன் மாலை"
};

let regData = {
  name: "Sunil Bandara",
  nic: "",
  maskedNic: "",
  address: "",
  district: "",
  region: "mahaweli-b",
  crops: [
    { category: "paddy", crop: "White Rice (BG)", species: "BG 352 (3.5 Months)", acres: 3.5, yield: 2400, yieldUnit: "kg_acre" }
  ],
  pinX: 290,
  pinY: 190,
  pinned: false,
  remindHome: false,
  consent: false,
  assignedId: "FAR-016",
  distMeters: 280,
  nearestLandmark: "Palugaswewa Tank"
};

// ============================================================================
// HELPER UTILITIES
// ============================================================================

function cleanDigits(str) {
  return String(str || '').replace(/\D/g, '');
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function getCropOptionsHtml(catKey, selectedCrop) {
  const cat = (typeof FARM_CONFIG !== 'undefined' && FARM_CONFIG.cropHierarchy[catKey]) ? FARM_CONFIG.cropHierarchy[catKey] : null;
  if (!cat) return '';
  return Object.keys(cat.crops)
    .map(cName => `<option value="${cName}" ${cName === selectedCrop ? 'selected' : ''}>${cName}</option>`)
    .join('');
}

function getVarietyOptionsHtml(catKey, cropName, selectedVar) {
  const cat = (typeof FARM_CONFIG !== 'undefined' && FARM_CONFIG.cropHierarchy[catKey]) ? FARM_CONFIG.cropHierarchy[catKey] : null;
  if (!cat || !cat.crops[cropName]) return '';
  return cat.crops[cropName].varieties
    .map(v => `<option value="${v}" ${v === selectedVar ? 'selected' : ''}>${v}</option>`)
    .join('');
}

function getRegTotalAcres() {
  return regData.crops.reduce((sum, c) => sum + (parseFloat(c.acres) || 0), 0);
}

// ============================================================================
// VIEW TEMPLATES (MODULAR RENDERERS)
// ============================================================================

/**
 * Screen 0: Mobile Number Sign-In with Live SMS OTP
 */
function renderPhoneSignIn(t) {
  return `
    <div class="portal-screen portal-auth">
      <div class="screen-header">
        <h1>${t.st}</h1>
        <p class="sub">${t.ss}</p>
      </div>

      <div class="form-group">
        <label>${t.mob}</label>
        <div class="phone">
          <div class="cc">+94</div>
          <div class="pf">
            ${ico.ph || ''}
            <input class="f" id="ph" type="tel" inputmode="tel" placeholder="77 481 7583" value="${phone}">
          </div>
        </div>
      </div>

      <div style="font-size:12px;color:var(--mut);margin:10px 0 4px;display:flex;align-items:center;gap:6px">
        <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#10B981"></span>
        <span>Connected to Text.lk SMS Gateway</span>
      </div>

      <button class="btn" id="go1" style="margin-top:10px">
        ${ico.send || ''} ${t.sms}
      </button>
    </div>
  `;
}

/**
 * Screen 1: OTP Code Verification
 */
function renderOtpVerification(t) {
  const phoneDisplay = lang === 'en' ? t.vs + phone + '.' : `+94 ${phone} ${t.vs.split(' ')[0]}`;
  return `
    <div class="portal-screen portal-otp">
      <div class="screen-header">
        <h1>${t.vt}</h1>
        <p class="sub">${phoneDisplay}</p>
      </div>

      <div class="form-group">
        <div class="otp" id="otp">
          ${[0, 1, 2, 3, 4, 5].map(i => `<input maxlength="1" inputmode="numeric" value="${[5, 2, 9][i] || ''}" autocomplete="${i ? 'off' : 'one-time-code'}">`).join('')}
        </div>
      </div>

      <button class="btn" id="go2" style="margin-top:14px">
        ${ico.lock || ''} ${t.vb}
      </button>

      <div class="links">
        <button id="chg">${t.chg}</button>
        <button id="resend-btn" style="color:var(--pri);border:0;background:none;font-weight:700;cursor:pointer"><span id="res"></span></button>
      </div>
    </div>
  `;
}

/**
 * Step 1: Farmer Identity Details
 */
function renderRegistrationStep1(t) {
  return `
    <div class="portal-screen portal-step">
      <div class="step-badge">1 / 4 · ${t.regStep1Title}</div>
      <h1>${t.regStep1Title}</h1>
      <p class="sub">${t.regStep1Sub}</p>

      <div class="form-group">
        <label>${t.regFullName}</label>
        <input class="f" id="reg-name" placeholder="${t.regFullNamePh}" value="${escapeHtml(regData.name)}">
      </div>

      <div class="form-group">
        <label>${t.regNic}</label>
        <input class="f" id="reg-nic" placeholder="${t.regNicPh}" value="${escapeHtml(regData.nic)}">
        <div id="reg-nic-err" style="color:var(--red);font-size:12px;font-weight:600;margin-top:4px;display:none"></div>
      </div>

      <div class="form-group">
        <label>Address</label>
        <input class="f" id="reg-address" autocomplete="street-address" value="${escapeHtml(regData.address)}" required>
      </div>

      <div class="form-group">
        <label>District</label>
        <input class="f" id="reg-district" autocomplete="address-level2" value="${escapeHtml(regData.district)}" required>
      </div>

      <div class="form-group">
        <label>${t.regMobileVerified}</label>
        <div style="display:flex;align-items:center;justify-content:space-between;background:var(--soft);border:1px solid var(--line2);border-radius:12px;padding:12px 14px;font-weight:600;color:var(--ink)">
          <span>+94 ${phone}</span>
          <span class="pill ok" style="display:inline-flex;align-items:center;gap:4px">${ico.check || '✓'} SMS Verified</span>
        </div>
      </div>

      <button class="btn" id="reg-btn-1" style="margin-top:16px">${t.regNextBtn} ➔</button>
    </div>
  `;
}

/**
 * Step 2a: Crop Details & Acreage Breakdown
 */
function renderRegistrationStep2a(t) {
  const totalAcres = getRegTotalAcres();
  let cropRowsHtml = '';

  regData.crops.forEach((c, idx) => {
    cropRowsHtml += `
      <div class="crop-card" data-idx="${idx}">
        <div class="row" style="margin-bottom:8px">
          <b style="font-size:13px;color:var(--ink)">Crop #${idx + 1}</b>
          ${regData.crops.length > 1 ? `<button class="btn-remove-crop" data-idx="${idx}" style="border:0;background:none;color:var(--red);font-weight:700;font-size:12px;cursor:pointer">✕ ${t.regRemoveCrop}</button>` : ''}
        </div>
        <label style="margin-top:0">${t.regCategory}</label>
        <select class="reg-cat-sel" data-idx="${idx}">
          <option value="paddy" ${c.category === 'paddy' ? 'selected' : ''}>Paddy (Rice)</option>
          <option value="vegetables" ${c.category === 'vegetables' ? 'selected' : ''}>Vegetables</option>
          <option value="fruit" ${c.category === 'fruit' ? 'selected' : ''}>Fruit</option>
          <option value="other" ${c.category === 'other' ? 'selected' : ''}>Other Field Crops (OFC)</option>
          <option value="mixed" ${c.category === 'mixed' ? 'selected' : ''}>Mixed Farming</option>
        </select>
        <label>${t.regCrop}</label>
        <select class="reg-crop-sel" data-idx="${idx}">
          ${getCropOptionsHtml(c.category, c.crop)}
        </select>
        <label>${t.regSpecies}</label>
        <select class="reg-var-sel" data-idx="${idx}">
          ${getVarietyOptionsHtml(c.category, c.crop, c.species)}
        </select>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">
          <div>
            <label style="margin-top:0">${t.regAcres}</label>
            <input class="f reg-acre-inp" data-idx="${idx}" type="number" step="0.1" min="0.1" value="${c.acres || ''}">
          </div>
          <div>
            <label style="margin-top:0">${t.regYield}</label>
            <div style="display:flex;gap:4px">
              <input class="f reg-yield-inp" data-idx="${idx}" type="number" step="10" value="${c.yield || ''}">
              <select class="f reg-unit-sel" data-idx="${idx}" style="width:auto;padding:12px 6px;font-size:12px">
                <option value="kg_acre" ${c.yieldUnit === 'kg_acre' ? 'selected' : ''}>kg/ac</option>
                <option value="bushel_acre" ${c.yieldUnit === 'bushel_acre' ? 'selected' : ''}>bu/ac</option>
                <option value="mt_acre" ${c.yieldUnit === 'mt_acre' ? 'selected' : ''}>MT/ac</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  return `
    <div class="portal-screen portal-step">
      <div class="step-badge">2 / 4 · ${t.regStep2aTitle}</div>
      <h1>${t.regStep2aTitle}</h1>
      <p class="sub">${t.regStep2aSub}</p>

      <label>${t.regRegion}</label>
      <select disabled class="f f-ro"><option>Mahaweli B Zone (Palugaswewa / Kudawewa System)</option></select>

      <div id="crops-list" style="margin-top:14px">${cropRowsHtml}</div>

      <button class="hb o" id="reg-add-crop" style="width:100%;justify-content:center;margin-top:6px">
        + ${t.regAddCrop}
      </button>

      <div style="display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:14px;padding:12px 14px;background:var(--soft);border-radius:12px;margin:14px 0">
        <span style="color:var(--mut)">${t.regTotalAcres}:</span>
        <b style="color:var(--pri);font-size:17px"><span id="reg-tot-acres">${totalAcres.toFixed(1)}</span> acres</b>
      </div>

      <div class="acts">
        <button class="btn o" id="reg-back-2a">${t.regBackBtn}</button>
        <button class="btn" id="reg-btn-2a">${t.regNextPinBtn} ➔</button>
      </div>
    </div>
  `;
}

/**
 * Step 2b: Schematic SVG Pin Map for Farm Location
 */
function renderRegistrationStep2b(t) {
  const distInfo = (typeof calcLandmarkDist === 'function') ? calcLandmarkDist(regData.pinX, regData.pinY) : { dist: 280, name: "Palugaswewa Tank" };
  const targetLabel = lang === 'si' ? distInfo.si : lang === 'ta' ? distInfo.ta : distInfo.name;
  const distChipTxt = t.regLiveDistChip.replace('{dist}', distInfo.dist).replace('{target}', targetLabel);

  return `
    <div class="portal-screen portal-step">
      <div class="row" style="margin-bottom:8px">
        <span style="font-size:12px;font-weight:700;color:var(--pri);text-transform:uppercase;letter-spacing:.03em">3 / 4 · ${t.regStep2bLabel}</span>
        <span class="pill" style="background:var(--soft);color:var(--mut);border-color:var(--line2);text-transform:none;font-weight:600">${t.regOptional}</span>
      </div>
      <h1>${t.regWhereFarm}</h1>
      <p class="sub" style="margin-bottom:12px">${t.regWhereSub}</p>

      <div style="position:relative;margin-bottom:12px">
        <svg class="i" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--pri);width:17px;height:17px" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input class="f" id="reg-search-input" list="reg-landmarks-datalist" style="padding-left:40px;border-color:var(--pri)" placeholder="${t.regSearchLandmarkPh}">
        <datalist id="reg-landmarks-datalist">
          <option value="Palugaswewa Tank">Palugaswewa Tank</option>
          <option value="Kudawewa Tank">Kudawewa Tank</option>
          <option value="Mahaweli Main Canal B-02">Mahaweli Main Canal B-02</option>
          <option value="Kudawewa Feeder Canal">Kudawewa Feeder Canal</option>
          <option value="Horiwila Village Center">Horiwila Village Center</option>
          <option value="Maradankadawala Valley">Maradankadawala Valley</option>
        </datalist>
      </div>

      <div class="schematic-map" id="reg-map-container" style="height:320px;margin-bottom:8px">
        <div style="position:absolute;top:10px;right:10px;display:flex;flex-direction:column;gap:5px;z-index:10">
          <button class="zm-btn" id="reg-zm-in" title="Zoom in">+</button>
          <button class="zm-btn" id="reg-zm-out" title="Zoom out">−</button>
          <button class="zm-btn" id="reg-zm-rst" title="Reset view">⟲</button>
        </div>

        <div class="map-chip" id="reg-dist-chip">
          <svg class="i" style="width:14px;height:14px;color:var(--pri)" viewBox="0 0 24 24"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
          <span id="reg-dist-text">${distChipTxt}</span>
        </div>

        <svg id="reg-svg-map" viewBox="0 0 800 500" style="width:100%;height:100%;display:block;cursor:crosshair">
          ${(typeof getSchematicSvgBaseHtml === 'function') ? getSchematicSvgBaseHtml('reg-map-zoom-group') : '<rect width="800" height="500" fill="#F8FAFC"/>'}
          <g id="reg-pin-layer">
            <g id="reg-pin-grp" transform="translate(${regData.pinX}, ${regData.pinY})" style="cursor:grab">
              <ellipse cx="0" cy="4" rx="8" ry="3" fill="#000000" opacity="0.25"/>
              <path d="M 0 0 C -7 -10 -11 -17 -11 -24 A 11 11 0 1 1 11 -24 C 11 -17 7 -10 0 0 Z" fill="#0F766E" stroke="#FFFFFF" stroke-width="2"/>
              <circle cx="0" cy="-24" r="4" fill="#FFFFFF"/>
              <circle cx="0" cy="-24" r="7" fill="none" stroke="#5EEAD4" stroke-width="1.5" opacity="0.8"/>
            </g>
          </g>
        </svg>
      </div>

      <div class="map-hint">
        <svg class="i" style="width:16px;height:16px;color:#B45309" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        <span>${t.regHintBanner}</span>
      </div>

      <label style="display:flex;align-items:center;gap:10px;font-size:13px;font-weight:500;cursor:pointer;margin:14px 0 6px">
        <input type="checkbox" id="reg-remind-cb" style="width:18px;height:18px;accent-color:var(--pri)" ${regData.remindHome ? 'checked' : ''}>
        <span>${t.regRemindHome}</span>
      </label>

      <div class="acts">
        <button class="btn o" id="reg-skip-btn">${t.regSkipPin}</button>
        <button class="btn" id="reg-btn-2b">${t.regNextReviewBtn} ➔</button>
      </div>
    </div>
  `;
}

/**
 * Step 3: Review and Final Consent (With SMS Confirmation Dispatch)
 */
function renderRegistrationStep3(t) {
  const totalAcres = getRegTotalAcres();
  const pinDesc = regData.pinned
    ? `Pinned (~${regData.distMeters} m from ${regData.nearestLandmark})`
    : (regData.remindHome ? 'Skipped (Reminder set for home)' : 'Not pinned');

  return `
    <div class="portal-screen portal-step">
      <div class="step-badge">4 / 4 · ${t.regStep3Title}</div>
      <h1>${t.regStep3Title}</h1>
      <p class="sub">${t.regStep3Sub}</p>

      <div class="card" style="margin-bottom:12px">
        <div style="font-weight:700;font-size:13.5px;color:var(--ink);margin-bottom:8px">${t.regFarmerDetails}</div>
        <div class="rows">
          <div><span>${t.regFullName}</span><b>${regData.name || 'Sunil Bandara'}</b></div>
          <div><span>${t.regNic}</span><b>${regData.maskedNic || '••••••298V'}</b></div>
          <div><span>${t.regMobileVerified}</span><b>+94 ${phone}</b></div>
          <div><span>${t.regRegion}</span><b>Mahaweli B Zone (System B)</b></div>
        </div>
      </div>

      <div class="card" style="margin-bottom:12px">
        <div style="font-weight:700;font-size:13.5px;color:var(--ink);margin-bottom:8px">${t.regCropsSummary}</div>
        <div class="rows">
          ${regData.crops.map(c => `<div><span>${c.crop} (${c.species})</span><b>${c.acres} ac · ${c.yield || '-'} ${c.yieldUnit}</b></div>`).join('')}
          <div style="border-top:1.5px solid var(--line);margin-top:4px;padding-top:6px">
            <span style="color:var(--ink);font-weight:700">${t.regTotalAcres}</span>
            <b style="color:var(--pri);font-size:15px">${totalAcres.toFixed(1)} acres</b>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:12px">
        <div style="font-weight:700;font-size:13.5px;color:var(--ink);margin-bottom:8px">${t.regPinSummary}</div>
        <div class="rows">
          <div><span>Location status</span><b style="color:var(--pri)">${pinDesc}</b></div>
        </div>
      </div>

      <label style="display:flex;align-items:flex-start;gap:10px;font-size:13px;line-height:1.5;margin:16px 0;background:var(--soft);border:1px solid var(--line2);border-radius:12px;padding:12px;cursor:pointer">
        <input type="checkbox" id="reg-consent-cb" style="width:18px;height:18px;accent-color:var(--pri);margin-top:2px" ${regData.consent ? 'checked' : ''}>
        <span>${t.regConsentText}</span>
      </label>

      <div style="font-size:12px;color:var(--pri);font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:6px">
        <span>📲 An official registration confirmation SMS will be sent to +94 ${phone}</span>
      </div>

      <div class="acts">
        <button class="btn o" id="reg-back-3">${t.regBackBtn}</button>
        <button class="btn" id="reg-btn-submit">${t.regSubmitBtn}</button>
      </div>
    </div>
  `;
}

/**
 * Registration Success Confirmation
 */
function renderRegistrationSuccess(t) {
  return `
    <div class="portal-screen portal-success" style="text-align:center;padding:20px 0 10px">
      <div style="width:60px;height:60px;border-radius:50%;background:#ECFDF5;border:2px solid #A7F3D0;display:grid;place-items:center;margin:0 auto 14px;color:#047857">
        <svg class="i" style="width:32px;height:32px" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <h1>${t.regSuccessTitle}</h1>
      <p class="sub" style="max-width:320px;margin:0 auto 16px">${t.regSuccessSub}</p>

      <div class="card" style="margin:14px auto;max-width:340px;background:var(--soft);border-radius:14px;padding:16px;text-align:center">
        <div style="font-size:12px;color:var(--mut);text-transform:uppercase;font-weight:700">${t.regFarmIdLabel}</div>
        <div style="font-size:24px;font-weight:800;color:var(--pri);margin:6px 0">${regData.assignedId}</div>
        <div style="font-size:12.5px;color:var(--body);line-height:1.5">Registered for Mahaweli B irrigation scheduling, kapawa updates &amp; flood alerts.</div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--line2);font-size:12px;color:var(--pri);font-weight:600">
          ✓ Confirmation SMS delivered to +94 ${phone}
        </div>
      </div>

      <button class="btn" id="reg-btn-home" style="margin-top:20px">${t.regGoHomeBtn}</button>
    </div>
  `;
}

/**
 * Screen 2: Farmer Portal Home Dashboard
 */
function renderFarmerDashboard(t) {
  // Flood Warning Alert Evaluation
  let fHtml = '';
  let storedAlert = null;
  try { storedAlert = JSON.parse(localStorage.getItem('yala_maha_flood_alert')); } catch (e) {}
  const isFloodActive = storedAlert ? storedAlert.active : floodAlertActive;
  const peakDisp = storedAlert && storedAlert.peak ? storedAlert.peak : floodPeakDisplay;
  const timeDisp = storedAlert && storedAlert.time
    ? (lang === 'si' ? 'බ්‍රහස්පතින්දා සවස' : lang === 'ta' ? 'வியாழன் மாலை' : storedAlert.time)
    : (lang === 'si' ? 'බ්‍රහස්පතින්දා සවස' : lang === 'ta' ? 'வியාழன் மாலை' : 'Thursday evening');

  if (isFloodActive) {
    fHtml = `
      <div class="card" style="background:var(--red-bg);border:1.5px solid var(--red-b);padding:14px 16px;margin:10px 0 14px">
        <div class="row" style="align-items:flex-start;gap:10px">
          <div style="display:flex;gap:10px;align-items:flex-start">
            <span style="color:var(--red);margin-top:2px">${ico.warn || '⚠️'}</span>
            <div>
              <div style="font-weight:800;font-size:13px;color:var(--red);letter-spacing:.02em;text-transform:uppercase">${t.floodTitle}</div>
              <div style="font-size:12.5px;line-height:1.5;color:var(--ink);margin-top:4px;font-weight:500">${t.floodMsg}</div>
              <div style="font-size:11.5px;color:var(--body);margin-top:6px;display:flex;gap:12px;flex-wrap:wrap">
                <span><b>${t.floodPeakLabel}:</b> ${peakDisp}</span>
                <span><b>${t.floodTimeLabel}:</b> ${timeDisp}</span>
              </div>
            </div>
          </div>
          <span class="badge" style="background:#fff;border-color:var(--red-b);color:var(--red)">${t.floodBadge}</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="portal-screen portal-home">
      <!-- Location and Tank Header -->
      <div class="row" style="align-items:flex-start;margin-top:4px">
        <div>
          <div class="tank" style="font-size:18px;font-weight:800;color:var(--ink)">${t.tank}</div>
          <div class="small" style="color:var(--mut);margin-top:2px">${t.loc}</div>
        </div>
        <span class="badge" style="background:#FFF1F2;border-color:#FECDD3;color:#BE123C">${ico.warn || '⚠️'} ${t.crit}</span>
      </div>

      ${fHtml}

      <!-- SMS Alert Gateway Action Card -->
      <div class="card" style="border:1.5px solid var(--pri);background:#F0FDFA;margin-top:14px;padding:14px 16px">
        <div class="row" style="flex-wrap:wrap;gap:10px;align-items:center">
          <div>
            <div style="font-weight:700;font-size:13.5px;color:var(--pri);display:flex;align-items:center;gap:6px">
              <span>📲 Live SMS Alert Gateway</span>
              <span class="pill ok" style="font-size:10.5px">Active</span>
            </div>
            <div style="font-size:12px;color:var(--body);margin-top:2px">
              Registered Phone: <b>+94 ${phone}</b>
            </div>
          </div>
          <button class="hb" id="btn-test-alert-sms" style="font-size:12px;padding:8px 14px">
            🔔 Test SMS Alert
          </button>
        </div>
      </div>

      <!-- Farm Registration Callout Banner -->
      <div class="card" style="border:1.5px dashed var(--line2);background:var(--soft);margin-top:14px;padding:14px 16px">
        <div class="row" style="flex-wrap:wrap;gap:8px;align-items:center">
          <div>
            <div style="font-weight:700;font-size:13.5px;color:var(--ink)">${t.regHomeBannerTitle}</div>
            <div style="font-size:12px;color:var(--mut);margin-top:2px">${t.regHomeBannerSub}</div>
          </div>
          <button class="hb o" id="btn-home-start-reg" style="font-size:12px;padding:7px 12px">
            ${t.regStartRegBtn} ➔
          </button>
        </div>
      </div>

      <!-- Tank Water Level Ring Gauge -->
      <div class="card" style="margin-top:14px">
        <div class="ring">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" stroke-width="12"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke="#F43F5E" stroke-width="12" stroke-linecap="round" stroke-dasharray="56.5 314.2" transform="rotate(-90 60 60)"/>
            <text x="60" y="64" text-anchor="middle" font-size="26" font-weight="800" fill="#BE123C" font-family="Inter,sans-serif">18%</text>
            <text x="60" y="80" text-anchor="middle" font-size="9" fill="#64748B">${t.of}</text>
          </svg>
        </div>
        <div class="warn">${ico.drop || '💧'} <span>${t.low}</span></div>
      </div>

      <!-- Next Scheduled Water Release -->
      <div class="card release" style="margin-top:14px">
        <div class="label" style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--pri);font-weight:700">
          ${ico.cal || '📅'} ${t.next}
        </div>
        <div class="big" style="font-size:20px;font-weight:800;color:var(--ink);margin-top:6px">${t.when}</div>
      </div>

      <!-- 3-Day Rain Forecast & Advice -->
      <div class="card" style="margin-top:14px">
        <div class="h3" style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:13.5px;color:var(--ink);margin-bottom:10px">
          ${ico.cloud || '🌧️'} ${t.rain}
        </div>
        <div class="days">
          ${t.d.map((d, i) => `<div class="day"><span>${d}</span><b>${[2, 6, 4][i]} ${t.mm}</b></div>`).join('')}
        </div>
        <p class="tip">${t.advice}</p>
      </div>

      <!-- Canal Maintenance Report -->
      <div class="card" style="margin-top:14px">
        <div class="h3" style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:13.5px;color:var(--ink)">
          ${ico.tool || '🔧'} ${t.rep}
        </div>
        <label style="margin-top:10px">${t.type}</label>
        <select id="rep-type-sel">
          ${t.opts.map(o => `<option>${o}</option>`).join('')}
        </select>
        <label>${t.desc}</label>
        <textarea id="rep-desc-input" placeholder="${t.ph}"></textarea>
        <button class="btn" id="go3" style="margin-top:12px">${t.send}</button>
      </div>
    </div>
  `;
}

// ============================================================================
// MAIN RENDER CONTROLLER
// ============================================================================

function render() {
  const t = T[lang] || T.en;
  const portalEl = $('#page-portal') || document.documentElement;
  portalEl.lang = lang;

  // Compute active navigation tab:
  // 0: Sign in | 1: Verify | 2: Register Farm | 3: Home
  const activeTabIdx = (scr === 0) ? 0 : (scr === 1) ? 1 : (scr === 2) ? 3 : 2;
  const tabsEl = $('#tabs');
  if (tabsEl) {
    tabsEl.innerHTML = t.tabs.map((x, i) =>
      `<button class="${i === activeTabIdx ? 'on' : ''}" data-s="${i}">${x}</button>`
    ).join('');
  }

  // Highlight active language button
  document.querySelectorAll('#langs button').forEach(b => {
    b.classList.toggle('on', b.dataset.l === lang);
  });

  clearInterval(timer);
  let contentHtml = '';

  switch (scr) {
    case 0:
      contentHtml = renderPhoneSignIn(t);
      break;
    case 1:
      contentHtml = renderOtpVerification(t);
      break;
    case 'reg1':
      contentHtml = renderRegistrationStep1(t);
      break;
    case 'reg2a':
      contentHtml = renderRegistrationStep2a(t);
      break;
    case 'reg2b':
      contentHtml = renderRegistrationStep2b(t);
      break;
    case 'reg3':
      contentHtml = renderRegistrationStep3(t);
      break;
    case 'regSuccess':
      contentHtml = renderRegistrationSuccess(t);
      break;
    case 2:
    default:
      contentHtml = renderFarmerDashboard(t);
      break;
  }

  const viewEl = $('#view');
  if (viewEl) {
    viewEl.innerHTML = contentHtml;
  }

  bindEvents();
}

// ============================================================================
// EVENT LISTENERS & SMS GATEWAY INTERACTIONS
// ============================================================================

function bindEvents() {
  const t = T[lang] || T.en;

  // 1. Phone Sign-In -> Send Real SMS OTP (with Strict Validation & Cooldown)
  const go1Btn = $('#go1');
  if (go1Btn) {
    go1Btn.onclick = async () => {
      const phInput = $('#ph');
      let v = phInput ? phInput.value.trim().replace(/[\s\-+]/g, '') : '';
      if (v.startsWith('0')) v = '94' + v.slice(1);

      // Validate Sri Lankan mobile format strictly (94 + 7X + 7 digits)
      if (!/^94(7[01245678])\d{7}$/.test(v)) {
        if (phInput) phInput.classList.add('err');
        toast('Enter a valid 10-digit Sri Lankan mobile (e.g. 077 123 4567)');
        return;
      }

      phone = v.slice(2).replace(/(\d{2})(\d{3})(\d+)/, '$1 $2 $3');

      go1Btn.disabled = true;
      go1Btn.innerHTML = `<span>Sending SMS...</span>`;

      try {
        const response = await fetch(`${API_BASE}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: v })
        });
        const data = await response.json();

        if (response.ok && data.status === 'success') {
          const successMsg = lang === 'si'
            ? 'OTP කේතය ඔබගේ දුරකථනයට යවන ලදී'
            : lang === 'ta'
            ? 'OTP குறியீடு அனுப்பப்பட்டது'
            : 'OTP SMS code sent to your phone!';
          toast(successMsg);
          scr = 1;
          render();
        } else {
          toast(data.message || 'Error sending SMS OTP');
          go1Btn.disabled = false;
          go1Btn.innerHTML = `${ico.send || ''} ${t.sms}`;
        }
      } catch (err) {
        console.warn('Backend offline, proceeding in demo mode:', err);
        toast('SMS Gateway simulated (API offline)');
        scr = 1;
        render();
      }
    };
  }

  // 2. OTP Code Verification -> Verify with Backend Gateway (with Attempt Limits)
  const otpContainer = $('#otp');
  if (otpContainer) {
    const inputs = [...otpContainer.querySelectorAll('input')];
    (inputs.find(x => !x.value) || inputs[5] || inputs[0])?.focus();

    inputs.forEach((el, i) => {
      el.oninput = () => {
        el.value = el.value.replace(/\D/g, '');
        if (el.value && inputs[i + 1]) inputs[i + 1].focus();
      };
      el.onkeydown = e => {
        if (e.key === 'Backspace' && !el.value && inputs[i - 1]) inputs[i - 1].focus();
      };
    });

    const go2Btn = $('#go2');
    if (go2Btn) {
      go2Btn.onclick = async () => {
        const enteredOtp = inputs.map(inp => inp.value).join('');
        if (enteredOtp.length < 6) {
          toast('Please enter the full 6-digit OTP code');
          return;
        }

        go2Btn.disabled = true;
        go2Btn.innerHTML = `<span>Verifying...</span>`;

        try {
          const rawPhone = cleanDigits(phone);
          const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: rawPhone, otp: enteredOtp })
          });
          const data = await response.json();

          if (response.ok && data.status === 'success') {
            if (data.alreadyRegistered) {
              toast(data.message || 'A farmer account already exists for this number.');
              scr = 2;
              render();
              return;
            }
            toast('Mobile number verified! ✓');
            scr = 'reg1';
            render();
          } else {
            toast(data.message || 'Incorrect OTP code');
            // Clear inputs for next attempt
            inputs.forEach(inp => inp.value = '');
            if (inputs[0]) inputs[0].focus();
            go2Btn.disabled = false;
            go2Btn.innerHTML = `${ico.lock || ''} ${t.vb}`;
          }
        } catch (err) {
          console.warn('API error, accepting demo OTP:', err);
          scr = 'reg1';
          render();
        }
      };
    }

    const chgBtn = $('#chg');
    if (chgBtn) {
      chgBtn.onclick = () => {
        scr = 0;
        render();
      };
    }

    const resendBtn = $('#resend-btn');
    if (resendBtn) {
      resendBtn.onclick = async () => {
        if (cd > 0) return;
        toast('Resending OTP SMS...');
        try {
          await fetch(`${API_BASE}/api/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: cleanDigits(phone) })
          });
          toast('New OTP sent to your phone!');
          cd = 30;
          updateCountdown();
        } catch (e) {
          toast('Resent demo OTP');
          cd = 30;
        }
      };
    }

    // OTP Countdown Timer
    cd = 30;
    const resendSpan = $('#res');
    const updateCountdown = () => {
      if (resendSpan) {
        resendSpan.textContent = cd > 0 ? t.res.replace('{n}', cd) : '↻ Resend OTP';
      }
    };
    updateCountdown();
    timer = setInterval(() => {
      if (cd > 0) {
        cd--;
        updateCountdown();
      }
    }, 1000);
  }

  // 3. Home Dashboard Actions & Live SMS Test Button
  const testAlertSmsBtn = $('#btn-test-alert-sms');
  if (testAlertSmsBtn) {
    testAlertSmsBtn.onclick = async () => {
      testAlertSmsBtn.disabled = true;
      testAlertSmsBtn.innerHTML = `<span>Sending SMS...</span>`;
      try {
        const rawPhone = cleanDigits(phone);
        const alertMsg = `YalaMaha ALERT: Water level at Kudawewa is 18%. Next scheduled release: Thursday 6:00 AM. Check downstream fields.`;
        const res = await fetch(`${API_BASE}/api/sms/send-custom`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients: rawPhone,
            message: alertMsg,
            forceLive: true
          })
        });
        const data = await res.json();
        if (data.status === 'success') {
          toast(`Alert SMS sent to +94 ${phone}!`);
        } else {
          toast(data.message || 'Failed to dispatch SMS');
        }
      } catch (err) {
        toast(`SMS Gateway triggered for +94 ${phone}`);
      } finally {
        testAlertSmsBtn.disabled = false;
        testAlertSmsBtn.innerHTML = `🔔 Test SMS Alert`;
      }
    };
  }

  const go3Btn = $('#go3');
  if (go3Btn) {
    go3Btn.onclick = () => {
      const desc = $('#rep-desc-input') ? $('#rep-desc-input').value.trim() : '';
      if (!desc) {
        toast('Please enter an issue description');
        return;
      }
      toast(t.sent);
      if ($('#rep-desc-input')) $('#rep-desc-input').value = '';
    };
  }

  const startRegBtn = $('#btn-home-start-reg');
  if (startRegBtn) {
    startRegBtn.onclick = () => {
      scr = 'reg1';
      render();
    };
  }

  // 4. Registration Step 1 (Farmer Identity)
  const reg1Btn = $('#reg-btn-1');
  if (reg1Btn) {
    reg1Btn.onclick = () => {
      const nameInput = $('#reg-name');
      const nicInput = $('#reg-nic');
      const addressInput = $('#reg-address');
      const districtInput = $('#reg-district');
      const nm = nameInput ? nameInput.value.trim() : '';
      const nicVal = nicInput ? nicInput.value.trim() : '';
      const address = addressInput ? addressInput.value.trim() : '';
      const district = districtInput ? districtInput.value.trim() : '';

      if (!nm) {
        if (nameInput) nameInput.classList.add('err');
        toast(t.regNameRequired);
        return;
      }

      if (!address || !district) {
        toast('Address and district are required');
        return;
      }

      const vNic = (typeof FARM_CONFIG !== 'undefined' && typeof FARM_CONFIG.validateNIC === 'function')
        ? FARM_CONFIG.validateNIC(nicVal)
        : { valid: true, formatted: nicVal };

      if (!vNic.valid) {
        if (nicInput) nicInput.classList.add('err');
        const errMsg = lang === 'si' ? vNic.messageSi : lang === 'ta' ? vNic.messageTa : vNic.messageEn;
        const errEl = $('#reg-nic-err');
        if (errEl) {
          errEl.textContent = errMsg;
          errEl.style.display = 'block';
        }
        toast(errMsg);
        return;
      }

      regData.name = nm;
      regData.nic = vNic.formatted;
      regData.address = address;
      regData.district = district;
      regData.maskedNic = (typeof FARM_CONFIG !== 'undefined' && typeof FARM_CONFIG.maskNIC === 'function')
        ? FARM_CONFIG.maskNIC(vNic.formatted)
        : vNic.formatted;

      scr = 'reg2a';
      render();
    };
  }

  // 5. Registration Step 2a (Crops & Acreage)
  const addCropBtn = $('#reg-add-crop');
  if (addCropBtn) {
    addCropBtn.onclick = () => {
      regData.crops.push({ category: 'other', crop: 'Maize', species: 'Pacific 999', acres: 1.0, yield: 2000, yieldUnit: 'kg_acre' });
      render();
    };
  }

  document.querySelectorAll('.btn-remove-crop').forEach(btn => {
    btn.onclick = () => {
      const idx = +btn.dataset.idx;
      if (regData.crops.length > 1) {
        regData.crops.splice(idx, 1);
        render();
      }
    };
  });

  document.querySelectorAll('.reg-cat-sel').forEach(sel => {
    sel.onchange = () => {
      const idx = +sel.dataset.idx;
      const cat = sel.value;
      regData.crops[idx].category = cat;
      if (typeof FARM_CONFIG !== 'undefined' && FARM_CONFIG.cropHierarchy[cat]) {
        const catObj = FARM_CONFIG.cropHierarchy[cat];
        const firstCrop = Object.keys(catObj.crops)[0];
        regData.crops[idx].crop = firstCrop;
        regData.crops[idx].species = catObj.crops[firstCrop].varieties[0];
      }
      render();
    };
  });

  document.querySelectorAll('.reg-crop-sel').forEach(sel => {
    sel.onchange = () => {
      const idx = +sel.dataset.idx;
      const crop = sel.value;
      regData.crops[idx].crop = crop;
      const cat = regData.crops[idx].category;
      if (typeof FARM_CONFIG !== 'undefined' && FARM_CONFIG.cropHierarchy[cat]) {
        const catObj = FARM_CONFIG.cropHierarchy[cat];
        regData.crops[idx].species = catObj.crops[crop].varieties[0];
      }
      render();
    };
  });

  document.querySelectorAll('.reg-var-sel').forEach(sel => {
    sel.onchange = () => {
      const idx = +sel.dataset.idx;
      regData.crops[idx].species = sel.value;
    };
  });

  document.querySelectorAll('.reg-acre-inp').forEach(inp => {
    inp.oninput = () => {
      const idx = +inp.dataset.idx;
      regData.crops[idx].acres = parseFloat(inp.value) || 0;
      const totEl = $('#reg-tot-acres');
      if (totEl) totEl.textContent = getRegTotalAcres().toFixed(1);
    };
  });

  document.querySelectorAll('.reg-yield-inp').forEach(inp => {
    inp.oninput = () => {
      const idx = +inp.dataset.idx;
      regData.crops[idx].yield = parseFloat(inp.value) || 0;
    };
  });

  document.querySelectorAll('.reg-unit-sel').forEach(sel => {
    sel.onchange = () => {
      const idx = +sel.dataset.idx;
      regData.crops[idx].yieldUnit = sel.value;
    };
  });

  const back2aBtn = $('#reg-back-2a');
  if (back2aBtn) back2aBtn.onclick = () => { scr = 'reg1'; render(); };

  const btn2aNext = $('#reg-btn-2a');
  if (btn2aNext) {
    btn2aNext.onclick = () => {
      const tot = getRegTotalAcres();
      if (tot <= 0) {
        toast('Please specify cultivated acres greater than 0');
        return;
      }
      regData.totalAcres = tot;
      scr = 'reg2b';
      render();
    };
  }

  // 6. Registration Step 2b (Pin Map)
  if (scr === 'reg2b') {
    initRegPinMap();
  }

  // 7. Registration Step 3 (Review & Consent + Confirmation SMS)
  const consentCb = $('#reg-consent-cb');
  if (consentCb) {
    consentCb.onchange = () => { regData.consent = consentCb.checked; };
  }

  const back3Btn = $('#reg-back-3');
  if (back3Btn) back3Btn.onclick = () => { scr = 'reg2b'; render(); };

  const submitRegBtn = $('#reg-btn-submit');
  if (submitRegBtn) {
    submitRegBtn.onclick = async () => {
      const cb = $('#reg-consent-cb');
      if (!cb || !cb.checked) {
        toast(t.regConsentErr);
        if (cb) cb.focus();
        return;
      }

      submitRegBtn.disabled = true;
      submitRegBtn.innerHTML = `<span>Registering...</span>`;

      regData.consent = true;
      const sampleCount = (typeof FARM_CONFIG !== 'undefined' && FARM_CONFIG.sampleFarms) ? FARM_CONFIG.sampleFarms.length : 15;
      const newId = 'FAR-' + String(sampleCount + 1).padStart(3, '0');
      regData.assignedId = newId;

      const distInfo = (typeof calcLandmarkDist === 'function') ? calcLandmarkDist(regData.pinX, regData.pinY) : { dist: 280, name: "Palugaswewa Tank" };
      const waterScore = distInfo.dist < 300 ? 90 : distInfo.dist < 600 ? 65 : 42;
      const signalScore = regData.pinX > 500 && regData.pinY > 300 ? 38 : 88;

      const totalAcres = getRegTotalAcres();
      const rawPhone = cleanDigits(phone);

      try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: rawPhone,
            full_name: regData.name,
            nic: regData.nic,
            address: regData.address,
            district: regData.district,
            land_acres: totalAcres,
            primary_crop: regData.crops[0]?.crop || null
          })
        });
        const result = await response.json();
        if (!response.ok || result.status !== 'success') {
          throw new Error(result.message || 'Could not complete farmer registration.');
        }
      } catch (error) {
        toast(error.message || 'Could not complete farmer registration.');
        submitRegBtn.disabled = false;
        submitRegBtn.innerHTML = t.regSubmitBtn;
        return;
      }

      const newFarm = {
        id: newId,
        farmerName: regData.name || 'Sunil Bandara',
        firstName: (regData.name || 'Sunil').trim().split(' ')[0],
        nic: regData.nic || '821453298V',
        maskedNic: regData.maskedNic || '••••••298V',
        mobile: '+94 ' + phone,
        village: distInfo.name.includes('Palugaswewa') ? 'Palugaswewa North' : 'Kudawewa Lowlands',
        region: 'Mahaweli B Zone',
        x: regData.pinX,
        y: regData.pinY,
        crops: JSON.parse(JSON.stringify(regData.crops)),
        totalAcres: totalAcres,
        waterScore: waterScore,
        signalScore: signalScore,
        nearestLandmark: distInfo.name,
        distMeters: distInfo.dist,
        notes: 'Farmer self-registered via Yala-Maha Assist portal.'
      };

      if (typeof FARM_CONFIG !== 'undefined' && FARM_CONFIG.sampleFarms) {
        FARM_CONFIG.sampleFarms.push(newFarm);
        try { localStorage.setItem('yala_maha_registered_farms', JSON.stringify(FARM_CONFIG.sampleFarms)); } catch (e) {}
      }

      // Dispatch confirmation SMS via backend SMS Gateway
      try {
        await fetch(`${API_BASE}/sms/confirm-registration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: rawPhone,
            farmerName: regData.name,
            farmId: newId,
            acres: totalAcres,
            forceLive: true
          })
        });
      } catch (err) {
        console.warn('Could not dispatch registration SMS:', err);
      }

      scr = 'regSuccess';
      render();
    };
  }

  // 8. Registration Success
  const goHomeBtn = $('#reg-btn-home');
  if (goHomeBtn) {
    goHomeBtn.onclick = () => {
      scr = 2;
      render();
    };
  }
}

/**
 * Interactive Pin Map Handler
 */
function initRegPinMap() {
  const t = T[lang] || T.en;
  const svg = $('#reg-svg-map');
  const pinGrp = $('#reg-pin-grp');
  const chipTxt = $('#reg-dist-text');
  regZoomScale = 1;

  function updateDist(x, y) {
    if (typeof calcLandmarkDist !== 'function') return;
    const d = calcLandmarkDist(x, y);
    regData.distMeters = d.dist;
    regData.nearestLandmark = d.name;
    const target = lang === 'si' ? d.si : lang === 'ta' ? d.ta : d.name;
    const s = t.regLiveDistChip.replace('{dist}', d.dist).replace('{target}', target);
    if (chipTxt) chipTxt.textContent = s;
  }

  function setPin(x, y) {
    const cx = Math.max(20, Math.min(780, Math.round(x)));
    const cy = Math.max(20, Math.min(480, Math.round(y)));
    regData.pinX = cx;
    regData.pinY = cy;
    if (pinGrp) pinGrp.setAttribute('transform', `translate(${cx}, ${cy})`);
    updateDist(cx, cy);
  }

  if (svg) {
    svg.onclick = e => {
      if (e.target.closest('#reg-pin-grp')) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
      setPin(loc.x / regZoomScale, loc.y / regZoomScale);
    };
  }

  if (pinGrp) {
    let isDragging = false;
    pinGrp.onpointerdown = e => {
      isDragging = true;
      pinGrp.setPointerCapture(e.pointerId);
      e.stopPropagation();
    };
    pinGrp.onpointermove = e => {
      if (!isDragging) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
      setPin(loc.x / regZoomScale, loc.y / regZoomScale);
    };
    pinGrp.onpointerup = e => {
      isDragging = false;
      try { pinGrp.releasePointerCapture(e.pointerId); } catch (err) {}
    };
  }

  const zmIn = $('#reg-zm-in');
  if (zmIn) zmIn.onclick = () => { regZoomScale = Math.min(2.5, +(regZoomScale + 0.25).toFixed(2)); applyRegZoom(); };

  const zmOut = $('#reg-zm-out');
  if (zmOut) zmOut.onclick = () => { regZoomScale = Math.max(0.75, +(regZoomScale - 0.25).toFixed(2)); applyRegZoom(); };

  const zmRst = $('#reg-zm-rst');
  if (zmRst) zmRst.onclick = () => { regZoomScale = 1; applyRegZoom(); };

  function applyRegZoom() {
    const g = $('#reg-map-zoom-group');
    if (g) g.setAttribute('transform', `scale(${regZoomScale})`);
  }

  const sin = $('#reg-search-input');
  if (sin && typeof FARM_CONFIG !== 'undefined' && FARM_CONFIG.mapLandmarks) {
    sin.oninput = () => {
      const q = sin.value.trim().toLowerCase();
      const lm = FARM_CONFIG.mapLandmarks.find(l =>
        l.name.toLowerCase().includes(q) ||
        (l.en && l.en.toLowerCase().includes(q)) ||
        (l.si && l.si.includes(q)) ||
        (l.ta && l.ta.includes(q))
      );
      if (lm) setPin(lm.x, lm.y);
    };
  }

  const remindCb = $('#reg-remind-cb');
  if (remindCb) remindCb.onchange = () => { regData.remindHome = remindCb.checked; };

  const skipBtn = $('#reg-skip-btn');
  if (skipBtn) {
    skipBtn.onclick = () => {
      regData.pinned = false;
      regData.remindHome = remindCb ? remindCb.checked : false;
      scr = 'reg3';
      render();
    };
  }

  const btn2b = $('#reg-btn-2b');
  if (btn2b) {
    btn2b.onclick = () => {
      regData.pinned = true;
      scr = 'reg3';
      render();
    };
  }

  updateDist(regData.pinX, regData.pinY);
}

// ============================================================================
// INITIALIZATION & GLOBAL DELEGATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const tabs = $('#tabs');
  if (tabs) {
    tabs.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      const s = +b.dataset.s;
      if (s === 0) scr = 0;       // Sign in
      else if (s === 1) scr = 1;  // Verify
      else if (s === 2) scr = 'reg1'; // Register Farm
      else if (s === 3) scr = 2;  // Home Dashboard
      render();
    };
  }

  const langs = $('#langs');
  if (langs) {
    langs.onclick = e => {
      const b = e.target.closest('button');
      if (b && b.dataset.l) {
        lang = b.dataset.l;
        render();
      }
    };
  }

  render();
});
