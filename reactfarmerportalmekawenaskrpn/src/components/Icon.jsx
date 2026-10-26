const P = {
  leaf: <><path d="M12 21V11" /><path d="M12 11c0-4 3-7 7-7 0 4-3 7-7 7Z" /><path d="M12 14c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5Z" /></>,
  bell: <><path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  warn: <><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4" /><path d="M12 17h.01" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  pin: <><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z" /><circle cx="12" cy="9" r="2.5" /></>,
  drop: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />,
  home: <><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  map: <><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7Z" /><path d="M9 4v13M15 7v13" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  cloud: <path d="M7 16a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19 9a3.5 3.5 0 0 1-1 7H7Z" />,
  rain: <><path d="M7 14a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19 7a3.5 3.5 0 0 1-1 7H7Z" /><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" /></>,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  sms: <><path d="M4 5h16v11H8l-4 4V5Z" /><path d="m9 10 2 2 4-4" /></>,
  message: <path d="M4 5h16v11H8l-4 4V5Z" />,
  check: <path d="m5 12 5 5 9-10" />,
  blockage: <><path d="M3 9h18M3 15h18" /><path d="M9 9l2 6M14 9l-1 6" /></>,
  leak: <><path d="M12 3s5 5.5 5 9.5a5 5 0 0 1-10 0C7 8.5 12 3 12 3Z" /><path d="M5 20h2M11 20h2M17 20h2" /></>,
  gate: <path d="M4 21V5M20 21V5M4 8h16M8 8v6l4-2 4 4V8" />,
  dots: <><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" /><circle cx="12" cy="13" r="3.5" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  send: <path d="M4 12 20 4l-6 16-3-7-7-1Z" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  pencil: <path d="M4 20h4L19 9l-4-4L4 16v4Z" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>,
  clock: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M10 2h4" /></>,
  target: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.6-4.5L4 8" /><path d="M4 3v5h5" /><path d="M4 13a8 8 0 0 0 14.6 4.5L20 16" /><path d="M20 21v-5h-5" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" /></>,
  logout: <><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4M6 12h10" /></>,
  wifiOff: <><path d="M3 3l18 18" /><path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14.5 10.4A10 10 0 0 1 19 13M2 9.5a15 15 0 0 1 4.3-2.6M10.5 6.1A15 15 0 0 1 22 9.5" /><path d="M12 20h.01" /></>,
  tank: <><path d="M3 10c3-2 6 2 9 0s6 2 9 0" /><path d="M3 15c3-2 6 2 9 0s6 2 9 0" /></>,
  chilli: <><path d="M12 8c-4 0-6 4-6 8 0 3 2 5 4 5 3 0 8-4 8-10 0-2-1-3-3-3h-3Z" /><path d="M12 8c0-2 1-4 3-5" /></>,
};

export default function Icon({ name, size = 20, color = 'currentColor', stroke = 2, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style} className={className}>
      {P[name] || P.dots}
    </svg>
  );
}
