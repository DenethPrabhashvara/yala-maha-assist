import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useApp } from '../state/AppContext.jsx';
import { LANGS } from '../i18n.js';

// Yala Maha emblem (water drop + rice stalk), on its own off-white tile so it reads on light and dark screens.
export function Logo({ size = 48 }) {
  return (
    <span className="logo" style={{ width: size, height: size }}>
      <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={size} height={size} draggable="false" />
    </span>
  );
}

export function IconBtn({ icon, label, onClick, to, variant = 'light', badge, size = 48 }) {
  const cls = `icon-btn ${variant}`;
  const style = { width: size, height: size };
  const inner = (
    <>
      <Icon name={icon} size={20} stroke={2.2} />
      {badge ? <span className="dot-badge" /> : null}
    </>
  );
  if (to) return <Link to={to} className={cls} style={style} aria-label={label}>{inner}</Link>;
  return <button type="button" className={cls} style={style} aria-label={label} onClick={onClick}>{inner}</button>;
}

export function PrimaryBtn({ children, to, onClick, disabled, icon = 'arrow', type = 'button', tone = 'dark' }) {
  const content = (
    <>
      <span>{children}</span>
      <span className="pb-circle"><Icon name={icon} size={20} stroke={2.4} /></span>
    </>
  );
  const cls = `primary-btn ${tone}${disabled ? ' disabled' : ''}`;
  if (to && !disabled) return <Link to={to} className={cls}>{content}</Link>;
  return <button type={type} className={cls} onClick={onClick} disabled={disabled}>{content}</button>;
}

// Standard iOS-style status: a tinted symbol followed by the word, no background block.
const STATUS = {
  safe: ['ok', 'checkCircle'], stable: ['ok', 'checkCircle'], fixed: ['ok', 'checkCircle'],
  watch: ['warn', 'warn'], low: ['warn', 'warn'], lowWater: ['warn', 'warn'], inProgress: ['warn', 'clock'],
  critical: ['danger', 'stop'], spill: ['danger', 'stop'],
  received: ['info', 'inbox'],
};

export function StatusLabel({ status, children }) {
  const [tone, icon] = STATUS[status] || ['info', 'info'];
  return <span className={`status-label sl-${tone}`}><Icon name={icon} size={16} stroke={2.4} />{children}</span>;
}

export function StatusPill({ status, t }) {
  return <StatusLabel status={status}>{t(status)}</StatusLabel>;
}

export function LangSwitch({ compact }) {
  const { lang, update } = useApp();
  if (compact) {
    const idx = LANGS.findIndex((l) => l.code === lang);
    const nextLang = LANGS[(idx + 1) % LANGS.length];
    return (
      <button type="button" className="lang-chip" onClick={() => update({ lang: nextLang.code })} aria-label="Change language">
        <b>{LANGS[idx].short}</b>
        <span>{LANGS.filter((l) => l.code !== lang).map((l) => l.short).join(' · ')}</span>
      </button>
    );
  }
  return (
    <div className="seg seg-white" role="radiogroup" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l.code} type="button" role="radio" aria-checked={lang === l.code}
          className={lang === l.code ? 'on-accent' : ''} onClick={() => update({ lang: l.code })}
          style={{ fontFamily: l.code === 'si' ? 'Noto Sans Sinhala' : l.code === 'ta' ? 'Noto Sans Tamil' : undefined }}>
          {l.label}
        </button>
      ))}
    </div>
  );
}

export function StepHeader({ step, total = 4, title, backTo, closeTo, onClose, closeLabel = 'Close', right }) {
  const { t } = useApp();
  const navigate = useNavigate();
  const done = Math.floor(step);
  return (
    <>
      <div className="row gap10">
        {onClose
          ? <IconBtn icon="close" label={closeLabel} onClick={onClose} />
          : closeTo
          ? <IconBtn icon="close" label="Close" to={closeTo} />
          : <IconBtn icon="back" label={t('back')} onClick={() => (backTo ? navigate(backTo) : navigate(-1))} />}
        <div className="grow center fw600 f15">{title || t('registerFarm')}</div>
        {right || <span className="chip-dark">{Math.ceil(step)} / {total}</span>}
      </div>
      <div className="progress" aria-label={`${t('step')} ${Math.ceil(step)} / ${total}`}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`pg ${i < done ? 'done' : ''} ${i === done && step % 1 ? 'half' : ''}`} />
        ))}
      </div>
    </>
  );
}

export function BottomNav() {
  const { t } = useApp();
  const items = [
    { to: '/home', icon: 'home', label: t('home') },
    { to: '/water', icon: 'drop', label: t('water') },
    { to: '/report', icon: 'pencil', label: t('report') },
    { to: '/fields', icon: 'map', label: t('fields') },
    { to: '/profile', icon: 'user', label: t('profile') },
  ];
  // Every item is a section people navigate to; the bar never carries actions.
  return (
    <nav className="bottom-nav" aria-label="Main">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to}
          className={({ isActive }) => `bn-item ${isActive ? 'active' : ''}`}>
          <Icon name={it.icon} size={22} stroke={2} />
          <span className="bn-label">{it.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className={`toast t-${toast.tone}`} role="status" key={toast.id}>
      <Icon name={toast.tone === 'error' ? 'info' : 'check'} size={18} stroke={2.6} />
      <span>{toast.text}</span>
    </div>
  );
}

export function OfflineBanner() {
  const { t } = useApp();
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && navigator.onLine === false);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (!offline) return null;
  return <div className="offline-banner" role="alert"><Icon name="wifiOff" size={16} />{t('offline')}</div>;
}

// CSS-drawn aerial field tile with an outlined plot
// `photo` swaps the drawn field pattern for a real picture (the plot outline is hidden).
export function Aerial({ variant = 'a', height = 110, plot = 'accent', tag, tagTone, rotate = -8, radius = 18, photo, children }) {
  const style = { height, borderRadius: radius };
  if (photo) style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,.22), rgba(0,0,0,0) 35%, rgba(0,0,0,.35)), url("${photo}")`;
  return (
    <div className={`aerial aer-${variant}${photo ? ' aer-photo' : ''}`} style={style}>
      {plot && !photo && (
        <div className={`aer-plot plot-${plot}`} style={{ transform: `rotate(${rotate}deg)` }} />
      )}
      {tag && <span className={`aer-tag ${tagTone || ''}`}>{tag}</span>}
      {children}
    </div>
  );
}

export function Card({ children, className = '', dark, style }) {
  return <section className={`card ${dark ? 'card-dark' : ''} ${className}`} style={style}>{children}</section>;
}
