/* River page: "7-Day Outlook" card (rain + river flow forecast from Open-Meteo).
   Needs RIVER_CONFIG (river-config.js) to be loaded before this file. */

const RAIN_WATCH = 20;   // mm in one day = "Wet day"
const HEAVY_RAIN = 50;   // mm in one day = "Heavy rain"
const FLOW_WATCH = 1.5;  // flow 1.5x today's flow = "Rising"
const FLOW_HIGH = 2;     // flow 2x today's flow = "High flow"

async function loadForecast() {
  const a = RIVER_CONFIG.api;
  const place = "latitude=" + a.latitude + "&longitude=" + a.longitude;
  const floodUrl = a.floodApiUrl + "?" + place +
    "&daily=river_discharge,river_discharge_max&forecast_days=" + a.forecastDays;
  const rainUrl = a.weatherApiUrl + "?" + place +
    "&daily=precipitation_sum&timezone=Asia%2FColombo&forecast_days=" + a.forecastDays;

  // allSettled: if one API fails, the other still shows
  const [flood, rain] = await Promise.allSettled([
    fetch(floodUrl).then(r => r.json()),
    fetch(rainUrl).then(r => r.json())
  ]);
  const f = flood.status === "fulfilled" && flood.value.daily ? flood.value.daily : null;
  const w = rain.status === "fulfilled" && rain.value.daily ? rain.value.daily : null;

  const dates = w ? w.time : (f ? f.time : []);
  return dates.map(d => {
    const fi = f ? f.time.indexOf(d) : -1;
    return {
      date: d,
      rain: w ? w.precipitation_sum[dates.indexOf(d)] : null,
      flow: fi >= 0 ? f.river_discharge[fi] : null,
      flowMax: fi >= 0 ? f.river_discharge_max[fi] : null
    };
  });
}

function dayLabel(d) {
  return new Date(d + "T00:00:00+05:30").toLocaleDateString("en-LK", {
    weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Colombo"
  });
}

function dayNote(day, todayFlow) {
  if (day.rain !== null && day.rain >= HEAVY_RAIN) return '<span class="pill bd">Heavy rain</span>';
  if (day.flow !== null && todayFlow > 0) {
    const ratio = day.flow / todayFlow;
    if (ratio >= FLOW_HIGH) return '<span class="pill bd">High flow</span>';
    if (ratio >= FLOW_WATCH) return '<span class="pill am">Flow rising</span>';
  }
  if (day.rain !== null && day.rain >= RAIN_WATCH) return '<span class="pill am">Wet day</span>';
  return '<span class="pill ok">Normal</span>';
}

function num(x, digits) { return x === null || x === undefined ? "–" : x.toFixed(digits); }

async function showForecast() {
  const body = document.getElementById("rv-forecast-tbody");
  const sum = document.getElementById("rv-forecast-summary");
  if (!body) return;

  try {
    const days = await loadForecast();
    if (days.length === 0) throw new Error("no data");

    const flows = days.map(d => d.flow).filter(x => x !== null);
    const todayFlow = flows.length ? flows[0] : 0;

    body.innerHTML = days.map(d =>
      "<tr>" +
      "<td><b>" + dayLabel(d.date) + "</b></td>" +
      "<td>" + num(d.rain, 1) + " mm</td>" +
      "<td>" + num(d.flow, 1) + " m³/s</td>" +
      "<td>" + num(d.flowMax, 1) + " m³/s</td>" +
      "<td>" + dayNote(d, todayFlow) + "</td>" +
      "</tr>"
    ).join("");

    const rainDays = days.filter(d => d.rain !== null);
    const totalRain = rainDays.reduce((s, d) => s + d.rain, 0);
    let text = rainDays.length
      ? "Rain, next " + days.length + " days: " + totalRain.toFixed(1) + " mm"
      : "Rain forecast unavailable";
    if (flows.length) {
      const peak = days.reduce((p, d) => (d.flow !== null && d.flow > (p.flow || 0)) ? d : p, days[0]);
      text += " · Peak flow: " + peak.flow.toFixed(1) + " m³/s on " + dayLabel(peak.date);
    } else {
      text += " · No river flow found at these coordinates. Try changing latitude or longitude by 0.05 to 0.1 in river-config.js.";
    }
    sum.textContent = text;
  } catch (e) {
    body.innerHTML = '<tr><td colspan="5">Could not load the forecast. Will try again soon.</td></tr>';
    sum.textContent = "Offline";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  showForecast();
  setInterval(showForecast, RIVER_CONFIG.api.refreshIntervalMinutes * 60 * 1000);
});
