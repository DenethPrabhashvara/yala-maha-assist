#!/usr/bin/env python3
"""Fetch rainfall observations and station details from the Irrigation Department."""

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import psycopg2



OBSERVATIONS_URL = (
    "https://services3.arcgis.com/J7ZFXmR8rSmQ3FGf/arcgis/rest/services/"
    "gauges_2_view/FeatureServer/0/query"
)
STATIONS_URL = (
    "https://services3.arcgis.com/J7ZFXmR8rSmQ3FGf/arcgis/rest/services/"
    "hydrostations/FeatureServer/0/query"
)
DASHBOARD_URL = (
    "https://slirrigation.maps.arcgis.com/apps/dashboards/"
    "5c30e3fc436543ecbaa74b6f2835b67a"
)
DEFAULT_OUTPUT_FILE = Path(__file__).with_name("realtime_rainfall.json")
STATION_FIELDS = (
    "station,basin,latitude,longitude,Unit,Tributory,Alert_Level,"
    "Minor_Flood_Level,Major_Flood_Level,Elivation_m_MSL"
)
PAGE_SIZE = 1000
TIMEOUT_SECONDS = 30
SRI_LANKA_TIME = ZoneInfo("Asia/Colombo")

DB_HOST = os.getenv("APIDBHOST", os.getenv("DB_HOST", "localhost"))
DB_PORT = int(os.getenv("APIDBPORT", os.getenv("DB_PORT", "5432")))
DB_NAME = os.getenv("APIDATABASE", os.getenv("DB_NAME", "yala-maha-api"))
DB_USER = os.getenv("APIDBUSERN", os.getenv("DB_USER", "postgres"))
DB_PASSWORD = os.getenv("APIDBPASSWORD", os.getenv("DB_PASSWORD", "postgres"))

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS rainfall_realtime (
    global_id TEXT PRIMARY KEY,
    basin TEXT,
    gauge TEXT,
    station TEXT,
    rain_fall DOUBLE PRECISION,
    creation_date TIMESTAMPTZ,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    alertpull DOUBLE PRECISION,
    minorpull DOUBLE PRECISION,
    majorpull DOUBLE PRECISION,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
"""

UPSERT_SQL = """
INSERT INTO rainfall_realtime (
    global_id, basin, gauge, station, rain_fall, creation_date,
    latitude, longitude, alertpull, minorpull, majorpull, fetched_at
) VALUES (
    %(global_id)s, %(basin)s, %(gauge)s, %(station)s, %(rain_fall)s,
    %(creation_date)s, %(latitude)s, %(longitude)s, %(alertpull)s,
    %(minorpull)s, %(majorpull)s, %(fetched_at)s
)
ON CONFLICT (global_id) DO UPDATE SET
    basin = EXCLUDED.basin,
    gauge = EXCLUDED.gauge,
    station = EXCLUDED.station,
    rain_fall = EXCLUDED.rain_fall,
    creation_date = EXCLUDED.creation_date,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    alertpull = EXCLUDED.alertpull,
    minorpull = EXCLUDED.minorpull,
    majorpull = EXCLUDED.majorpull,
    fetched_at = EXCLUDED.fetched_at
"""


class ArcGISRequestError(Exception):
    """Raised when ArcGIS returns a transport or service error."""


def query_arcgis(url, params):
    query = urllib.parse.urlencode({"f": "json", **params})
    request = urllib.request.Request(
        f"{url}?{query}",
        headers={"User-Agent": "Yala-Maha-Assist rainfall data fetcher"},
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            result = json.load(response)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        raise ArcGISRequestError(f"Could not fetch data from ArcGIS: {error}") from error

    if "error" in result:
        details = result["error"]
        raise ArcGISRequestError(
            f"ArcGIS error {details.get('code')}: "
            f"{details.get('message', 'ArcGIS request failed')}"
        )
    return result


def sql_string(value):
    """Quote a user-supplied string as an ArcGIS SQL string literal."""
    return "'" + value.replace("'", "''") + "'"


def normalize_name(value):
    return " ".join((value or "").split()).casefold()


def fetch_features(url, where, out_fields, order_by=None):
    features = []
    offset = 0

    while True:
        params = {
            "where": where,
            "outFields": out_fields,
            "returnGeometry": "false",
            "resultRecordCount": PAGE_SIZE,
            "resultOffset": offset,
        }
        if order_by:
            params["orderByFields"] = order_by

        result = query_arcgis(url, params)
        page = result.get("features", [])
        features.extend(feature.get("attributes", {}) for feature in page)
        offset += len(page)

        if not page or (
            len(page) < PAGE_SIZE and not result.get("exceededTransferLimit", False)
        ):
            break

    return features


def as_utc_datetime(timestamp):
    if timestamp is None:
        return None
    return datetime.fromtimestamp(timestamp / 1000, tz=timezone.utc)


def timestamp_to_iso(timestamp):
    value = as_utc_datetime(timestamp)
    return value.isoformat(timespec="milliseconds") if value else None


def build_rainfall_summaries(observations, now):
    positive_rain = [
        row for row in observations
        if isinstance(row.get("rain_fall"), (int, float))
        and row["rain_fall"] > 0
    ]
    one_hour_ago = now - timedelta(hours=1)
    day_ago = now - timedelta(hours=24)
    five_days_ago = now - timedelta(days=5)

    last_hour = [
        row for row in positive_rain
        if (created := as_utc_datetime(row.get("CreationDate"))) is not None
        and created >= one_hour_ago
    ]
    last_24_hours = [
        row for row in positive_rain
        if (created := as_utc_datetime(row.get("CreationDate"))) is not None
        and created >= day_ago
    ]

    station_totals = defaultdict(float)
    for row in last_24_hours:
        station_totals[(row.get("basin"), row.get("gauge"))] += row["rain_fall"]

    daily_totals = defaultdict(float)
    for row in positive_rain:
        created = as_utc_datetime(row.get("CreationDate"))
        if created is not None and created >= five_days_ago:
            local_day = created.astimezone(SRI_LANKA_TIME).date().isoformat()
            daily_totals[(local_day, row.get("basin"), row.get("gauge"))] += row[
                "rain_fall"
            ]

    station_24h = [
        {
            "basin": basin,
            "station": station,
            "rain_fall_mm": round(total, 3),
        }
        for (basin, station), total in sorted(station_totals.items())
    ]
    station_24h.sort(key=lambda row: row["rain_fall_mm"], reverse=True)

    daily_by_station = [
        {
            "date_sri_lanka": day,
            "basin": basin,
            "station": station,
            "rain_fall_mm": round(total, 3),
        }
        for (day, basin, station), total in sorted(daily_totals.items())
    ]

    def recent_rows(rows):
        return [
            {
                **row,
                "CreationDate": timestamp_to_iso(row.get("CreationDate")),
                "EditDate": timestamp_to_iso(row.get("EditDate")),
            }
            for row in rows
        ]

    return {
        "dashboard_views": {
            "hourly_rainfall_last_24_hours": recent_rows(last_24_hours),
            "rainfall_by_station_last_24_hours": station_24h,
            "rainfall_observations_last_hour": recent_rows(last_hour),
            "daily_rainfall_by_station_last_5_days": daily_by_station,
            "latest_nonzero_rainfall_updates": recent_rows(positive_rain[:25]),
        }
    }


def fetch_rainfall(days=7, basin=None, station=None):
    where_parts = [
        f"CreationDate BETWEEN CURRENT_TIMESTAMP - {days} AND CURRENT_TIMESTAMP"
    ]
    if basin:
        where_parts.append(f"basin = {sql_string(basin)}")
    if station:
        where_parts.append(f"gauge = {sql_string(station)}")

    observations = fetch_features(
        OBSERVATIONS_URL,
        " AND ".join(where_parts),
        "*",
        order_by="CreationDate DESC",
    )
    stations = fetch_features(STATIONS_URL, "1=1", STATION_FIELDS, "station ASC")
    station_lookup = {
        (
            normalize_name(item.get("basin")),
            normalize_name(item.get("station")),
        ): item
        for item in stations
    }

    now = datetime.now(timezone.utc)
    summaries = build_rainfall_summaries(observations, now)
    for summary_rows in summaries["dashboard_views"].values():
        for summary in summary_rows:
            station_name = summary.get("gauge", summary.get("station"))
            station_info = station_lookup.get(
                (
                    normalize_name(summary.get("basin")),
                    normalize_name(station_name),
                )
            )
            summary["station"] = station_name
            summary["latitude"] = station_info.get("latitude") if station_info else None
            summary["longitude"] = (
                station_info.get("longitude") if station_info else None
            )
            if station_info:
                summary["alertpull"] = summary.get("alertpull", station_info.get("Alert_Level"))
                summary["minorpull"] = summary.get("minorpull", station_info.get("Minor_Flood_Level"))
                summary["majorpull"] = summary.get("majorpull", station_info.get("Major_Flood_Level"))

    unmatched = set()
    for row in observations:
        station_info = station_lookup.get(
            (
                normalize_name(row.get("basin")),
                normalize_name(row.get("gauge")),
            )
        )
        row["station"] = row.get("gauge")
        row["latitude"] = station_info.get("latitude") if station_info else None
        row["longitude"] = station_info.get("longitude") if station_info else None
        if station_info:
            row["alertpull"] = row.get("alertpull", station_info.get("Alert_Level"))
            row["minorpull"] = row.get("minorpull", station_info.get("Minor_Flood_Level"))
            row["majorpull"] = row.get("majorpull", station_info.get("Major_Flood_Level"))
        else:
            unmatched.add((row.get("basin"), row.get("gauge")))

        for field in ("CreationDate", "EditDate"):
            if field in row:
                row[field] = timestamp_to_iso(row[field])

    if unmatched:
        examples = ", ".join(
            f"{river_basin}: {station_name}"
            for river_basin, station_name in sorted(unmatched)[:5]
        )
        print(
            f"warning: coordinates were not found for {len(unmatched)} station(s); "
            f"examples: {examples}",
            file=sys.stderr,
        )

    return {
        "fetched_at_utc": now.isoformat(),
        "dashboard": DASHBOARD_URL,
        "observation_source": OBSERVATIONS_URL,
        "station_metadata_source": STATIONS_URL,
        "window_days": days,
        "basin_filter": basin,
        "station_filter": station,
        "observation_count": len(observations),
        "station_count": len(stations),
        "rainfall_unit": "mm",
        "stations": stations,
        "observations": observations,
        **summaries,
    }


def save_realtime_rainfall_to_database(data):
    """Save latest_nonzero_rainfall_updates to rainfall_realtime table."""
    fetched_at = datetime.fromisoformat(data["fetched_at_utc"])
    
    records = []
    updates = data.get("dashboard_views", {}).get("latest_nonzero_rainfall_updates", [])
    
    for row in updates:
        global_id = row.get("GlobalID", row.get("global_id", row.get("globalid")))
        if not global_id:
            continue

        creation_date = None
        if row.get("CreationDate"):
            try:
                creation_date = datetime.fromisoformat(row["CreationDate"])
            except (ValueError, TypeError):
                pass

        records.append({
            "global_id": str(global_id),
            "basin": row.get("basin"),
            "gauge": row.get("gauge"),
            "station": row.get("station"),
            "rain_fall": row.get("rain_fall"),
            "creation_date": creation_date,
            "latitude": row.get("latitude"),
            "longitude": row.get("longitude"),
            "alertpull": row.get("alertpull"),
            "minorpull": row.get("minorpull"),
            "majorpull": row.get("majorpull"),
            "fetched_at": fetched_at,
        })

    saved_count = 0
    with psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    ) as connection:
        with connection.cursor() as cursor:
            cursor.execute(SCHEMA_SQL)
            if records:
                cursor.executemany(UPSERT_SQL, records)
                saved_count = len(records)

    return saved_count


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Download rainfall observations, station metadata and dashboard "
            "summaries as JSON."
        )
    )
    parser.add_argument("--basin", help="Only include observations from this basin.")
    parser.add_argument(
        "--station", help="Only include observations from this gauge station."
    )
    parser.add_argument(
        "--days",
        type=int,
        default=7,
        help="Observation lookback in days (1-7; defaults to the source's full window).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_FILE,
        help=f"JSON output path (default: {DEFAULT_OUTPUT_FILE}).",
    )
    args = parser.parse_args()
    if not 1 <= args.days <= 7:
        parser.error("--days must be between 1 and 7")
    if args.station and not args.basin:
        parser.error("--station requires --basin")
    return args


def main():
    args = parse_args()
    try:
        data = fetch_rainfall(args.days, args.basin, args.station)
        saved_count = save_realtime_rainfall_to_database(data)
        args.output.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    except (ArcGISRequestError, OSError, ValueError, psycopg2.Error) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    print(
        f"Upserted {saved_count} record(s) into PostgreSQL 'rainfall_realtime'; "
        f"saved {data['observation_count']} observations and "
        f"{data['station_count']} station records to {args.output}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())