/* River page: ONE overall risk level (Normal / Watch / Warning / Danger).
   Combines the measured gauges (river-gauges.js) and the 7-day forecast (river-forecast.js).
   Load this file AFTER river-gauges.js and river-forecast.js. */

const RISK_NAMES = ["Normal", "Watch", "Warning", "Danger"];

const RISK_STYLE = {
  Normal:  { bg: "#ECFDF5", bd: "#A7F3D0", fg: "#047857", msg: "No flood risk right now" },
  Watch:   { bg: "#FFFBEB", bd: "#FDE68A", fg: "#B45309", msg: "Keep an eye on river levels" },
  Warning: { bg: "#FFF7ED", bd: "#FDBA74", fg: "#C2410C", msg: "Flood risk is building. Get ready." },
  Danger:  { bg: "#FFF1F2", bd: "#FECDD3", fg: "#BE123C", msg: "Flood danger. Warn farmers now." },
  Unknown: { bg: "#F1F5F9", bd: "#E2E8F0", fg: "#475569", msg: "Not enough data to judge the risk" }
};

// gauges = result of loadGauges(), days = result of loadForecast()
function computeRisk(gauges, days) {
  let top = 0;
  const reasons = [];
  function flag(level, text) {
    if (level > top) top = level;
    reasons.push({ level: level, text: text });
  }

  const usable = gauges.filter(g => !g.stale && g.level >= 0);   // ignore dead or faulty gauges
  const next3 = days.slice(0, 3);
  const heavyDay = next3.find(d => d.rain !== null && d.rain >= HEAVY_RAIN);
  const wetDay = next3.find(d => d.rain !== null && d.rain >= RAIN_WATCH);

  // 1. Measured gauges
  usable.forEach(g => {
    if (g.status === "Major flood" || g.status === "Minor flood") {
      flag(3, g.name + ": " + g.status + " level (" + g.level.toFixed(2) + " m)");
    } else if (g.status === "Alert") {
      flag(2, g.name + ": alert level reached (" + g.level.toFixed(2) + " m)");
    }
    if (g.rate !== null && g.rate >= FAST_RISE) {
      flag(heavyDay ? 3 : 2, g.name + " rising fast, " + g.rate.toFixed(2) + " m/hr" +
        (heavyDay ? ", and heavy rain is forecast" : ""));
    } else if (g.rate !== null && g.rate >= STEADY_BAND) {
      flag(wetDay ? 2 : 1, g.name + " rising, " + g.rate.toFixed(2) + " m/hr" +
        (wetDay ? ", and rain is forecast" : ""));
    }
  });

  // 2. Rain forecast (next 3 days)
  if (heavyDay) flag(2, "Heavy rain forecast: " + heavyDay.rain.toFixed(0) + " mm on " + dayLabel(heavyDay.date));
  else if (wetDay) flag(1, "Wet day forecast: " + wetDay.rain.toFixed(0) + " mm on " + dayLabel(wetDay.date));

  // 3. River flow forecast (next 3 days, compared with the first day)
  const flows = days.map(d => d.flow).filter(x => x !== null);
  const baseFlow = flows.length ? flows[0] : 0;
  let worst = null;
  if (baseFlow > 0) {
    next3.forEach(d => {
      if (d.flow !== null && (worst === null || d.flow > worst.flow)) worst = d;
    });
    if (worst) {
      const ratio = worst.flow / baseFlow;
      if (ratio >= FLOW_HIGH) flag(2, "River flow forecast to reach " + ratio.toFixed(1) + "x today's flow on " + dayLabel(worst.date));
      else if (ratio >= FLOW_WATCH) flag(1, "River flow forecast to reach " + ratio.toFixed(1) + "x today's flow on " + dayLabel(worst.date));
    }
  }

  const hasForecast = days.some(d => d.rain !== null || d.flow !== null);
  if (usable.length === 0 && !hasForecast) {
    return { level: "Unknown", reasons: [], skipped: gauges.length - usable.length, used: 0 };
  }

  reasons.sort((a, b) => b.level - a.level);
  return {
    level: RISK_NAMES[top],
    reasons: reasons,
    skipped: gauges.length - usable.length,   // gauges ignored because stale or faulty
    used: usable.length
  };
}

async function showRisk() {
  const card = document.getElementById("rv-risk-card");
  if (!card) return;

  const [g, f] = await Promise.allSettled([loadGauges(), loadForecast()]);
  const gauges = g.status === "fulfilled" ? g.value : [];
  const days = f.status === "fulfilled" ? f.value : [];
  const risk = computeRisk(gauges, days);
  const st = RISK_STYLE[risk.level];

  card.style.background = st.bg;
  card.style.border = "1.5px solid " + st.bd;
  const title = document.getElementById("rv-risk-level");
  title.textContent = risk.level;
  title.style.color = st.fg;
  document.getElementById("rv-risk-msg").textContent = st.msg;
  document.getElementById("rv-risk-updated").textContent =
    "Checked " + new Date().toLocaleTimeString("en-LK", { timeZone: "Asia/Colombo" });

  const list = document.getElementById("rv-risk-reasons");
  list.replaceChildren();
  risk.reasons.slice(0, 5).forEach(r => {
    const li = document.createElement("li");
    li.textContent = r.text;
    list.appendChild(li);
  });
  if (risk.skipped > 0) {
    const li = document.createElement("li");
    li.style.color = "#64748B";
    li.textContent = risk.skipped + " gauge(s) ignored: no recent data or a faulty reading";
    list.appendChild(li);
  }
  if (g.status !== "fulfilled" || f.status !== "fulfilled") {
    const li = document.createElement("li");
    li.style.color = "#64748B";
    li.textContent = (g.status !== "fulfilled" ? "Gauge data" : "Forecast data") + " could not be loaded";
    list.appendChild(li);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  showRisk();
  setInterval(showRisk, RIVER_CONFIG.api.refreshIntervalMinutes * 60 * 1000);
});
