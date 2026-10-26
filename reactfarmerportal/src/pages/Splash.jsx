import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import { Logo } from '../components/UI.jsx';

export default function Splash() {
  const { user, onboarded, t } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const id = setTimeout(() => {
      navigate(user ? '/home' : onboarded ? '/login' : '/welcome', { replace: true });
    }, 1700);
    return () => clearTimeout(id);
  }, [navigate, user, onboarded]);

  return (
    <div className="splash">
      <div className="splash-rings" aria-hidden="true"><span /><span /><span /></div>
      <div className="splash-logo"><Logo size={96} /></div>
      <div className="splash-name">{t('appName')}</div>
      <div className="splash-sub">Mahaweli B · ගොවි ද්වාරය · விவசாயி தளம்</div>
      <div className="splash-foot">Department of Agrarian Development · Irrigation Department</div>
    </div>
  );
}
