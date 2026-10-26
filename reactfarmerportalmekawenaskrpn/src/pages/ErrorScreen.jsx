import { useApp } from '../state/AppContext.jsx';
import { PrimaryBtn } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';

export default function ErrorScreen({ detail, onRetry }) {
  const { t } = useApp();
  return (
    <div className="screen center-screen">
      <div className="err-art">
        <div className="err-ring"><Icon name="warn" size={48} stroke={2} /></div>
      </div>
      <div className="col gap6 center">
        <h1 className="h1">{t('errorTitle')}</h1>
        <p className="muted f15 lh">{t('errorBody')}</p>
        {detail && <code className="err-code">{detail}</code>}
      </div>
      <div className="grow" />
      <PrimaryBtn onClick={() => (onRetry ? onRetry() : window.location.reload())} icon="refresh">{t('tryAgain')}</PrimaryBtn>
      <a href="#/home" className="text-btn center" onClick={onRetry}>{t('goHome')}</a>
    </div>
  );
}
