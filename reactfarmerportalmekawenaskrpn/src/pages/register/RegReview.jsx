import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { emptyDraft, maskPhone, nicInfo, useApp } from '../../state/AppContext.jsx';
import { PrimaryBtn, StepHeader } from '../../components/UI.jsx';
import Icon from '../../components/Icon.jsx';
import { CROP_CATALOG } from '../../data.js';
import { waterLabel } from './RegWater.jsx';
import { COLORS } from '../../theme.js';

export default function RegReview() {
  const { t, draft, update, user, showSms, alerts } = useApp();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const info = nicInfo(draft.nic);
  if (!info.valid) return <Navigate to="/register/identity" replace />;
  // The farm location is required; it must come from the phone's GPS.
  if (draft.pin?.lat == null || !draft.located) return <Navigate to="/register/pin" replace />;

  const total = draft.crops.reduce((s, c) => s + (Number(c.acres) || 0), 0);

  const submit = () => {
    setBusy(true);
    setTimeout(() => {
      const id = draft.id || `FAR-${String(16 + Math.floor(Math.random() * 80)).padStart(3, '0')}`;
      const farm = { ...draft, id, phone: user.phone, registeredAt: Date.now() };
      update({
        farm,
        draft: emptyDraft(),
        alerts: [{ id: `f${Date.now()}`, kind: 'farm', title: `Farm registered · ${id}`, body: `${total} acres added to the Mahaweli B irrigation list.`, when: 'Just now', read: false }, ...alerts],
      });
      showSms(`Yala-Maha Assist: Registration complete. Your Farm ID is ${id}. Keep this SMS for the Agrarian Service Centre.`);
      navigate('/register/done', { replace: true, state: { id } });
    }, 1200);
  };

  return (
    <div className="screen">
      <StepHeader step={3} backTo="/register/water" />
      <div>
        <div className="eyebrow">{t('step')} 3 · {t('checkDetails')}</div>
        <h1 className="h1">{t('allRight')}</h1>
      </div>

      <div className="card">
        <div className="row between"><span className="label">{t('farmer')}</span><Link to="/register/identity" className="f14 fw600 ink">{t('edit')}</Link></div>
        <div className="f18 fw600">{draft.name}</div>
        <div className="grid2 f14">
          <div className="soft-tile"><div className="f12 muted">NIC</div><div className="fw600">{info.masked}</div></div>
          <div className="soft-tile"><div className="f12 muted">{t('mobile')}</div><div className="fw600">{maskPhone(user.phone)}</div></div>
        </div>
      </div>

      <div className="card">
        <div className="row between"><span className="label">{t('crops')}</span><Link to="/register/crops" className="f14 fw600 ink">{t('edit')}</Link></div>
        {draft.crops.map((c) => (
          <div key={c.id} className="row gap12">
            <span className="cdot" style={{ background: CROP_CATALOG[c.category].color }} />
            <span className="grow f15 fw600">{c.type.replace(/ \(.*\)/, '')} · {c.variety.split(' (')[0]}</span>
            <span className="f15">{c.acres} ac</span>
          </div>
        ))}
        <div className="hr" />
        <div className="row between f16 fw600"><span>{t('total')}</span><span>{Math.round(total * 100) / 100} {t('acres')}</span></div>
      </div>

      <div className="card row-card static">
        <div className="icon-tile mint"><Icon name="pin" size={22} color={COLORS.pin} /></div>
        <div className="grow"><div className="f12 muted">{t('location')}</div><div className="f15 fw600">{draft.nearest}</div></div>
        <Link to="/register/pin" className="f14 fw600 ink">{t('edit')}</Link>
      </div>

      <div className="card row-card static">
        <div className="icon-tile blue"><Icon name="drop" size={22} /></div>
        <div className="grow"><div className="f12 muted">{t('waterSource')}</div><div className="f15 fw600">{waterLabel(draft.water, t) || t('notGiven')}</div></div>
        <Link to="/register/water" className="f14 fw600 ink">{t('edit')}</Link>
      </div>

      <label className="consent">
        <input type="checkbox" checked={draft.consent} onChange={(e) => update((s) => ({ draft: { ...s.draft, consent: e.target.checked } }))} />
        <span>{t('consent')}</span>
      </label>

      <div className="grow" />
      <PrimaryBtn onClick={submit} disabled={!draft.consent || busy} icon="check">{busy ? t('submitting') : t('submit')}</PrimaryBtn>
      <div className="center f13 muted">{t('farmIdSms')}</div>
    </div>
  );
}
