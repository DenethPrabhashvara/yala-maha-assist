/**
 * Yala-Maha Assist · Main Application Controller
 * -----------------------------------------------
 * Handles page navigation across Dashboard, River, Coverage Map, SMS Gateway,
 * and Farmer Portal, along with global event dispatch and module initialization.
 */

const PAGE_PATHS = {
  dash: '/dashboard',
  river: '/river',
  map: '/map',
  sms: '/sms',
  portal: '/portal'
};

const PATH_PAGES = {
  '/': 'dash',
  '/dashboard': 'dash',
  '/river': 'river',
  '/map': 'map',
  '/coverage-map': 'map',
  '/sms': 'sms',
  '/sms-gateway': 'sms',
  '/portal': 'portal',
  '/farmer-portal': 'portal'
};

function show(p, updateUrl = true) {
  if (!PAGE_PATHS[p]) return;

  $$('.page').forEach(e => e.classList.toggle('on', e.id === 'page-' + p));
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.p === p));

  if (updateUrl && window.location.pathname !== PAGE_PATHS[p]) {
    window.history.pushState({ page: p }, '', PAGE_PATHS[p]);
  }

  const locEl = $('#loc');
  if (locEl) {
    if (p === 'river' && typeof getSelectedBasinStation === 'function') {
      const st = getSelectedBasinStation();
      locEl.textContent = `${st.river} · ${st.name}`;
    } else {
      locEl.textContent = p === 'dash' ? 'Palugaswewa Tank'
        : p === 'river' ? 'Yan Oya River Basin'
        : p === 'map' ? 'Mahaweli B Zone'
        : 'Palugaswewa Chain';
    }
  }

  window.scrollTo(0, 0);

  if (p === 'river' && typeof renderRiverPage === 'function') {
    renderRiverPage();
  }
  if (p === 'map' && typeof renderCoverageMap === 'function') {
    renderCoverageMap();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const page = PATH_PAGES[window.location.pathname.replace(/\/$/, '') || '/'] || 'dash';

  // Navigation tabs
  const navEl = $('#nav');
  if (navEl) {
    navEl.onclick = e => {
      const b = e.target.closest('button');
      if (b && b.dataset.p) show(b.dataset.p);
    };
  }

  // Header quick actions
  const qbBtn = $('#qb');
  if (qbBtn) {
    qbBtn.onclick = () => {
      show('sms');
      const msgInput = $('#msg');
      if (msgInput) msgInput.focus();
    };
  }

  const soBtn = $('#so');
  if (soBtn) {
    soBtn.onclick = () => toast('Signed out (demo)');
  }

  // Farmer portal tabs & language switcher
  const portalTabs = $('#tabs');
  if (portalTabs) {
    portalTabs.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      const s = +b.dataset.s;
      if (s === 0) scr = 0;
      else if (s === 1) scr = 1;
      else if (s === 2) scr = 'reg1';
      else if (s === 3) scr = 2;
      if (typeof render === 'function') render();
    };
  }

  const langsEl = $('#langs');
  if (langsEl) {
    langsEl.onclick = e => {
      const b = e.target.closest('button');
      if (b && b.dataset.l) {
        lang = b.dataset.l;
        if (typeof render === 'function') render();
      }
    };
  }

  // Initialize modules
  if (typeof initDashboard === 'function') initDashboard();
  if (typeof initSmsGateway === 'function') initSmsGateway();
  if (typeof initCoverageMap === 'function') initCoverageMap();
  if (typeof initRiverPage === 'function') initRiverPage();
  if (typeof render === 'function') render();

  show(page, false);
});

window.addEventListener('popstate', () => {
  const page = PATH_PAGES[window.location.pathname.replace(/\/$/, '') || '/'] || 'dash';
  show(page, false);
});
