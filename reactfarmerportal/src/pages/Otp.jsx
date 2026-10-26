import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { formatPhone, nicInfo, useApp } from '../state/AppContext.jsx';
import { IconBtn, PrimaryBtn } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import { farmFromProfile, login, sendOtp, verifyOtp } from '../api/auth.js';

const RESEND_SECONDS = 60;

// Phone verified for an existing account: the API signs in with phone + NIC.
function NicSignIn({ phone, t, onDone }) {
  const [nic, setNic] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const info = nicInfo(nic);

  const submit = async (e) => {
    e.preventDefault();
    if (!info.valid) { setError(t('nicBad')); return; }
    setBusy(true);
    try {
      onDone(await login(phone, nic));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="screen" onSubmit={submit} noValidate>
      <div className="icon-tile accent"><Icon name="lock" size={26} /></div>
      <div className="col gap6">
        <h1 className="h1">{t('welcomeBack')}</h1>
        <div className="f15 muted lh">{t('nicSignInHint')} <b className="ink">{formatPhone(phone)}</b></div>
      </div>

      <div className="field">
        <label htmlFor="nic" className="label">{t('nic')}</label>
        <input id="nic" className={`input strong mono ${error ? 'error' : ''}`} placeholder="821453298V or 198421098456"
          value={nic} maxLength={12} autoCapitalize="characters" autoFocus
          onChange={(e) => { setNic(e.target.value.toUpperCase().replace(/[^0-9VX]/g, '')); setError(''); }} />
        {error && <div className="err-text" role="alert">{error}</div>}
      </div>

      <div className="grow" />
      <PrimaryBtn type="submit" disabled={busy || !nic}>{busy ? '…' : t('signIn')}</PrimaryBtn>
    </form>
  );
}

export default function Otp() {
  const { t, pendingPhone, otpSentAt, update, showToast } = useApp();
  const navigate = useNavigate();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [registered, setRegistered] = useState(false);
  const refs = useRef([]);

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { refs.current[0]?.focus(); }, []);

  if (!pendingPhone) return <Navigate to="/login" replace />;

  if (registered) {
    return (
      <NicSignIn phone={pendingPhone} t={t} onDone={(farmer) => {
        update((s) => ({
          user: { phone: pendingPhone, farmerId: farmer.farmer_id },
          farm: farmFromProfile(farmer, s.farm?.farmerId === farmer.farmer_id ? s.farm : null),
          pendingPhone: null,
        }));
        showToast('Signed in');
        navigate('/home', { replace: true });
      }} />
    );
  }

  const left = Math.max(0, RESEND_SECONDS - Math.floor((now - (otpSentAt || 0)) / 1000));

  const verify = async (code) => {
    if (code.length < 6 || busy) return;
    setBusy(true);
    try {
      const res = await verifyOtp(pendingPhone, code);
      if (res.alreadyRegistered) {
        setRegistered(true);
        return;
      }
      update({ user: { phone: pendingPhone, verifiedAt: Date.now() }, farm: null });
      showToast('Number verified');
      navigate('/register/identity', { replace: true });
    } catch (err) {
      setBusy(false);
      setError(err.status === 400 ? t('wrongCode') : err.message);
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    }
  };

  const setAt = (i, v) => {
    const clean = v.replace(/\D/g, '');
    if (clean.length > 1) { // paste
      const arr = clean.slice(0, 6).split('');
      const next = [...digits];
      arr.forEach((d, k) => { if (i + k < 6) next[i + k] = d; });
      setDigits(next);
      refs.current[Math.min(5, i + arr.length)]?.focus();
      verify(next.join(''));
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    setError('');
    if (clean && i < 5) refs.current[i + 1]?.focus();
    if (next.every(Boolean)) verify(next.join(''));
  };

  const resend = async () => {
    try {
      await sendOtp(pendingPhone);
      update({ otpSentAt: Date.now() });
      setNow(Date.now());
      setError('');
      showToast('New code sent');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="screen">
      <div className="row"><IconBtn icon="back" label={t('back')} to="/login" /></div>
      <div className="icon-tile accent"><Icon name="sms" size={26} /></div>
      <div className="col gap6">
        <h1 className="h1">{t('enterCode')}</h1>
        <div className="f15 muted">{t('sentTo')} <b className="ink">{formatPhone(pendingPhone)}</b> · <button type="button" className="link-btn" onClick={() => navigate('/login')}>{t('change')}</button></div>
      </div>

      <div className={`otp ${error ? 'shake' : ''}`} role="group" aria-label="6-digit code">
        {digits.map((d, i) => (
          <input key={i} ref={(el) => { refs.current[i] = el; }} aria-label={`Digit ${i + 1}`}
            inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={6}
            className={`otp-box ${d ? 'filled' : ''} ${error ? 'error' : ''}`} value={d}
            onChange={(e) => setAt(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus(); }} />
        ))}
      </div>
      {error && <div className="err-text" role="alert">{error}</div>}

      <div className="row between f14">
        <span className="muted">{t('didntGet')}</span>
        {left > 0
          ? <span className="chip-white"><Icon name="clock" size={14} stroke={2.2} />{t('resendIn')} 0:{String(left).padStart(2, '0')}</span>
          : <button type="button" className="chip-white btn" onClick={resend}><Icon name="refresh" size={14} stroke={2.2} />{t('resend')}</button>}
      </div>

      <div className="grow" />
      <PrimaryBtn onClick={() => verify(digits.join(''))} disabled={busy || digits.some((d) => !d)}>{busy ? '…' : t('verify')}</PrimaryBtn>
      <button type="button" className="text-btn center" onClick={() => showToast('Visit your Agrarian Service Centre for sign-in help')}>Need help signing in?</button>
    </div>
  );
}
