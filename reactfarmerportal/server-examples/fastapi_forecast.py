"""Example FastAPI endpoint that returns the JSON the app expects.

Run:  pip install fastapi uvicorn joblib pandas requests
      uvicorn fastapi_forecast:app --port 8000

Replace `predict_levels` with your trained model. The app only needs the
response shape below; lower/upper (likely range) are optional but recommended.
"""
from datetime import date, datetime, timedelta

import requests
from fastapi import FastAPI, HTTPException

app = FastAPI()

TANKS = {
    "horabora": {"name": "Horabora Wewa", "lat": 7.364212, "lon": 81.021310, "spill": 95, "low": 30},
    # add the other tanks from your dataset here
}

# model = joblib.load("tank_level_model.joblib")


def rain_forecast(lat, lon, days):
    """Daily rain (mm) from Open-Meteo forecast API (max 16 days)."""
    r = requests.get(
        "https://api.open-meteo.com/v1/forecast",
        params={"latitude": lat, "longitude": lon, "daily": "precipitation_sum",
                "forecast_days": days + 1, "timezone": "Asia/Colombo"},
        timeout=10,
    )
    r.raise_for_status()
    d = r.json()["daily"]
    return list(zip(d["time"], d["precipitation_sum"]))[1:days + 1]  # skip today


def predict_levels(tank_id, current_level, rain_days):
    """Placeholder: replace with model.predict(...) on your features."""
    out, level = [], current_level
    for i, (_, rain) in enumerate(rain_days):
        level = max(0, min(100, level + (rain or 0) * 0.18 - 0.6))
        spread = 1 + i * 0.45  # e.g. from quantile models or residual std
        out.append((level, level - spread, level + spread))
    return out


@app.get("/predict/{tank_id}")
def predict(tank_id: str, days: int = 14):
    tank = TANKS.get(tank_id)
    if not tank:
        raise HTTPException(404, "Unknown tank")
    current = 58.0  # read the latest observed level from your database
    rain = rain_forecast(tank["lat"], tank["lon"], days)
    preds = predict_levels(tank_id, current, rain)
    today = date.today()
    return {
        "tank_id": tank_id,
        "tank_name": tank["name"],
        "generated_at": datetime.now().astimezone().isoformat(),
        "model_version": "rf-v1",
        "unit": "percent",
        "thresholds": {"low": tank["low"], "spill": tank["spill"]},
        "history": [  # last 7 observed days from your database
            {"date": str(today - timedelta(days=6 - i)), "level_pct": current - (6 - i) * 0.9} for i in range(7)
        ],
        "forecast": [
            {"date": d, "level_pct": round(p, 1), "lower": round(lo, 1), "upper": round(hi, 1), "rain_mm": r or 0}
            for (d, r), (p, lo, hi) in zip(rain, preds)
        ],
    }
