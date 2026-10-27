import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadFarm, useApp } from '../state/AppContext.jsx';
import { getProfile } from '../api/auth.js';

const SPLASH_MS = 2200;

// Checks the saved session with the API (refreshing the access token from the cookie).
// Resolves to where the farmer should go next.
async function restoreSession(user, update) {
  if (!user) return null;
  if (user.pendingRegistration) return '/register/identity';
  try {
    const farmer = await getProfile();
    update({ farm: await loadFarm(farmer) });
    return '/home';
  } catch (err) {
    // No connection: the app still works offline with the saved farm.
    if (err.status === 0 || err.status >= 500) return '/home';
    update({ user: null, pendingPhone: user.phone });
    return '/login';
  }
}

// Loading screen shown on launch: the Yala Maha logo with a soft ripple and a progress bar.
export default function Splash() {
  const { user, onboarded, update, t } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const wait = new Promise((resolve) => { setTimeout(resolve, SPLASH_MS); });
    Promise.all([restoreSession(user, update), wait]).then(([to]) => {
      if (!cancelled) navigate(to || (onboarded ? '/login' : '/welcome'), { replace: true });
    });
    return () => { cancelled = true; };
    // Runs once on launch; the session result decides the route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
