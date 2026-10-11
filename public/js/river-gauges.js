/* River page: "Measured River Gauges" table with rise/fall trend.
   Needs RIVER_CONFIG (river-config.js) to be loaded before this file.
   NOTE: this file now contains loadGauges(). Delete your old loadGauges() copy. */

const FAST_RISE = 0.3;     // metres per hour or more = "Rising fast"
const STEADY_BAND = 0.05;  // between -0.05 and +0.05 m/hr = "Steady"

// Turn { "20261006": { "230320": 0.25 } } into a sorted list [{ when, level }]
function getReadings(eventData, name) {
  const out = [];
  const days = eventData[name] || {};
  for (const day in days) {
    for (const time in days[day]) {
      const when = new Date(
        day.slice(0, 4) + "-" + day.slice(4, 6) + "-" + day.slice(6, 8) + "T" +
        time.slice(0, 2) + ":" + time.slice(2, 4) + ":" + time.slice(4, 6) + "+05:30"
      );
      out.push({ when: when, level: days[day][time] });
    }
  }
  return out.sort((a, b) => a.when - b.when);
}

// Metres per hour, compared with the newest reading that is at least 1 hour older
function getRate(readings) {
  const last = readings[readings.length - 1];
  for (let i = readings.length - 2; i >= 0; i--) {
    const hours = (last.when - readings[i].when) / 3600000;
    if (hours >= 1) return (last.level - readings[i].level) / hours;
  }
  return null;   // not enough history
}

async function loadGauges() {
  const g = RIVER_CONFIG.gauges;
  const res = await fetch(g.url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  const list = [];

  for (const name in g.stations) {
    const readings = getReadings(data.event_data, name);
    if (readings.length === 0) continue;

    const last = readings[readings.length - 1];
    const t = g.stations[name];

    let status = "Normal";
    if (last.level >= t.major) status = "Major flood";
    else if (last.level >= t.minor) status = "Minor flood";
    else if (last.level >= t.alert) status = "Alert";

    list.push({
      name: name,
      river: t.river,
      level: last.level,
      status: status,
      when: last.when,
      stale: (Date.now() - last.when) > g.staleAfterHours * 3600000,
      rate: getRate(readings)
    });
  }
  return list;
}

function statusPill(g) {
  if (g.stale) return '<span class="pill" style="background:#F1F5F9;color:#475569">No recent data</span>';
  if (g.level < 0) return '<span class="pill" style="background:#F1F5F9;color:#475569">Check gauge</span>';
  if (g.status === "Normal") return '<span class="pill ok">Normal</span>';
  if (g.status === "Major flood") return '<span class="pill bd">Major flood</span>';
  return '<span class="pill am">' + g.status + '</span>';   // Alert or Minor flood
}

function trendCell(g) {
  if (g.stale || g.level < 0 || g.rate === null) return "–";
  const r = g.rate, abs = Math.abs(r).toFixed(2) + " m/hr";
  if (r >= FAST_RISE) return '<span class="pill bd">▲ Rising fast ' + abs + '</span>';
  if (r >= STEADY_BAND) return '<span class="pill am">▲ Rising ' + abs + '</span>';
  if (r <= -STEADY_BAND) return '<span class="pill ok">▼ Falling ' + abs + '</span>';
  return "Steady";
}

async function showGauges() {
  const body = document.getElementById("rv-gauges-tbody");
  const note = document.getElementById("rv-gauges-updated");
  const mark = document.getElementById("rv-gauges-api-mark");
  if (!body) return;

  try {
    const list = await loadGauges();
    if (mark) {
      mark.innerHTML = '<span class="pulse-dot"></span>Live API Data';
    }
    body.innerHTML = list.map(g => {
      const when = g.when.toLocaleString("en-LK", {
        timeZone: "Asia/Colombo", day: "numeric", month: "short",
        hour: "numeric", minute: "2-digit"
      });
      return "<tr>" +
        "<td><b>" + g.name + "</b></td>" +
        "<td>" + g.river + "</td>" +
        "<td>" + g.level.toFixed(2) + " m</td>" +
        "<td>" + statusPill(g) + "</td>" +
        "<td>" + trendCell(g) + "</td>" +
        "<td>" + when + "</td>" +
        "</tr>";
    }).join("");
    note.textContent = "Checked " + new Date().toLocaleTimeString("en-LK", { timeZone: "Asia/Colombo" });
  } catch (e) {
    if (mark) {
      mark.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#EF4444"></span>API Offline';
    }
    body.innerHTML = '<tr><td colspan="6">Could not load gauge data. Will try again soon.</td></tr>';
    note.textContent = "Offline";
  }
}

// The page elements must exist first, so wait for the page to finish loading.
document.addEventListener("DOMContentLoaded", function () {
  showGauges();
  setInterval(showGauges, RIVER_CONFIG.api.refreshIntervalMinutes * 60 * 1000);
});