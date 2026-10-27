import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { translate } from '../i18n.js';
import { CROP_CATALOG, SEED_ALERTS, SEED_REPORTS } from '../data.js';
import * as authApi from '../api/auth.js';

const STORAGE_KEY = 'yma-state-v1';

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    // Sessions from the offline demo have no server account behind them: sign them out.
    if (saved?.user && !saved.user.farmerId && !saved.user.pendingRegistration) {
      return { ...saved, user: null, farm: null };
    }
    // Water-release alerts saved under their old name
    if (saved?.alerts) {
      saved.alerts = saved.alerts.map((a) => (a.kind === 'kapawa'
        ? { ...a, kind: 'release', title: a.title.replace(/^Kapawa/, 'Water release') }
        : a));
    }
    return saved;
  } catch {
    return null;
  }
}

function save(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — app still works in memory */
  }
}

export const newCrop = () => ({
  id: Math.random().toString(36).slice(2, 9),
  category: 'paddy',
  type: 'White Rice (BG)',
  variety: 'BG 352 (3.5 months)',
  acres: 1,
  yield: '',
  unit: 'kg',
});

export const emptyDraft = () => ({ name: '', nic: '', address: '', district: '', division: '', crops: [newCrop()], pin: null, nearest: null, nearWater: null, water: null, located: false, consent: false });

const defaults = {
  lang: 'en',
  onboarded: false,
  user: null, // { phone, farmerId } once signed in; { phone, pendingRegistration } between OTP and registration
  farm: null, // registered farm
  draft: emptyDraft(),
  reports: SEED_REPORTS,
  alerts: SEED_ALERTS,
  smsEnabled: true,
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(() => ({ ...defaults, ...(load() || {}) }));
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();

  useEffect(() => { save(state); }, [state]);
  useEffect(() => { document.documentElement.lang = state.lang; }, [state.lang]);

  const update = useCallback((patch) => setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) })), []);

  const t = useCallback((key) => translate(state.lang, key), [state.lang]);

  const showToast = useCallback((text, tone = 'ok') => {
    clearTimeout(toastTimer.current);
    setToast({ text, tone, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const value = useMemo(() => ({
    ...state, update, t, toast, showToast,
    logout: () => {
      authApi.logout().catch(() => { /* session is cleared locally either way */ });
      setState((s) => ({ ...s, user: null }));
    },
    resetAll: () => {
      authApi.logout().catch(() => {});
      setState({ ...defaults });
    },
  }), [state, update, t, toast, showToast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

// helpers

// A crop row from the API (farm_crops) as the app's crop. Names the catalog doesn't know
// (e.g. 'paddy' from older registrations) fall back to the category's first type and variety.
function cropFromApi(crop) {
  const category = CROP_CATALOG[crop.category] ? crop.category
    : Object.keys(CROP_CATALOG).find((c) => CROP_CATALOG[c].types[crop.crop_type]) || 'paddy';
  const types = CROP_CATALOG[category].types;
  const type = types[crop.crop_type] ? crop.crop_type : Object.keys(types)[0];
  return {
    ...newCrop(),
    category,
    type,
    variety: types[type].includes(crop.variety) ? crop.variety : types[type][0],
    acres: Number(crop.acres) || 1,
    yield: crop.last_yield == null ? '' : String(Number(crop.last_yield)),
    unit: crop.yield_unit || 'kg',
  };
}

// The farm part of a register / PUT /api/auth/farm request, from the registration draft.
export function farmPayload(draft) {
  const number = (v) => { const n = Number(String(v).replace(/,/g, '')); return v === '' || !Number.isFinite(n) ? null : n; };
  return {
    water_source: draft.water?.source || null,
    water_name: draft.water?.name?.trim() || null,
    location_label: draft.nearest || null,
    crops: draft.crops.map((c) => ({
      category: c.category, crop_type: c.type, variety: c.variety, acres: Number(c.acres), last_yield: number(c.yield), yield_unit: c.unit,
    })),
  };
}

// Farm for the app built from the API's farmer record and its farm details (farmer.farm).
// `tankName` is the name of the farmer's reservoir_id, looked up by the caller.
export function farmFromProfile(farmer, tankName = null) {
  const details = farmer.farm;
  const crops = details?.crops?.length
    ? details.crops.map(cropFromApi)
    : [cropFromApi({ crop_type: farmer.primary_crop, acres: farmer.land_acres })];
  const water = details?.water_source ? { source: details.water_source, name: details.water_name || '' }
    : tankName ? { source: 'tank', name: tankName } : null;
  const lat = farmer.farm_latitude != null ? Number(farmer.farm_latitude) : null;
  const lng = farmer.farm_longitude != null ? Number(farmer.farm_longitude) : null;
  return {
    ...emptyDraft(),
    id: farmer.farm_id,
    name: farmer.full_name,
    address: farmer.address || '',
    district: farmer.district || '',
    division: farmer.division || '',
    phone: farmer.phone,
    crops,
    pin: lat != null ? { lat, lng } : null,
    located: lat != null,
    nearest: details?.location_label || [farmer.division, farmer.district].filter(Boolean).join(', '),
    water,
    reservoirId: farmer.reservoir_id ?? null,
    registeredAt: Date.parse(farmer.created_at) || Date.now(),
  };
}

export async function loadFarm(farmer) {
  const tankName = farmer.farm?.water_source ? null : await authApi.findReservoirName(farmer.reservoir_id).catch(() => null);
  return farmFromProfile(farmer, tankName);
}

export function maskPhone(phone) {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '').slice(-9); // 7XXXXXXXX
  return `+94 ${d.slice(0, 2)} ••• ${d.slice(-4)}`;
}

export function formatPhone(phone) {
  const d = phone.replace(/\D/g, '').slice(-9);
  return `+94 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
}

export function normalizePhone(input) {
  let d = input.replace(/\D/g, '');
  if (d.startsWith('94')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  return /^7\d{8}$/.test(d) ? `+94${d}` : null;
}

export function nicInfo(nic) {
  const v = nic.trim().toUpperCase();
  if (/^\d{9}[VX]$/.test(v)) return { valid: true, format: 'old', masked: `${v.slice(0, 4)}•••${v.slice(-3)}` };
  if (/^(19|20)\d{10}$/.test(v)) return { valid: true, format: 'new', masked: `${v.slice(0, 4)}•••••${v.slice(-3)}` };
  return { valid: false };
}

export function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return 'goodMorning';
  if (h < 17) return 'goodAfternoon';
  return 'goodEvening';
}
