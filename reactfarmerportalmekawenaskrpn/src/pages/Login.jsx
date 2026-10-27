import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizePhone, useApp } from '../state/AppContext.jsx';
import { Aerial, LangSwitch, Logo, PrimaryBtn } from '../components/UI.jsx';
import { PHOTOS } from '../data.js';
import { sendOtp } from '../api/auth.js';

export default function Login() {
  const { t, update, pendingPhone } = useApp();
  const navigate = useNavigate();
  const [value, setValue] = useState(pendingPhone ? `0${pendingPhone.slice(3)}` : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const phone = normalizePhone(value);
    if (!phone) { setError(t('invalidPhone')); return; }
    setBusy(true);
    try {
      await sendOtp(phone);
      update({ pendingPhone: phone, otpSentAt: Date.now() });
      navigate('/otp');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="screen" onSubmit={submit} noValidate>
      <Aerial variant="hero" height={250} radius={32} photo={PHOTOS.paddy}>
        <div className="row gap10" style={{ position: 'absolute', left: 16, top: 16 }}>
          <Logo size={44} />
          <span className="fw600 f16" style={{ color: '#fff' }}>{t('appName')}</span>
        </div>
        <div className="art-float" style={{ left: 16, right: 16, bottom: 16 }}>
          <div className="f13 fw600" style={{ color: 'var(--accent)' }}>Mahaweli B · {t('farmerPortal')}</div>
          <div className="f14" style={{ marginTop: 4, fontFamily: 'var(--font-system), Noto Sans Sinhala, Noto Sans Tamil' }}>ගොවි ද්වාරය · விவசாயி தளம்</div>
        </div>
      </Aerial>

      <div className="col gap6">
        <h1 className="h1">{t('enterPhone')}</h1>
        <p className="muted f15 lh">{t('phoneHint')}</p>
      </div>

      <div className="field">
        <label htmlFor="phone" className="label">{t('mobileNumber')}</label>
        <div className={`phone-input ${error ? 'error' : ''}`}>
          <span className="cc">LK +94</span>
          <input id="phone" inputMode="tel" autoComplete="tel" placeholder="077 123 4567" value={value}
            onChange={(e) => { setValue(e.target.value.replace(/[^\d\s+]/g, '').slice(0, 14)); setError(''); }} />
        </div>
        {error && <div className="err-text" role="alert">{error}</div>}
      </div>

      <div className="grow" />
      <PrimaryBtn type="submit" disabled={busy}>{busy ? '…' : t('sendCode')}</PrimaryBtn>
      <LangSwitch />
    </form>
  );
}
