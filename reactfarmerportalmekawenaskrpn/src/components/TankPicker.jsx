import { TANKS } from '../data.js';

export default function TankPicker({ value, onChange, dark = false }) {
  return (
    <div className={`tank-picker ${dark ? 'dark' : ''}`} role="radiogroup" aria-label="Tank">
      {TANKS.map((x) => (
        <button key={x.id} type="button" role="radio" aria-checked={value === x.id}
          className={value === x.id ? 'on' : ''} onClick={() => onChange(x.id)}>
          {x.name.replace(/ (Tank|Wewa)$/, '')}
        </button>
      ))}
    </div>
  );
}
