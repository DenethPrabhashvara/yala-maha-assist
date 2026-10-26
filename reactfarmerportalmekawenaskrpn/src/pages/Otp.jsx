import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { formatPhone, useApp } from '../state/AppContext.jsx';
import { IconBtn, PrimaryBtn } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import { makeCode } from './Login.jsx';

const RESEND_SECONDS = 60;

export default function Otp() {
  const { t, pendingPhone, otpCode, otpSentAt, update, showSms, showToast, farm } = useApp();
  const navigate = useNavigate();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const refs = useRef([]);

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { refs.current[0]?.focus(); }, []);

  if (!pendingPhone) return <Navigate to="/login" replace />;

  const left = Math.max(0, RESEND_SECONDS - Math.floor((now - (otpSentAt || 0)) / 1000));

  const verify = (code) => {
    if (code.length < 6) return;
    setBusy(true);
    setTimeout(() => {
      if (code === otpCode) {
        update({ user: { phone: pendingPhone }, otpCode: null });
        showToast('Signed in');
        navigate(farm ? '/home' : '/register/identity', { replace: true });
      } else {
        setBusy(false);
        setError(t('wrongCode'));
        setDigits(['', '', '', '', '', '']);
        refs.current[0]?.focus();
      }
    }, 500);
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

  const resend = () => {
    const code = makeCode();
    update({ otpCode: code, otpSentAt: Date.now() });
    showSms(`Your Yala-Maha Assist code is ${code}. It expires in 5 minutes. Do not share it.`);
    setNow(Date.now());
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

      <button type="button" className="hint-box" onClick={() => showSms(`Your Yala-Maha Assist code is ${otpCode}. It expires in 5 minutes. Do not share it.`)}>
        <Icon name="info" size={16} /> Demo: tap to show the SMS again
      </button>

      <div className="grow" />
      <PrimaryBtn onClick={() => verify(digits.join(''))} disabled={busy || digits.some((d) => !d)}>{busy ? '…' : t('verify')}</PrimaryBtn>
      <button type="button" className="text-btn center" onClick={() => showToast('Visit your Agrarian Service Centre for sign-in help')}>Need help signing in?</button>
    </div>
  );
}
