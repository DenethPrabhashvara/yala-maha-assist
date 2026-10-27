import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import { Aerial, Logo, PrimaryBtn } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import { PHOTOS } from '../data.js';
import { COLORS } from '../theme.js';

const SLIDES = [
  { title: 'ob1Title', body: 'ob1Body', art: 'flood' },
  { title: 'ob2Title', body: 'ob2Body', art: 'water' },
  { title: 'ob3Title', body: 'ob3Body', art: 'report' },
];

function Art({ kind }) {
  if (kind === 'flood') {
    return (
      <Aerial variant="hero" height="100%" radius={32} photo={PHOTOS.flood}>
        <div className="art-float" style={{ left: 16, bottom: 16, right: 16 }}>
          <span className="warn-badge"><Icon name="warn" size={14} stroke={2.6} />FLOOD WATCH · Level 2</span>
          <div className="f18 fw600" style={{ marginTop: 8 }}>Yan Oya river may overflow</div>
          <div className="f13" style={{ color: COLORS.dim }}>Peak expected Thursday evening</div>
        </div>
      </Aerial>
    );
  }
  if (kind === 'water') {
    return (
      <Aerial variant="dark" height="100%" radius={32} photo={PHOTOS.tank}>
        <div className="art-float" style={{ left: 16, bottom: 16, right: 16 }}>
          <div className="row gap10">
            <div className="date-tile"><small>THU</small><b>29</b></div>
            <div><div className="f24 fw600">6:00 AM</div><div className="f13" style={{ color: COLORS.dim }}>Water release · Channel D-4</div></div>
          </div>
          <div className="mini-bars" aria-hidden="true">{[48, 55, 58, 62, 66, 69, 72].map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}</div>
        </div>
      </Aerial>
    );
  }
  return (
    <Aerial variant="b" height="100%" radius={32} photo={PHOTOS.canal}>
      <div className="art-float" style={{ left: 16, bottom: 16, right: 16 }}>
        <div className="row gap10">
          <span className="ok-circle"><Icon name="check" size={18} stroke={2.8} /></span>
          <div><div className="f15 fw600">Received · CR-2041</div><div className="f13" style={{ color: COLORS.dim }}>Officer visit within 2 days</div></div>
        </div>
      </div>
    </Aerial>
  );
}

export default function Welcome() {
  const { t, update } = useApp();
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const touch = useRef(null);
  const last = i === SLIDES.length - 1;

  const finish = () => { update({ onboarded: true }); navigate('/language'); };
  const go = (n) => setI(Math.max(0, Math.min(SLIDES.length - 1, n)));

  return (
    <div className="screen onboard"
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}>
      <div className="row between">
        <div className="row gap10"><Logo size={40} /><span className="fw600 f15">{t('appName')}</span></div>
        {!last && <button type="button" className="text-btn" onClick={finish}>{t('skip')}</button>}
      </div>

      <div className="ob-art" key={i}><Art kind={SLIDES[i].art} /></div>

      <div className="ob-copy" key={`c${i}`}>
        <h1 className="h1">{t(SLIDES[i].title)}</h1>
        <p className="muted f16 lh">{t(SLIDES[i].body)}</p>
      </div>

      <div className="row between">
        <div className="dots" role="tablist" aria-label="Slides">
          {SLIDES.map((s, n) => (
            <button key={s.title} type="button" role="tab" aria-selected={n === i} aria-label={`Slide ${n + 1}`}
              className={`dot ${n === i ? 'on' : ''}`} onClick={() => go(n)} />
          ))}
        </div>
      </div>
      <PrimaryBtn onClick={() => (last ? finish() : go(i + 1))}>{last ? t('getStarted') : t('next')}</PrimaryBtn>
    </div>
  );
}
