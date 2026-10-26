import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';

const SPLASH_MS = 2200;

// Loading screen shown on launch: the Yala Maha logo with a soft ripple and a progress bar.
export default function Splash() {
  const { user, onboarded, t } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const id = setTimeout(() => {
      navigate(user ? '/home' : onboarded ? '/login' : '/welcome', { replace: true });
    }, SPLASH_MS);
    return () => clearTimeout(id);
  }, [navigate, user, onboarded]);

  return (
    <div className="splash" role="status" aria-label={`${t('appName')}, loading`} style={{ '--splash-ms': `${SPLASH_MS}ms` }}>
      <div className="splash-mark">
        <div className="splash-rings" aria-hidden="true"><span /><span /><span /></div>
        <img src={`${import.meta.env.BASE_URL}logo-full.png`} alt="Yala Maha" draggable="false" />
      </div>
      <div className="splash-sub">Mahaweli B · ගොවි ද්වාරය · விவசாயி தளம்</div>
      <div className="splash-loader" aria-hidden="true"><i /></div>
      <div className="splash-foot">Department of Agrarian Development · Irrigation Department</div>
    </div>
  );
}
