import { useEffect } from 'react';
import Icon from './Icon.jsx';

export default function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="row between">
          <div className="f20 fw600">{title}</div>
          <button type="button" className="icon-btn soft" style={{ width: 44, height: 44 }} aria-label="Close" onClick={onClose}>
            <Icon name="close" size={18} stroke={2.2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
