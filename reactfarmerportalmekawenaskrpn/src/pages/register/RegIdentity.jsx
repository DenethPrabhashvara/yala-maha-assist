import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPhone, nicInfo, useApp } from '../../state/AppContext.jsx';
import { PrimaryBtn, StepHeader } from '../../components/UI.jsx';
import Icon from '../../components/Icon.jsx';
import { DISTRICTS } from '../../data.js';

export default function RegIdentity() {
  const { t, draft, update, user, farm, logout } = useApp();
  const navigate = useNavigate();
  const [touched, setTouched] = useState(false);
  const set = (patch) => update((s) => ({ draft: { ...s.draft, ...patch } }));
  const info = nicInfo(draft.nic);
  const nameOk = draft.name.trim().split(/\s+/).length >= 2;
  const addressOk = Boolean(draft.address?.trim());
  const districtOk = Boolean(draft.district);
  // Registered farmers can't change their NIC: the API signs them in with it.
  const nicLocked = Boolean(user.farmerId);
  const canNext = nameOk && (nicLocked || info.valid) && addressOk && districtOk;

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

        {nicLocked ? (
          <div className="field">
            <span className="label">{t('nic')}</span>
            <div className="input locked">
              <span className="grow">{info.valid ? info.masked : t('onFile')}</span>
              <Icon name="lock" size={16} />
            </div>
          </div>
        ) : (
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
        )}

        <div className="field">
          <label htmlFor="addr" className="label">{t('address')}</label>
          <input id="addr" className={`input ${touched && !addressOk ? 'error' : ''}`} autoComplete="street-address" placeholder="e.g. No. 12, Canal Road, Dehiattakandiya"
            value={draft.address || ''} onChange={(e) => set({ address: e.target.value })} />
          {touched && !addressOk && <div className="err-text">{t('addressNeeded')}</div>}
        </div>

        <div className="grid2">
          <div className="field">
            <label htmlFor="dist" className="label">{t('district')}</label>
            <div className="select-wrap">
              <select id="dist" className={touched && !districtOk ? 'error' : ''} value={draft.district || ''} onChange={(e) => set({ district: e.target.value })}>
                <option value="" disabled>{t('choose')}</option>
                {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
              <Icon name="down" size={16} stroke={2.4} />
            </div>
            {touched && !districtOk && <div className="err-text">{t('districtNeeded')}</div>}
          </div>
          <div className="field">
            <label htmlFor="div" className="label">{t('division')}</label>
            <input id="div" className="input" placeholder={t('optional')}
              value={draft.division || ''} onChange={(e) => set({ division: e.target.value })} />
          </div>
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
