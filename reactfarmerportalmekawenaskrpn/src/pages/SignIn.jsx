import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { formatPhone, loadFarm, nicInfo, useApp } from '../state/AppContext.jsx';
import { IconBtn, PrimaryBtn } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import { login } from '../api/auth.js';

// Second step for a number that already has an account: the API signs in with phone + NIC.
export default function SignIn() {
  const { t, pendingPhone, update, showToast } = useApp();
  const navigate = useNavigate();
  const [nic, setNic] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!pendingPhone) return <Navigate to="/login" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!nicInfo(nic).valid) { setError(t('nicBad')); return; }
    setBusy(true);
    try {
      const farmer = await login(pendingPhone, nic);
      const next = await loadFarm(farmer);
      update({ user: { phone: pendingPhone, farmerId: farmer.farmer_id }, farm: next, pendingPhone: null });
      showToast(t('signedIn'));
      navigate('/home', { replace: true });
    } catch (err) {
      if (err.status === 403) {
        // The 15 minutes after the SMS code ran out: get a new code.
        showToast(t('verifyAgain'), 'error');
        navigate('/login', { replace: true });
        return;
      }
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="screen" onSubmit={submit} noValidate>
      <div className="row"><IconBtn icon="back" label={t('back')} to="/login" /></div>
      <div className="icon-tile accent"><Icon name="lock" size={26} /></div>
      <div className="col gap6">
        <h1 className="h1">{t('welcomeBack')}</h1>
        <div className="f15 muted lh">{t('confirmNic')} <b className="ink">{formatPhone(pendingPhone)}</b></div>
      </div>

      <div className="field">
        <label htmlFor="nic" className="label">{t('nic')}</label>
        <input id="nic" className={`input strong mono ${error ? 'error' : ''}`} placeholder="821453298V or 198421098456"
          value={nic} maxLength={12} autoCapitalize="characters" autoComplete="off"
          onChange={(e) => { setNic(e.target.value.toUpperCase().replace(/[^0-9VX]/g, '')); setError(''); }} />
        {error && <div className="err-text" role="alert">{error}</div>}
      </div>

      <div className="grow" />
      <PrimaryBtn type="submit" disabled={busy || !nic}>{busy ? '…' : t('signIn')}</PrimaryBtn>
    </form>
  );
}
