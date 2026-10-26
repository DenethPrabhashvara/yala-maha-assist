import { useApp } from '../state/AppContext.jsx';
import { Aerial, PrimaryBtn } from '../components/UI.jsx';
import { PHOTOS } from '../data.js';

export default function NotFound() {
  const { t, user } = useApp();
  return (
    <div className="screen center-screen">
      <Aerial variant="dry" height={260} radius={32} photo={PHOTOS.harvest}>
        <div className="big-404">404</div>
      </Aerial>
      <div className="col gap6 center">
        <h1 className="h1">{t('notFound')}</h1>
        <p className="muted f15 lh">{t('notFoundBody')}</p>
      </div>
      <div className="grow" />
      <PrimaryBtn to={user ? '/home' : '/'}>{t('goHome')}</PrimaryBtn>
    </div>
  );
}
