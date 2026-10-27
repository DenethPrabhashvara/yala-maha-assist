#!/usr/bin/env python3
"""Fetch recent river-gauge observations from the Irrigation Department ArcGIS service."""

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


OBSERVATIONS_URL = (
    "https://services3.arcgis.com/J7ZFXmR8rSmQ3FGf/arcgis/rest/services/"
    "gauges_2_view/FeatureServer/0/query"
)
STATIONS_URL = (
    "https://services3.arcgis.com/J7ZFXmR8rSmQ3FGf/arcgis/rest/services/"
    "hydrostations/FeatureServer/0/query"
)
DEFAULT_OUTPUT_FILE = Path(__file__).with_name("realtime_river_levels.json")
STATION_FIELDS = "station,basin,latitude,longitude"
PAGE_SIZE = 1000
TIMEOUT_SECONDS = 30
TABLE_NAME = "river_level_realtime"

# ArcGIS attribute name -> PostgreSQL column name.
# objectid, Creator, Editor, and EditDate are intentionally omitted.
FIELD_MAP = {
    "globalid": "global_id",
    "global_id": "global_id",
    "basin": "basin",
    "gauge": "gauge",
    "station": "station",
    "water_level": "water_level",
    "rain_fall": "rain_fall",
    "CreationDate": "creation_date",
    "creation_date": "creation_date",
    "latitude": "latitude",
    "longitude": "longitude",
    "alertpull": "alertpull",
    "minorpull": "minorpull",
    "majorpull": "majorpull",
}
OBSERVATION_COLUMNS = (
    "global_id",
    "basin",
    "gauge",
    "station",
    "water_level",
    "rain_fall",
    "creation_date",
    "latitude",
    "longitude",
    "alertpull",
    "minorpull",
    "majorpull",
)
DB_CONFIG = {
    "host": os.environ.get("PGHOST", "localhost"),
    "port": int(os.environ.get("PGPORT", "5432")),
    "dbname": os.environ.get("PGDATABASE", "yala-maha-api"),
    "user": os.environ.get("PGUSER", "postgres"),
    "password": os.environ.get("PGPASSWORD", "postgres"),
}


class ArcGISRequestError(Exception):
    """Raised when ArcGIS returns a transport or service error."""


def query_arcgis(url, params):
    query = urllib.parse.urlencode({"f": "json", **params})
    request = urllib.request.Request(
        f"{url}?{query}",
        headers={"User-Agent": "Yala-Maha-Assist river gauge data fetcher"},
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            result = json.load(response)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        raise ArcGISRequestError(f"Could not fetch data from ArcGIS: {error}") from error

    if "error" in result:
        details = result["error"]
        message = details.get("message", "ArcGIS request failed")
        code = details.get("code")
        raise ArcGISRequestError(f"ArcGIS error {code}: {message}")
    return result


def sql_string(value):
    """Quote a user-supplied string as an ArcGIS SQL string literal."""
    return "'" + value.replace("'", "''") + "'"


def arcgis_timestamp_to_postgres(value):
    """Convert an ArcGIS Unix timestamp in milliseconds to a UTC timestamp string."""
    if value is None:
        return None
    return datetime.fromtimestamp(value / 1000, tz=timezone.utc).isoformat(
        timespec="milliseconds"
    )


def normalize_station_key(value):
    return " ".join((value or "").split()).casefold()


def empty_to_none(value):
    if value == "":
        return None
    return value


def sanitize_observation(row):
    clean = {}
    for source_key, column in FIELD_MAP.items():
        if source_key in row and column not in clean:
            clean[column] = empty_to_none(row.get(source_key))
    return {column: clean.get(column) for column in OBSERVATION_COLUMNS}


def fetch_features(url, where, out_fields, order_by=None, distinct=False):
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
        if distinct:
            params["returnDistinctValues"] = "true"

        result = query_arcgis(url, params)
        page = result.get("features", [])
        features.extend(feature.get("attributes", {}) for feature in page)
        offset += len(page)

        if not page or (
            len(page) < PAGE_SIZE and not result.get("exceededTransferLimit", False)
        ):
            break

    return features


def list_selector_values(kind, basin=None):
    if kind == "basins":
        field = "basin"
        where = "1=1"
    else:
        field = "station"
        where = f"basin = {sql_string(basin)}" if basin else "1=1"

    rows = fetch_features(
        STATIONS_URL,
        where,
        field,
        order_by=f"{field} ASC",
        distinct=True,
    )
    return sorted({row[field] for row in rows if row.get(field)})


def fetch_observations(days, basin=None, station=None):
    where_parts = [
        f"CreationDate BETWEEN CURRENT_TIMESTAMP - {days} AND CURRENT_TIMESTAMP"
    ]
    if basin:
        where_parts.append(f"basin = {sql_string(basin)}")
    if station:
        where_parts.append(f"gauge = {sql_string(station)}")

    rows = fetch_features(
        OBSERVATIONS_URL,
        " AND ".join(where_parts),
        "*",
        order_by="CreationDate DESC",
    )

    station_where_parts = ["1=1"]
    if basin:
        station_where_parts.append(f"basin = {sql_string(basin)}")
    if station:
        station_where_parts.append(f"station = {sql_string(station)}")
    station_rows = fetch_features(
        STATIONS_URL,
        " AND ".join(station_where_parts),
        STATION_FIELDS,
    )
    station_lookup = {
        (
            normalize_station_key(item.get("basin")),
            normalize_station_key(item.get("station")),
        ): item
        for item in station_rows
    }

    unmatched_stations = set()
    for row in rows:
        station_info = station_lookup.get(
            (
                normalize_station_key(row.get("basin")),
                normalize_station_key(row.get("gauge")),
            )
        )
        row["station"] = row.get("gauge")
        row["latitude"] = station_info.get("latitude") if station_info else None
        row["longitude"] = station_info.get("longitude") if station_info else None
        if not station_info:
            unmatched_stations.add((row.get("basin"), row.get("gauge")))

        for field in ("CreationDate", "EditDate"):
            if field in row:
                row[field] = arcgis_timestamp_to_postgres(row[field])

    if unmatched_stations:
        examples = ", ".join(
            f"{basin}: {station}"
            for basin, station in sorted(unmatched_stations)[:5]
        )
        print(
            f"warning: coordinates were not found for {len(unmatched_stations)} "
            f"station(s); examples: {examples}",
            file=sys.stderr,
        )

    observations = [sanitize_observation(row) for row in rows]
    return {
        "fetched_at_utc": datetime.now(timezone.utc).isoformat(),
        "source": OBSERVATIONS_URL,
        "station_metadata_source": STATIONS_URL,
        "window_days": days,
        "basin": basin,
        "station": station,
        "count": len(observations),
        "observations": observations,
    }


def sync_to_postgres(observations, db_config):
    try:
        import psycopg2
        from psycopg2.extras import execute_batch
    except ImportError as error:
        raise RuntimeError("psycopg2 is required to write river_level_realtime") from error

    if not observations:
        print("No observations to sync", file=sys.stderr)
        return 0

    rows = [row for row in observations if row.get("global_id")]
    skipped = len(observations) - len(rows)
    if skipped:
        print(
            f"warning: {skipped} observation(s) are missing global_id and will be skipped",
            file=sys.stderr,
        )
    if not rows:
        print("No observations with global_id to sync", file=sys.stderr)
        return 0

    create_table_query = f"""
    CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
        global_id TEXT PRIMARY KEY,
        basin TEXT,
        gauge TEXT,
        station TEXT,
        water_level DOUBLE PRECISION,
        rain_fall DOUBLE PRECISION,
        creation_date TIMESTAMPTZ,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        alertpull DOUBLE PRECISION,
        minorpull DOUBLE PRECISION,
        majorpull DOUBLE PRECISION,
        fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """
    column_sql = ", ".join(OBSERVATION_COLUMNS)
    placeholders = ", ".join(["%s"] * len(OBSERVATION_COLUMNS))
    update_sql = ", ".join(
        f"{column} = EXCLUDED.{column}"
        for column in OBSERVATION_COLUMNS
        if column != "global_id"
    )
    upsert_query = f"""
        INSERT INTO {TABLE_NAME} ({column_sql})
        VALUES ({placeholders})
        ON CONFLICT (global_id) DO UPDATE SET
            {update_sql},
            fetched_at = now()
    """
    values = [tuple(row.get(column) for column in OBSERVATION_COLUMNS) for row in rows]

    conn = psycopg2.connect(**db_config)
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(create_table_query)
                execute_batch(cur, upsert_query, values)
        print(f"Synced {len(rows)} observations to {TABLE_NAME}", file=sys.stderr)
        return len(rows)
    finally:
        conn.close()


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Fetch recent river water-level observations from the public "
            "Irrigation Department ArcGIS service."
        )
    )
    parser.add_argument(
        "--basin",
        help="Limit readings to a river basin (for example: Kelani Ganga).",
    )
    parser.add_argument(
        "--station",
        help="Limit readings to a hydrometric station (for example: Holombuwa).",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=7,
        help="Lookback window in days (1-7; defaults to the source's full seven days).",
    )
    parser.add_argument(
        "--list-basins",
        action="store_true",
        help="Print available river basins and exit.",
    )
    parser.add_argument(
        "--list-stations",
        action="store_true",
        help="Print available stations; use --basin to filter by basin.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_FILE,
        help=f"Write JSON to this file (default: {DEFAULT_OUTPUT_FILE}).",
    )
    parser.add_argument(
        "--skip-db",
        action="store_true",
        help="Write JSON only; do not sync to PostgreSQL.",
    )
    args = parser.parse_args()

    if args.list_basins and args.list_stations:
        parser.error("--list-basins and --list-stations cannot be used together")
    if args.days < 1 or args.days > 7:
        parser.error("--days must be between 1 and 7 (the source view retains 7 days)")
    if args.station and not args.list_stations and not args.basin:
        parser.error("--station requires --basin")
    return args


def main():
    args = parse_args()
    try:
        if args.list_basins:
            result = list_selector_values("basins")
            sys.stdout.write(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
        elif args.list_stations:
            result = list_selector_values("stations", args.basin)
            sys.stdout.write(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
        else:
            result = fetch_observations(args.days, args.basin, args.station)
            args.output.write_text(
                json.dumps(result, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            print(
                f"Saved {result['count']} observations to {args.output}",
                file=sys.stderr,
            )
            if not args.skip_db:
                sync_to_postgres(result["observations"], DB_CONFIG)
    except (ArcGISRequestError, OSError, RuntimeError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())