#!/usr/bin/env python3
"""Fetch recent river-gauge observations from the Irrigation Department ArcGIS service."""

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone


OBSERVATIONS_URL = (
    "https://services3.arcgis.com/J7ZFXmR8rSmQ3FGf/arcgis/rest/services/"
    "gauges_2_view/FeatureServer/0/query"
)
STATIONS_URL = (
    "https://services3.arcgis.com/J7ZFXmR8rSmQ3FGf/arcgis/rest/services/"
    "hydrostations/FeatureServer/0/query"
)
OBSERVATION_FIELDS = (
    "objectid,globalid,basin,gauge,water_level,rain_fall,CreationDate,"
    "alertpull,minorpull,majorpull"
)
PAGE_SIZE = 1000
TIMEOUT_SECONDS = 30


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
        OBSERVATION_FIELDS,
        order_by="CreationDate DESC",
    )

    for row in rows:
        timestamp = row.get("CreationDate")
        if timestamp is not None:
            row["CreationDate_UTC"] = datetime.fromtimestamp(
                timestamp / 1000, tz=timezone.utc
            ).isoformat()

    return {
        "fetched_at_utc": datetime.now(timezone.utc).isoformat(),
        "source": OBSERVATIONS_URL,
        "window_days": days,
        "basin": basin,
        "station": station,
        "count": len(rows),
        "observations": rows,
    }


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
        default=3,
        help="Lookback window in days (1-7; dashboard chart defaults to 3).",
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
        help="Write JSON to this file instead of stdout.",
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
        elif args.list_stations:
            result = list_selector_values("stations", args.basin)
        else:
            result = fetch_observations(args.days, args.basin, args.station)
        output = json.dumps(result, ensure_ascii=False, indent=2) + "\n"

        if args.output:
            with open(args.output, "w", encoding="utf-8") as output_file:
                output_file.write(output)
        else:
            sys.stdout.write(output)
    except (ArcGISRequestError, OSError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
