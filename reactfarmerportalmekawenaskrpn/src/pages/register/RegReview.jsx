import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { emptyDraft, farmPayload, maskPhone, nicInfo, useApp } from '../../state/AppContext.jsx';
import { PrimaryBtn, StepHeader } from '../../components/UI.jsx';
import Icon from '../../components/Icon.jsx';
import { CROP_CATALOG } from '../../data.js';
import { waterLabel } from './RegWater.jsx';
import { COLORS } from '../../theme.js';
import { findReservoirId, register, saveFarmDetails, updateProfile } from '../../api/auth.js';

export default function RegReview() {
  const { t, draft, update, user, alerts, showToast } = useApp();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const info = nicInfo(draft.nic);
  // A registered farmer's NIC is already on file and cannot change.
  if ((!user.farmerId && !info.valid) || !draft.address?.trim() || !draft.district) return <Navigate to="/register/identity" replace />;
  // The farm location is required; it must come from the phone's GPS.
  if (draft.pin?.lat == null || !draft.located) return <Navigate to="/register/pin" replace />;

  const total = draft.crops.reduce((s, c) => s + (Number(c.acres) || 0), 0);

  const saveFarm = (id, farmerId, reservoirId) => {
    const farm = { ...draft, id, reservoirId, phone: user.phone, registeredAt: draft.registeredAt || Date.now() };
    update({
      user: farmerId ? { phone: user.phone, farmerId } : user,
      farm,
      draft: emptyDraft(),
      alerts: [{ id: `f${Date.now()}`, kind: 'farm', title: `Farm registered · ${id}`, body: `${total} acres added to the Mahaweli B irrigation list.`, when: 'Just now', read: false }, ...alerts],
    });
    navigate('/register/done', { replace: true, state: { id } });
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const tank = draft.water?.source === 'tank' ? draft.water.name : null;
      const details = {
        full_name: draft.name.trim(),
        address: draft.address.trim(),
        district: draft.district,
        division: draft.division?.trim() || null,
        farm_latitude: Number(draft.pin.lat.toFixed(6)),
        farm_longitude: Number(draft.pin.lng.toFixed(6)),
        reservoir_id: await findReservoirId(tank).catch(() => null),
        tank_id: null,
        land_acres: Math.round(total * 100) / 100,
        primary_crop: draft.crops[0]?.type || null,
      };
      const farm = farmPayload(draft);
      if (user.farmerId) {
        await updateProfile(details);
        await saveFarmDetails(farm);
        saveFarm(draft.id, null, details.reservoir_id);
        return;
      }
      const farmer = await register({ ...details, ...farm, phone: user.phone, nic: draft.nic.trim() });
      saveFarm(farmer.farm_id, farmer.farmer_id, details.reservoir_id);
    } catch (err) {
      setBusy(false);
      if (err.status === 403) {
        // The 15-minute window after the OTP ran out: verify the number again, the draft is kept.
        showToast(t('verifyAgain'), 'error');
        update({ pendingPhone: user.phone, user: null });
        navigate('/login', { replace: true });
        return;
      }
      setError(err.message);
    }
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
        <div className="f14 muted lh">{[draft.address, draft.division, draft.district].filter(Boolean).join(', ')}</div>
        <div className="grid2 f14">
          <div className="soft-tile"><div className="f12 muted">NIC</div><div className="fw600">{info.valid ? info.masked : t('onFile')}</div></div>
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

      {error && <div className="err-text" role="alert">{error}</div>}
      <div className="grow" />
      <PrimaryBtn onClick={submit} disabled={!draft.consent || busy} icon="check">{busy ? t('submitting') : t('submit')}</PrimaryBtn>
      <div className="center f13 muted">{t('farmIdSms')}</div>
    </div>
  );
}
