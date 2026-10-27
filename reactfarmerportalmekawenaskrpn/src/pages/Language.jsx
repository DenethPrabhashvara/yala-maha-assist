import { useApp } from '../state/AppContext.jsx';
import { IconBtn, PrimaryBtn } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import { LANGS } from '../i18n.js';

const SAMPLE = { en: 'Flood alerts, tank levels and water release times', si: 'ගංවතුර, වැව් මට්ටම් සහ ජල නිකුතු වේලාවන්', ta: 'வெள்ளம், குள மட்டம் மற்றும் நீர் திறப்பு நேரங்கள்' };

export default function Language() {
  const { t, lang, update } = useApp();
  return (
    <div className="screen">
      <div className="row"><IconBtn icon="back" label={t('back')} to="/welcome" /></div>
      <div>
        <div className="icon-tile accent"><Icon name="globe" size={26} /></div>
        <h1 className="h1" style={{ marginTop: 16 }}>{t('chooseLanguage')}</h1>
        <p className="muted f15">{t('changeLater')}</p>
      </div>
      <div className="col gap10" role="radiogroup" aria-label={t('language')}>
        {LANGS.map((l) => (
          <button key={l.code} type="button" role="radio" aria-checked={lang === l.code}
            className={`lang-option ${lang === l.code ? 'on' : ''}`} onClick={() => update({ lang: l.code })}>
            <span className="lo-short">{l.short}</span>
            <span className="grow" style={{ textAlign: 'left' }}>
              <span className={`f18 fw600 block font-${l.code}`}>{l.label}</span>
              <span className={`f13 muted block font-${l.code}`}>{SAMPLE[l.code]}</span>
            </span>
            <span className="radio-dot">{lang === l.code && <Icon name="check" size={14} stroke={3.2} />}</span>
          </button>
        ))}
      </div>
      <div className="grow" />
      <PrimaryBtn to="/login">{t('continue')}</PrimaryBtn>
    </div>
  );
}
