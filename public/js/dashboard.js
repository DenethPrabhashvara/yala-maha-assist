/**
 * Yala-Maha Assist · Tank Dashboard Module
 * ----------------------------------------
 * Handles 30-day water level SVG curve chart rendering and
 * 7-day rainfall forecast bar graph rendering.
 */

function initDashboard() {
  drawTankLevelChart();
  drawRainfallBars();
}

function drawTankLevelChart() {
  const chartEl = $('#chart');
  if (!chartEl) return;

  const pts = [25, 40, 50, 42, 80, 55, 48];
  const lb = ['Sep 01', 'Sep 05', 'Sep 10', 'Sep 15', 'Sep 20', 'Sep 25', 'Oct 01'];
  const L = 44, R = 630, Tp = 12, H = 220, W = R - L;
  const X = i => L + W * i / 6;
  const Y = v => Tp + H * (100 - v) / 100;

  let g = '';
  // Horizontal grid lines and level labels (0% to 100%)
  [0, 20, 40, 60, 80, 100].forEach(v => {
    g += `<line x1="${L}" x2="${R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#F1F5F9"/>`;
    g += `<text x="${L - 8}" y="${Y(v) + 3}" text-anchor="end" font-size="10" fill="#94A3B8">${v}%</text>`;
  });

  // Vertical date tick lines
  lb.forEach((t, i) => {
    g += `<line y1="${Tp}" y2="${Tp + H}" x1="${X(i)}" x2="${X(i)}" stroke="#F1F5F9"/>`;
    g += `<text x="${X(i)}" y="${Tp + H + 18}" text-anchor="middle" font-size="10" fill="#94A3B8">${t}</text>`;
  });

  // Smooth cubic Bezier spline for water level
  let d = `M${X(0)} ${Y(pts[0])}`;
  for (let i = 0; i < 6; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const x0 = X(i - 1 < 0 ? 0 : i - 1);
    const x3 = X(i + 2 > 6 ? 6 : i + 2);
    d += ` C${X(i) + (X(i + 1) - x0) / 6} ${Y(p1) + (-(p2 - p0)) * H / 100 / 6 * -1 * -1},${X(i + 1) - (x3 - X(i)) / 6} ${Y(p2) + (p3 - p1) * H / 100 / 6},${X(i + 1)} ${Y(p2)}`;
  }

  // Shaded area under curve
  g += `<path d="${d} L${R} ${Tp + H} L${L} ${Tp + H}Z" fill="#0F766E" opacity=".1"/>`;
  // Level line
  g += `<path d="${d}" fill="none" stroke="#0F766E" stroke-width="2.500"/>`;
  // 20% critical threshold dashed line
  g += `<line x1="${L}" x2="${R}" y1="${Y(20)}" y2="${Y(20)}" stroke="#E11D48" stroke-dasharray="5 4" stroke-width="1.500"/>`;
  g += `<text x="${L + 52}" y="${Y(20) - 5}" font-size="9" font-weight="700" fill="#E11D48" text-anchor="middle">CRITICAL 20%</text>`;

  chartEl.innerHTML = g;
}

function drawRainfallBars() {
  const rainEl = $('#rain');
  if (!rainEl) return;

  const rainData = [
    ['Thu', 1.0],
    ['Fri', 0.0],
    ['Sat', 3.5],
    ['Sun', 6.0]
  ];

  rainEl.innerHTML = rainData.map(([d, v]) => `
    <div>
      <b>${v.toFixed(1)}</b>
      <i style="height:${(v / 6) * 100 * 0.7}%;${d === 'Sun' ? 'background:#0F766E' : ''}"></i>
      <span style="margin-top:8px;${d === 'Sun' ? 'color:#0F766E;font-weight:700' : ''}">${d}</span>
    </div>
  `).join('');
}
