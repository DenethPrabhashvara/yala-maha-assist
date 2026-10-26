import { useEffect, useRef, useState } from 'react';
import { TANKS } from '../data.js';

export default function TankPicker({ value, onChange, dark = false }) {
  const ref = useRef(null);
  // Fade whichever edge still has chips scrolled out of view, so the cut-off chip reads as "more".
  const [edges, setEdges] = useState({ l: false, r: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => setEdges({ l: el.scrollLeft > 2, r: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => { el.removeEventListener('scroll', measure); window.removeEventListener('resize', measure); };
  }, []);

  return (
    <div ref={ref} className={`tank-picker ${dark ? 'dark' : ''} ${edges.l ? 'fade-l' : ''} ${edges.r ? 'fade-r' : ''}`}
      role="radiogroup" aria-label="Tank">
      {TANKS.map((x) => (
        <button key={x.id} type="button" role="radio" aria-checked={value === x.id}
          className={value === x.id ? 'on' : ''} onClick={() => onChange(x.id)}>
          {x.name.replace(/ (Tank|Wewa)$/, '')}
        </button>
      ))}
    </div>
  );
}
