const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Load the exported model bundle on startup
const MODEL_BUNDLE = JSON.parse(
  fs.readFileSync(path.join(__dirname, "tank_model.json"), "utf-8")
);
const { features: FEATURES, horizon_days: HORIZON_DAYS, tanks: TANKS, baseline_prediction, trees } = MODEL_BUNDLE;

// 2. Pure JS inference for scikit-learn HistGradientBoostingRegressor
function predictTreeEnsemble(featureVectorObject) {
  // Ensure exact feature order expected by tank_model.pkl
  const x = FEATURES.map((name) => featureVectorObject[name]);
  let pred = baseline_prediction;

  for (const nodes of trees) {
    let idx = 0;
    while (!nodes[idx].leaf) {
      const node = nodes[idx];
      const val = x[node.feat];
      if (Number.isNaN(val) || val === null || val === undefined) {
        idx = node.miss_left ? node.left : node.right;
      } else if (val <= node.thresh) {
        idx = node.left;
      } else {
        idx = node.right;
      }
    }
    pred += nodes[idx].val;
  }
  return pred;
}

// Helper: median of a numeric array
function median(arr) {
  const valid = arr.filter((v) => v !== null && !Number.isNaN(v)).sort((a, b) => a - b);
  if (valid.length === 0) return NaN;
  const mid = Math.floor(valid.length / 2);
  return valid.length % 2 !== 0 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
}

// Helper: Day of Year (1 - 366) matching pandas .dayofyear
function getDayOfYear(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const current = Date.UTC(y, m - 1, d);
  const startOfYear = Date.UTC(y, 0, 0);
  return Math.floor((current - startOfYear) / (1000 * 60 * 60 * 24));
}

// Helper: Add days to YYYY-MM-DD
function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().split("T")[0];
}

// 3. Fetch 65 days of rainfall from Open-Meteo for the tank's coordinates
async function fetchRainfallMap(lat, lon, endDateStr) {
  const startDateStr = addDays(endDateStr, -65);
  const todayStr = new Date().toISOString().split("T")[0];
  const diffDays = (new Date(todayStr) - new Date(endDateStr)) / (1000 * 60 * 60 * 24);

  let url;
  if (diffDays <= 5) {
    url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&past_days=65&forecast_days=1&daily=precipitation_sum&timezone=Asia%2FColombo`;
  } else {
    url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDateStr}&end_date=${endDateStr}&daily=precipitation_sum&timezone=Asia%2FColombo`;
  }

  const res = await fetch(url);
  const data = await res.json();
  if (!data.daily || !data.daily.time) {
    throw new Error(`Open-Meteo error: ${data.reason || "No daily rainfall returned"}`);
  }

  const rainMap = new Map();
  data.daily.time.forEach((date, i) => {
    rainMap.set(date, data.daily.precipitation_sum[i] ?? 0);
  });
  return rainMap;
}

// 4. Build daily storage series with up to 3-day forward-fill (Step 3 of notebook)
function buildDailyStorage(readings) {
  const byDate = new Map();
  for (const r of readings) {
    byDate.set(r.date, Number(r.storage_acft));
  }
  const sortedDates = Array.from(byDate.keys()).sort();
  if (sortedDates.length === 0) return [];

  const minDate = sortedDates[0];
  const maxDate = sortedDates[sortedDates.length - 1];

  const series = [];
  let curr = minDate;
  let lastVal = null;
  let ffillCount = 0;

  while (curr <= maxDate) {
    if (byDate.has(curr) && !Number.isNaN(byDate.get(curr))) {
      lastVal = byDate.get(curr);
      ffillCount = 0;
      series.push({ date: curr, storage: lastVal });
    } else if (lastVal !== null && ffillCount < 3) {
      ffillCount += 1;
      series.push({ date: curr, storage: lastVal });
    } else {
      series.push({ date: curr, storage: NaN });
    }
    curr = addDays(curr, 1);
  }
  return series;
}
// Serve external HTML files from the "public" directory at "/"
app.use(express.static(path.join(__dirname, "public")));

// GET /api/forecast/tanks - Return all tanks and their capacities
app.get("/api/forecast/tanks", (req, res) => {
  const tankList = Object.entries(TANKS).map(([name, meta]) => ({
    name,
    lat: meta.lat,
    lon: meta.lon,
    fill_ref: meta.fill_ref,
  }));
  res.json({ horizon_days: HORIZON_DAYS, count: tankList.length, tanks: tankList });
});

// POST /api/forecast/predict - Compute features & run 14-day forecast
app.post("/api/forecast/predict", async (req, res) => {
  try {
    const { tank, readings } = req.body;
    if (!tank || !TANKS[tank]) {
      return res.status(404).json({ error: `Tank '${tank}' not found in model.` });
    }
    if (!Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ error: "Readings array is required." });
    }

    const { lat, lon, fill_ref } = TANKS[tank];
    const dailySeries = buildDailyStorage(readings);

    if (dailySeries.length < 15) {
      return res.status(400).json({
        error: "At least 15 days of recent daily storage readings are required.",
      });
    }

    // Smooth fill with a 3-day rolling median (min_periods=1)
    const smoothedFill = dailySeries.map((item, idx) => {
      const windowVals = dailySeries
        .slice(Math.max(0, idx - 2), idx + 1)
        .map((d) => d.storage / fill_ref);
      return median(windowVals);
    });

    const latestIdx = dailySeries.length - 1;
    const latestDate = dailySeries[latestIdx].date;
    const fillNow = smoothedFill[latestIdx];

    // Fetch rainfall from Open-Meteo up to latestDate
    const rainMap = await fetchRainfallMap(lat, lon, latestDate);

    const getRainSum = (w) => {
      let sum = 0;
      for (let i = 0; i < w; i++) {
        const d = addDays(latestDate, -i);
        sum += rainMap.get(d) ?? 0;
      }
      return sum;
    };

    const doy = getDayOfYear(latestDate);

    const featureRow = {
      fill: fillNow,
      fill_chg3: fillNow - smoothedFill[latestIdx - 3],
      fill_chg7: fillNow - smoothedFill[latestIdx - 7],
      fill_chg14: fillNow - smoothedFill[latestIdx - 14],
      near_full: fillNow > 0.95 ? 1 : 0,
      rain_lag1: rainMap.get(addDays(latestDate, -1)) ?? 0,
      rain_lag2: rainMap.get(addDays(latestDate, -2)) ?? 0,
      rain_lag3: rainMap.get(addDays(latestDate, -3)) ?? 0,
      rain_sum3: getRainSum(3),
      rain_sum7: getRainSum(7),
      rain_sum14: getRainSum(14),
      rain_sum30: getRainSum(30),
      rain_sum60: getRainSum(60),
      doy_sin: Math.sin((2 * Math.PI * doy) / 365),
      doy_cos: Math.cos((2 * Math.PI * doy) / 365),
      cap_ref: fill_ref,
      lat,
      lon,
    };

    const rawDelta = predictTreeEnsemble(featureRow);
    const predictedFill = Math.min(1.2, Math.max(0.0, fillNow + rawDelta));
    const change = predictedFill - fillNow;

    let outlook = "steady";
    if (change > 0.03) outlook = "rising";
    else if (change < -0.03) outlook = "falling";

    // Build history array for graphing
    const historySeries = dailySeries.map((d, i) => ({
      date: d.date,
      fill_pct: Number((smoothedFill[i] * 100).toFixed(1)),
      storage_acft: Math.round(d.storage),
      rain_mm: Number((rainMap.get(d.date) ?? 0).toFixed(1)),
    }));

    res.json({
      tank,
      from_date: latestDate,
      target_date: addDays(latestDate, HORIZON_DAYS),
      horizon_days: HORIZON_DAYS,
      fill_ref_acft: Number(fill_ref.toFixed(2)),
      fill_now: Number(fillNow.toFixed(4)),
      storage_now_acft: Number((fillNow * fill_ref).toFixed(1)),
      predicted_fill_in_14d: Number(predictedFill.toFixed(4)),
      predicted_storage_in_14d_acft: Number((predictedFill * fill_ref).toFixed(1)),
      change: Number(change.toFixed(4)),
      outlook,
      rain_last_7d_mm: Number(featureRow.rain_sum7.toFixed(1)),
      history: historySeries,
    });
  } catch (err) {
    console.error("Prediction error:", err);
    res.status(500).json({ error: err.message || "Prediction failed" });
  }
});

// Health-check route for "/"
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Tank Level Forecaster API",
    tanks_loaded: Object.keys(TANKS).length,
    endpoints: {
      list_tanks: "GET /api/forecast/tanks",
      predict: "POST /api/forecast/predict",
    },
  });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Node.js Tank Forecaster API running on http://localhost:${PORT}`);
});