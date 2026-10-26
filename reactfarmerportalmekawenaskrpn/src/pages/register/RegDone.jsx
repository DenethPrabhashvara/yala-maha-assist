import { Navigate } from 'react-router-dom';
import { maskPhone, useApp } from '../../state/AppContext.jsx';
import { Aerial, PrimaryBtn } from '../../components/UI.jsx';
import Icon from '../../components/Icon.jsx';
import { PHOTOS } from '../../data.js';
import { COLORS } from '../../theme.js';

export default function RegDone() {
  const { t, farm, user } = useApp();
  if (!farm) return <Navigate to="/home" replace />;
  const total = farm.crops.reduce((s, c) => s + (Number(c.acres) || 0), 0);

  return (
    <div className="screen">
      <div className="progress"><div className="pg done" /><div className="pg done" /><div className="pg done" /><div className="pg done" /></div>

      <div className="success-hero">
        <div className="success-check"><Icon name="check" size={52} stroke={2.6} /></div>
        <h1 className="h1 center">{t('registered')}</h1>
        <p className="muted f15 lh center" style={{ maxWidth: 290 }}>{t('registeredBody')}</p>
      </div>

      <div className="card card-dark farm-id-card">
        <Aerial variant="hero" height={110} radius={24} photo={PHOTOS.paddy} />
        <div className="row between end" style={{ padding: '8px 8px 4px' }}>
          <div>
            <div className="f13 dim">{t('yourFarmId')}</div>
            <div className="f40 fw600 accent-text">{farm.id}</div>
          </div>
          <div className="f13 dim right lh">{total} {t('acres')}<br />Mahaweli B</div>
        </div>
      </div>

      <div className="card row-card static">
        <Icon name="sms" size={22} color={COLORS.success} />
        <div className="grow f14 lh">{t('smsSentTo')} <b>{maskPhone(user.phone)}</b></div>
      </div>

      <div className="grow" />
      <PrimaryBtn to="/home">{t('goDashboard')}</PrimaryBtn>
    </div>
  );
}
