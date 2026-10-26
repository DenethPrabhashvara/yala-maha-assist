import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatPhone, useApp } from '../state/AppContext.jsx';
import { Card, LangSwitch } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import Sheet from '../components/Sheet.jsx';

export default function Profile() {
  const { t, user, farm, smsEnabled, update, logout, showToast, resetAll } = useApp();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const initials = (farm?.name || 'F').split(' ').map((w) => w[0]).slice(0, 2).join('');

  return (
    <div className="screen">
      <h1 className="h1 xl">{t('profile')}</h1>

      <Card className="row-card static">
        <div className="avatar lg">{initials}</div>
        <div className="grow min0">
          <div className="f18 fw600 ellipsis">{farm?.name || 'Farmer'}</div>
          <div className="f14 muted">{formatPhone(user.phone)}</div>
        </div>
        <span className={`status-pill ${farm ? 's-safe' : 's-low'}`}><span className="sp-dot" />{farm ? farm.id : t('notRegistered')}</span>
      </Card>

      {!farm && (
        <Link to="/register/identity" className="pill-btn accent big">{t('registerFarm')} <Icon name="arrow" size={18} stroke={2.4} /></Link>
      )}

      <div className="f13 muted fw600 caps">{t('language')}</div>
      <LangSwitch />

      <div className="f13 muted fw600 caps">{t('notifications')}</div>
      <Card className="list-card">
        <label className="list-row">
          <Icon name="sms" size={20} />
          <span className="grow"><span className="block f15 fw600">{t('smsAlerts')}</span><span className="block f13 muted">{t('worksNoData')}</span></span>
          <input type="checkbox" className="switch" checked={smsEnabled}
            onChange={(e) => { update({ smsEnabled: e.target.checked }); showToast(e.target.checked ? 'SMS alerts on' : 'SMS alerts off'); }} />
        </label>
        <Link to="/alerts" className="list-row"><Icon name="bell" size={20} /><span className="grow f15 fw600">{t('alerts')}</span><Icon name="chevron" size={18} /></Link>
        <Link to="/fields" className="list-row"><Icon name="map" size={20} /><span className="grow f15 fw600">{t('myFields')}</span><Icon name="chevron" size={18} /></Link>
        <button type="button" className="list-row" onClick={() => setHelpOpen(true)}><Icon name="help" size={20} /><span className="grow f15 fw600" style={{ textAlign: 'left' }}>{t('help')}</span><Icon name="chevron" size={18} /></button>
      </Card>

      <button type="button" className="pill-btn outline big danger" onClick={() => { logout(); navigate('/login', { replace: true }); }}>
        {t('logout')} <Icon name="logout" size={18} />
      </button>

      <div className="center f12 muted lh">
        {t('appName')} · {t('version')} 1.0.0<br />
        <button type="button" className="link-btn f12" onClick={() => { resetAll(); navigate('/', { replace: true }); }}>Reset demo data</button>
        {' · '}
        <Link to="/error" className="f12 ink">Preview error screen</Link>
      </div>

      <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} title={t('help')}>
        <div className="col gap8">
          <div className="option-row static"><Icon name="user" size={18} /><span className="grow">Agrarian Development Officer · [OFFICER NAME]</span></div>
          <div className="option-row static"><Icon name="sms" size={18} /><span className="grow">Irrigation maintenance desk · [PHONE]</span></div>
          <div className="option-row static"><Icon name="pin" size={18} /><span className="grow">Agrarian Service Centre · [ADDRESS]</span></div>
        </div>
        <div className="f13 muted lh">Replace these with the real contacts for your area before launch.</div>
      </Sheet>
    </div>
  );
}
