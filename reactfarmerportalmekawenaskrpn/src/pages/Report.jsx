import { useEffect, useRef, useState } from 'react';
import { maskPhone, useApp } from '../state/AppContext.jsx';
import { PrimaryBtn, StatusLabel } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import Sheet from '../components/Sheet.jsx';
import { CANAL_SPOTS, ISSUE_TYPES } from '../data.js';

export default function Report() {
  const { t, reports, update, showToast, user } = useApp();
  const [type, setType] = useState(null);
  const [spot, setSpot] = useState(CANAL_SPOTS[0]);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [spotOpen, setSpotOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [justSent, setJustSent] = useState(null);
  const fileRef = useRef();

  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);

  const submit = () => {
    if (!type) { setError(t('pickType')); return; }
    setBusy(true);
    setTimeout(() => {
      const id = `CR-${2040 + reports.length}`;
      const rep = { id, type, spot, note, status: 'received', when: 'Just now' };
      update({ reports: [rep, ...reports] });
      setJustSent(rep);
      setBusy(false);
      setType(null); setNote(''); setPhoto(null);
    }, 900);
  };

  const label = (k) => t(ISSUE_TYPES.find((x) => x.id === k)?.key || 'other');

  return (
    <div className="screen">
      <div className="row gap10">
        <div className="grow" />
        <button type="button" className="chip-dark btn" onClick={() => setListOpen(true)}>{t('myReports')} ({reports.length})</button>
      </div>

      <h1 className="h1">{t('reportTitle')}</h1>

      {justSent && (
        <div className="card card-dark confirm-card" role="status">
          <span className="ok-circle"><Icon name="check" size={20} stroke={2.8} /></span>
          <div className="grow">
            <div className="f15 fw600">{t('received')} · {justSent.id}</div>
            <div className="f13 dim lh">{t('receivedBody')} SMS → {maskPhone(user.phone)}</div>
          </div>
          <button type="button" className="icon-btn glass sm" aria-label="Dismiss" onClick={() => setJustSent(null)}><Icon name="close" size={16} /></button>
        </div>
      )}

      <div className="f15 fw600">{t('whatWrong')}</div>
      <div className="issue-grid" role="radiogroup" aria-label={t('whatWrong')}>
        {ISSUE_TYPES.map((it) => (
          <button key={it.id} type="button" role="radio" aria-checked={type === it.id}
            className={`issue-tile ${type === it.id ? 'on' : ''}`} onClick={() => { setType(it.id); setError(''); }}>
            <span className="row between w100">
              <Icon name={it.icon} size={28} stroke={1.9} />
              {type === it.id && <span className="tick"><Icon name="check" size={12} stroke={3.4} color="var(--accent)" /></span>}
            </span>
            {t(it.key)}
          </button>
        ))}
      </div>
      {error && <div className="err-text" role="alert">{error}</div>}

      <button type="button" className="card row-card" onClick={() => setSpotOpen(true)}>
        <Icon name="pin" size={22} />
        <div className="grow" style={{ textAlign: 'left' }}><div className="f12 muted">{t('where')}</div><div className="f15 fw600">{spot}</div></div>
        <span className="f14 fw600 underline">{t('change')}</span>
      </button>

      <label htmlFor="notes" className="f15 fw600">{t('tellMore')}</label>
      <div className="card tight">
        <textarea id="notes" className="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Mud and weeds blocking the channel about 50 m after gate 7" />
        {photo && (
          <div className="photo-prev">
            <img src={photo} alt="Attached" />
            <button type="button" className="icon-btn dark sm" aria-label="Remove photo" onClick={() => setPhoto(null)}><Icon name="close" size={14} /></button>
          </div>
        )}
        <div className="row gap8">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)); }} />
          <button type="button" className="pill-btn outline" onClick={() => fileRef.current?.click()}><Icon name="camera" size={18} />{t('addPhoto')}</button>
          <button type="button" className="icon-btn outline" style={{ width: 44, height: 44 }} aria-label="Record voice note" onClick={() => showToast('Voice notes need microphone permission in the installed app')}><Icon name="mic" size={18} /></button>
        </div>
      </div>

      <PrimaryBtn onClick={submit} disabled={busy} icon="send">{busy ? '…' : t('sendDesk')}</PrimaryBtn>

      <Sheet open={spotOpen} onClose={() => setSpotOpen(false)} title={t('where')}>
        <div className="col gap8">
          {CANAL_SPOTS.map((s) => (
            <button key={s} type="button" className={`option-row ${s === spot ? 'on' : ''}`} onClick={() => { setSpot(s); setSpotOpen(false); }}>
              <Icon name="pin" size={18} /><span className="grow">{s}</span>{s === spot && <Icon name="check" size={18} stroke={2.6} />}
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={listOpen} onClose={() => setListOpen(false)} title={t('myReports')}>
        <div className="col gap8">
          {reports.map((r) => (
            <div key={r.id} className="report-row">
              <div className="icon-tile soft"><Icon name={ISSUE_TYPES.find((x) => x.id === r.type)?.icon || 'dots'} size={22} /></div>
              <div className="grow min0">
                <div className="f15 fw600">{label(r.type)} · {r.id}</div>
                <div className="f13 muted ellipsis">{r.spot} · {r.when}</div>
              </div>
              <StatusLabel status={r.status}>{t(r.status)}</StatusLabel>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
