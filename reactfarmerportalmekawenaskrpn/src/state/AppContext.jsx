import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { translate } from '../i18n.js';
import { SEED_ALERTS, SEED_REPORTS } from '../data.js';

const STORAGE_KEY = 'yma-state-v1';

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
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

export const emptyDraft = () => ({ name: '', nic: '', crops: [newCrop()], pin: null, nearest: null, nearWater: null, water: null, remindLater: false, consent: false });

const defaults = {
  lang: 'en',
  onboarded: false,
  user: null, // { phone }
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
  const [sms, setSms] = useState(null);
  const toastTimer = useRef();
  const smsTimer = useRef();

  useEffect(() => { save(state); }, [state]);
  useEffect(() => { document.documentElement.lang = state.lang; }, [state.lang]);

  const update = useCallback((patch) => setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) })), []);

  const t = useCallback((key) => translate(state.lang, key), [state.lang]);

  const showToast = useCallback((text, tone = 'ok') => {
    clearTimeout(toastTimer.current);
    setToast({ text, tone, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  // Simulates an incoming SMS banner (as the phone would show it).
  const showSms = useCallback((body, from = 'Text.lk') => {
    clearTimeout(smsTimer.current);
    setSms({ body, from, id: Date.now() });
    smsTimer.current = setTimeout(() => setSms(null), 6000);
  }, []);

  const value = useMemo(() => ({
    ...state, update, t, toast, showToast, sms, showSms, dismissSms: () => setSms(null),
    logout: () => setState((s) => ({ ...s, user: null })),
    resetAll: () => { setState({ ...defaults }); },
  }), [state, update, t, toast, showToast, sms, showSms]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

// helpers
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
