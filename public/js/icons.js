/**
 * Yala-Maha Assist · SVG Icons & DOM Helpers
 * -------------------------------------------
 */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const I = d => `<svg class="i" viewBox="0 0 24 24">${d}</svg>`;

const ico = {
  cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  cloud: I('<path d="M7 17a4 4 0 1 1 .9-7.9A5 5 0 0 1 17.5 10 3.500 3.500 0 0 1 17 17z"/><path d="M8 20l1-2m4 2l1-2"/>'),
  tool: I('<path d="M14.700 6.300a4 4 0 0 0-5.400 5.400L3 18l3 3 6.300-6.300a4 4 0 0 0 5.400-5.400l-2.500 2.500-2.500-.5-.5-2.500z"/>'),
  warn: I('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>'),
  drop: I('<path d="M12 3s6 6.500 6 11a6 6 0 0 1-12 0c0-4.500 6-11 6-11z"/>'),
  send: I('<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>'),
  lock: I('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  ph: I('<path d="M5 3h4l2 5-2.500 1.500a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>'),
  check: I('<path d="M20 6L9 17l-5-5"/>'),
  tag: I('<path d="M3 12l9-9h8v8l-9 9z"/><circle cx="15.500" cy="8.500" r="1"/>')
};

function toast(m) {
  const e = $('#toast');
  if (!e) return;
  e.textContent = m;
  e.classList.add('show');
  setTimeout(() => e.classList.remove('show'), 2200);
}
