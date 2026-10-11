/**
 * Yala-Maha Assist · Schematic SVG Map & GIS Calculations
 * --------------------------------------------------------
 * Pure-SVG stylized schematic map generator with mint plots, tanks,
 * canals, roads, and live Euclidean distance calculations.
 */

function calcLandmarkDist(x, y) {
  // Palugaswewa Tank cx: 240, cy: 180, rx: 90, ry: 55
  const dPal = Math.sqrt(((x - 240) / 90) ** 2 + ((y - 180) / 55) ** 2);
  const mPal = dPal <= 1 ? 40 : Math.round((dPal - 1) * 70 * 4);

  // Kudawewa Tank cx: 630, cy: 320, rx: 80, ry: 50
  const dKud = Math.sqrt(((x - 630) / 80) ** 2 + ((y - 320) / 50) ** 2);
  const mKud = dKud <= 1 ? 40 : Math.round((dKud - 1) * 65 * 4);

  // Main Canal line points
  const canalPts = [[40, 380], [150, 330], [260, 270], [350, 230], [410, 215], [520, 200], [640, 185], [760, 170]];
  let minCanalD = Infinity;
  canalPts.forEach(p => {
    const d = Math.hypot(x - p[0], y - p[1]);
    if (d < minCanalD) minCanalD = d;
  });
  const mCanal = Math.round(minCanalD * 3.8);

  let best = { name: "Palugaswewa Tank", si: "පලුගස්වැව වැව", ta: "பழுகஸ்வெவ குளம்", dist: mPal };
  if (mKud < best.dist) best = { name: "Kudawewa Tank", si: "කුඩාවැව වැව", ta: "குடாவெவ குளம்", dist: mKud };
  if (mCanal < best.dist) best = { name: "Main Canal B-02", si: "මහවැලි ප්‍රධාන ඇළ B-02", ta: "மகாவலி பிரதான கால்வாய் B-02", dist: mCanal };
  return best;
}

function getSchematicSvgBaseHtml(zoomLayerId) {
  return `<g id="${zoomLayerId}">
    <!-- Background field -->
    <rect width="800" height="500" fill="#F8FAFC"/>

    <!-- Farm plots (Mint rounded rectangles #ECFDF5 with stroke #A7F3D0) -->
    <rect x="60" y="50" width="110" height="75" rx="8" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5"/>
    <rect x="190" y="50" width="95" height="60" rx="8" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5"/>
    <rect x="70" y="150" width="100" height="70" rx="8" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5"/>
    <rect x="295" y="60" width="95" height="65" rx="8" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5"/>
    <rect x="80" y="290" width="110" height="75" rx="8" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5"/>
    <rect x="210" y="290" width="120" height="80" rx="8" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5"/>
    <rect x="460" y="60" width="110" height="70" rx="8" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5"/>
    <rect x="590" y="60" width="120" height="75" rx="8" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5"/>
    <rect x="460" y="150" width="105" height="70" rx="8" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5"/>
    <rect x="650" y="150" width="95" height="65" rx="8" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5"/>
    <rect x="460" y="360" width="100" height="70" rx="8" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5"/>
    <rect x="580" y="400" width="110" height="65" rx="8" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5"/>
    <rect x="240" y="400" width="120" height="65" rx="8" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5"/>
    <rect x="80" y="390" width="110" height="65" rx="8" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5"/>

    <!-- Canals (Grey dashed lines + water flow highlight) -->
    <path d="M 40 380 Q 200 270 410 215 T 760 170" fill="none" stroke="#64748B" stroke-width="3.5" stroke-dasharray="8 6"/>
    <path d="M 40 380 Q 200 270 410 215 T 760 170" fill="none" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="8 6"/>
    <text x="135" y="315" font-size="10" font-weight="700" fill="#64748B" transform="rotate(-28 135 315)">Main Canal B-02 ➔</text>
    
    <path d="M 410 215 Q 510 250 560 310" fill="none" stroke="#64748B" stroke-width="3" stroke-dasharray="7 5"/>
    <path d="M 410 215 Q 510 250 560 310" fill="none" stroke="#38BDF8" stroke-width="1.2" stroke-dasharray="7 5"/>

    <!-- Roads (White bands with highway marking) -->
    <rect x="0" y="238" width="800" height="24" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
    <line x1="0" y1="250" x2="800" y2="250" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="8 8"/>
    <text x="40" y="246" font-size="8.5" font-weight="700" fill="#94A3B8" letter-spacing="1">B-349 HIGHWAY</text>

    <rect x="408" y="0" width="24" height="500" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
    <line x1="420" y1="0" x2="420" y2="500" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="8 8"/>
    <text x="415" y="35" font-size="8.5" font-weight="700" fill="#94A3B8" transform="rotate(90 415 35)" letter-spacing="1">TRACT 4 ACCESS ROAD</text>
    <rect x="408" y="238" width="24" height="24" fill="#FFFFFF"/>

    <!-- Tanks (Light blue ellipses with blue border and bold blue label) -->
    <g id="tank-palugaswewa">
      <ellipse cx="240" cy="180" rx="90" ry="55" fill="#E0F2FE" stroke="#0284C7" stroke-width="2.5"/>
      <ellipse cx="240" cy="180" rx="72" ry="42" fill="none" stroke="#BAE6FD" stroke-width="1.5" stroke-dasharray="8 6"/>
      <text x="240" y="184" text-anchor="middle" font-size="12" font-weight="800" fill="#0369A1" font-family="Inter,sans-serif">Palugaswewa Tank</text>
    </g>

    <g id="tank-kudawewa">
      <ellipse cx="630" cy="320" rx="80" ry="50" fill="#E0F2FE" stroke="#0284C7" stroke-width="2.5"/>
      <ellipse cx="630" cy="320" rx="64" ry="38" fill="none" stroke="#BAE6FD" stroke-width="1.5" stroke-dasharray="8 6"/>
      <text x="630" y="324" text-anchor="middle" font-size="12" font-weight="800" fill="#0369A1" font-family="Inter,sans-serif">Kudawewa Tank</text>
    </g>

    <!-- Village Area Labels -->
    <text x="240" y="42" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">Palugaswewa North</text>
    <text x="210" y="475" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">Palugaswewa South</text>
    <text x="630" y="480" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">Kudawewa Lowlands</text>
    <text x="510" y="42" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">Horiwila Agrarian Tract</text>
    <text x="700" y="130" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">Maradankadawala Valley</text>
  </g>`;
}

// Export for Node/CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcLandmarkDist, getSchematicSvgBaseHtml };
}
