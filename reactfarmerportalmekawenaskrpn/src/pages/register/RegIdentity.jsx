import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPhone, nicInfo, useApp } from '../../state/AppContext.jsx';
import { PrimaryBtn, StepHeader } from '../../components/UI.jsx';
import Icon from '../../components/Icon.jsx';

export default function RegIdentity() {
  const { t, draft, update, user, farm, logout } = useApp();
  const navigate = useNavigate();
  const [touched, setTouched] = useState(false);
  const set = (patch) => update((s) => ({ draft: { ...s.draft, ...patch } }));
  const info = nicInfo(draft.nic);
  const nameOk = draft.name.trim().split(/\s+/).length >= 2;
  const canNext = nameOk && info.valid;

  const next = () => {
    setTouched(true);
    if (canNext) navigate('/register/crops');
  };

  return (
    <div className="screen">
      {/* Registration is required, so a farmer without a farm can only leave by signing out. */}
      {farm
        ? <StepHeader step={1} closeTo="/home" />
        : <StepHeader step={1} closeLabel={t('logout')} onClose={() => { logout(); navigate('/login', { replace: true }); }} />}
      <div>
        <div className="eyebrow">{t('step')} 1 · {t('aboutYou')}</div>
        <h1 className="h1">{t('whoOwns')}</h1>
      </div>

      <div className="card">
        <div className="field">
          <label htmlFor="nm" className="label">{t('fullName')}</label>
          <input id="nm" className={`input ${touched && !nameOk ? 'error' : ''}`} autoComplete="name" placeholder="e.g. Sunil Kumara Bandara"
            value={draft.name} onChange={(e) => set({ name: e.target.value })} />
          {touched && !nameOk && <div className="err-text">Enter your first and last name</div>}
        </div>

        <div className="field">
          <label htmlFor="nic" className="label">{t('nic')}</label>
          <input id="nic" className={`input strong mono ${draft.nic && !info.valid && touched ? 'error' : ''}`} placeholder="821453298V or 198421098456"
            value={draft.nic} maxLength={12} autoCapitalize="characters"
            onChange={(e) => set({ nic: e.target.value.toUpperCase().replace(/[^0-9VX]/g, '') })} />
          {info.valid ? (
            <div className="row gap6 wrap">
              <span className="status-pill s-safe"><Icon name="check" size={12} stroke={3.4} />{info.format === 'old' ? t('nicOld') : t('nicNew')}</span>
              <span className="chip-soft">{t('shownAs')} {info.masked}</span>
            </div>
          ) : draft.nic && touched ? (
            <div className="err-text">{t('nicBad')}</div>
          ) : (
            <div className="hint">{t('nicBad')}</div>
          )}
        </div>

        <div className="field">
          <span className="label">{t('mobileNumber')}</span>
          <div className="input locked">
            <span className="grow">{formatPhone(user.phone)}</span>
            <span className="status-pill s-accent"><Icon name="check" size={12} stroke={3.2} />{t('verified')}</span>
          </div>
        </div>
      </div>

      <div className="row gap10 f13 muted lh start" style={{ padding: '0 4px' }}>
        <Icon name="lock" size={18} style={{ flex: 'none', marginTop: 1 }} />
        {t('nicPrivacy')}
      </div>

      <div className="grow" />
      <PrimaryBtn onClick={next}>{t('nextCrops')}</PrimaryBtn>
    </div>
  );
}
