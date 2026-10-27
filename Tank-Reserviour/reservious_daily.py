import csv
import io
import json
import os
import re
import sys
import urllib.request
from datetime import date, datetime
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import psycopg2

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "yala-maha-api")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

OUTPUT_FILE = "reservoirs_data.json"  #For Debug :(

DASHBOARDS = {
    "medium": "9b114013dce14faca2c6bf8de3de6d3f",
    "major": "97be51156fa84712851286408eb09c45",
}

BASE_ITEM_URL = "https://www.arcgis.com/sharing/rest/content/items/{}/data?f=json"
SL_ITEM_URL = "https://slirrigation.maps.arcgis.com/sharing/rest/content/items/{}/data?f=json"

# ArcGIS CSV header -> table column
SOURCE_FIELDS = {
    "Reservoir": "name",
    "Range": "district",
    "Division": "division",
    "Latitude": "latitude",
    "Longitude": "longitude",
    "Extent_Ac": "farmland_acres",
    "FSD_ft": "full_depth_ft",
    "Gross Capacity_Acft": "gross_capacity_acft",
    "Dead Storage_Acft": "dead_storage_acft",
    "Active Storage_Acft": "active_capacity_acft",
    "Date": "reading_date",
    "Water Depth_ft": "water_depth_ft",
    "Gross Storage_Acft": "gross_storage_acft",
    "Effective Storage_Acft": "usable_storage_acft",
    "Effective Storage_per": "usable_storage_percent",
    "Rainfall_Preceding Day_mm": "rainfall_prev_day_mm",
    "Spilling": "is_spilling",
    "DS IMPACT": "ds_impact",
    "Spilling_Cusec": "spilling_rate_cusec",
}

RESERVOIR_COLUMNS = (
    "name",
    "district",
    "division",
    "latitude",
    "longitude",
    "farmland_acres",
    "full_depth_ft",
    "gross_capacity_acft",
    "dead_storage_acft",
    "active_capacity_acft",
    "type",
)

LEVEL_COLUMNS = (
    "reading_date",
    "water_depth_ft",
    "gross_storage_acft",
    "usable_storage_acft",
    "usable_storage_percent",
    "rainfall_prev_day_mm",
    "is_spilling",
    "ds_impact",
    "spilling_rate_cusec",
)

# Coordinates that are wrong in the ArcGIS source, by reservoir name -> (latitude, longitude).
# Mailagama comes with Karawila's coordinates (Sella Kataragama); these were checked by hand.
COORDINATE_FIXES = {
    "Mailagama": (6.425358, 81.269876),
}

TEXT_COLUMNS = {"name", "district", "division", "is_spilling", "ds_impact", "type"}
DATE_COLUMNS = {"reading_date"}

# Used to create new Tables if they do not exist in db!!!

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS reservoirs (
  id                   SERIAL PRIMARY KEY,
  name                 TEXT NOT NULL,
  district             TEXT,
  division             TEXT,
  latitude             NUMERIC(10,6),
  longitude            NUMERIC(10,6),
  farmland_acres       NUMERIC,
  full_depth_ft        NUMERIC,
  gross_capacity_acft  NUMERIC,
  dead_storage_acft    NUMERIC,
  active_capacity_acft NUMERIC,
  type                 TEXT,
  UNIQUE (name, latitude, longitude)
);

CREATE TABLE IF NOT EXISTS reservoir_levels (
  id                     SERIAL PRIMARY KEY,
  reservoir_id           INT NOT NULL REFERENCES reservoirs(id),
  reading_date           DATE NOT NULL,
  water_depth_ft         NUMERIC,
  gross_storage_acft     NUMERIC,
  usable_storage_acft    NUMERIC,
  usable_storage_percent NUMERIC,
  rainfall_prev_day_mm   NUMERIC,
  is_spilling            TEXT,
  ds_impact              TEXT,
  spilling_rate_cusec    NUMERIC,
  fetched_at             TIMESTAMP DEFAULT now(),
  UNIQUE (reservoir_id, reading_date)
);

CREATE INDEX IF NOT EXISTS idx_levels_lookup
  ON reservoir_levels (reservoir_id, reading_date DESC);
"""


def normalize_key(key):
    return re.sub(r"[^a-z0-9]", "", key.lower())


SOURCE_LOOKUP = {normalize_key(header): column for header, column in SOURCE_FIELDS.items()}


def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    )


def setup_database(conn):
    with conn.cursor() as cur:
        cur.execute(SCHEMA_SQL)
    conn.commit()


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8-sig"))
    if "error" in data:
        raise RuntimeError(f"ArcGIS API error: {data['error']}")
    return data


def iter_layers(layers):
    for layer in layers:
        yield layer
        yield from iter_layers(layer.get("layers", []))


def discover_csv_url(dashboard_id):
    dashboard = fetch_json(BASE_ITEM_URL.format(dashboard_id))
    widgets = dashboard.get("desktopView", {}).get("widgets", [])

    data_source = None
    for widget in widgets:
        if widget.get("type") != "listWidget":
            continue
        for dataset in widget.get("datasets", []):
            source = dataset.get("dataSource", {})
            fields = dataset.get("outFields", [])
            if (
                source.get("type") == "layerDataSource"
                and not dataset.get("filter")
                and ("*" in fields or any(f.lower() == "reservoir" for f in fields))
            ):
                data_source = source
                break
        if data_source:
            break

    if not data_source:
        raise ValueError(f"Could not find reservoir layer in dashboard {dashboard_id}")

    web_map = fetch_json(SL_ITEM_URL.format(data_source["itemId"]))
    layer = next(
        (
            l for l in iter_layers(web_map.get("operationalLayers", []))
            if l.get("id") == data_source["layerId"]
        ),
        None,
    )
    if not layer or not layer.get("url"):
        raise ValueError(f"Could not resolve CSV layer URL for dashboard {dashboard_id}")

    parts = urlsplit(layer["url"])
    query = dict(parse_qsl(parts.query))
    query.update(layer.get("customParameters", {}))
    query.setdefault("output", "csv")
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def get_csv_rows(csv_url):
    req = urllib.request.Request(csv_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        content = resp.read().decode("utf-8-sig")

    rows = list(csv.reader(io.StringIO(content)))
    header_idx = next(
        (i for i, row in enumerate(rows) if any(cell.strip().lower() == "reservoir" for cell in row)),
        None,
    )
    if header_idx is None:
        raise ValueError("Reservoir header column not found in CSV response")

    headers = [h.strip() for h in rows[header_idx]]
    return [
        dict(zip(headers, r))
        for r in rows[header_idx + 1:]
        if any(cell.strip() for cell in r)
    ]


def parse_number(raw):
    if raw is None:
        return None
    text = str(raw).strip().replace(",", "")
    if text.lower() in ("", "-", "null", "none", "n/a"):
        return None
    try:
        num = float(text)
    except ValueError:
        return None
    return int(num) if num.is_integer() else num


def parse_text(raw):
    if raw is None:
        return None
    text = str(raw).strip()
    if text.lower() in ("", "-", "null", "none", "n/a"):
        return None
    return text


def parse_date(raw):
    text = parse_text(raw)
    if not text:
        return None
    date_part = text.split()[0].split("T")[0]
    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(date_part, fmt).date().isoformat()
        except ValueError:
            pass
    return None


def convert(column, raw):
    if column in DATE_COLUMNS:
        return parse_date(raw)
    if column in TEXT_COLUMNS:
        return parse_text(raw)
    return parse_number(raw)


def build_record(row, res_type):
    record = dict.fromkeys(RESERVOIR_COLUMNS + LEVEL_COLUMNS)

    for header, raw in row.items():
        column = SOURCE_LOOKUP.get(normalize_key(header))
        if column:
            record[column] = convert(column, raw)

    if not record["name"]:
        return None

    record["type"] = res_type

    for column in ("latitude", "longitude"):
        if record[column] is not None:
            record[column] = round(record[column], 6)

    # Applied before saving, so the reservoir is found by its corrected coordinates
    if record["name"] in COORDINATE_FIXES:
        record["latitude"], record["longitude"] = COORDINATE_FIXES[record["name"]]

    if (
        record["active_capacity_acft"] is None
        and record["gross_capacity_acft"] is not None
        and record["dead_storage_acft"] is not None
    ):
        record["active_capacity_acft"] = record["gross_capacity_acft"] - record["dead_storage_acft"]

    return record


def values_differ(val1, val2):
    if val1 is None and val2 is None:
        return False
    if val1 is None or val2 is None:
        return True
    try:
        return float(val1) != float(val2)
    except (ValueError, TypeError):
        return str(val1).strip() != str(val2).strip()


def save_reservoir(cur, record):
    find_sql = """
        SELECT id, district, division, farmland_acres, full_depth_ft,
               gross_capacity_acft, dead_storage_acft, active_capacity_acft, type
        FROM reservoirs
        WHERE name = %s
          AND latitude IS NOT DISTINCT FROM %s
          AND longitude IS NOT DISTINCT FROM %s
    """
    cur.execute(find_sql, [record["name"], record["latitude"], record["longitude"]])
    existing = cur.fetchone()

    if existing:
        res_id = existing[0]
        existing_fields = {
            "district": existing[1],
            "division": existing[2],
            "farmland_acres": existing[3],
            "full_depth_ft": existing[4],
            "gross_capacity_acft": existing[5],
            "dead_storage_acft": existing[6],
            "active_capacity_acft": existing[7],
            "type": existing[8],
        }

        changed_fields = {}
        for field, current_val in existing_fields.items():
            new_val = record[field]
            if values_differ(current_val, new_val):
                changed_fields[field] = new_val

        if changed_fields:
            set_clause = ", ".join([f"{col} = %s" for col in changed_fields.keys()])
            update_sql = f"UPDATE reservoirs SET {set_clause} WHERE id = %s"
            params = list(changed_fields.values()) + [res_id]
            cur.execute(update_sql, params)

        return res_id

    cols = ", ".join(RESERVOIR_COLUMNS)
    placeholders = ", ".join(["%s"] * len(RESERVOIR_COLUMNS))
    insert_sql = f"INSERT INTO reservoirs ({cols}) VALUES ({placeholders}) RETURNING id"
    values = [record[c] for c in RESERVOIR_COLUMNS]
    cur.execute(insert_sql, values)
    return cur.fetchone()[0]


def save_level(cur, reservoir_id, record):
    reading_date = record["reading_date"] or date.today().isoformat()
    level_columns = ("reservoir_id",) + LEVEL_COLUMNS
    insert_level_sql = f"""
        INSERT INTO reservoir_levels ({", ".join(level_columns)})
        VALUES ({", ".join(["%s"] * len(level_columns))})
        ON CONFLICT (reservoir_id, reading_date) DO NOTHING
    """
    values = [reservoir_id] + [reading_date if c == "reading_date" else record[c] for c in LEVEL_COLUMNS]
    cur.execute(insert_level_sql, values)


def main():
    search_query = sys.argv[1].strip().lower() if len(sys.argv) > 1 else None
    all_records = []

    conn = None
    try:
        conn = get_db_connection()
        setup_database(conn)
    except Exception as err:
        print(f"Database setup error: {err}", file=sys.stderr)
        if conn:
            conn.close()
        conn = None

    for res_type, dashboard_id in DASHBOARDS.items():
        print(f"Fetching {res_type} reservoirs...")
        try:
            csv_url = discover_csv_url(dashboard_id)
            records = [r for r in (build_record(row, res_type) for row in get_csv_rows(csv_url)) if r]
        except Exception as err:
            print(f"Error fetching {res_type} reservoirs: {err}", file=sys.stderr)
            continue

        if conn:
            try:
                with conn.cursor() as cur:
                    for record in records:
                        reservoir_id = save_reservoir(cur, record)
                        save_level(cur, reservoir_id, record)
                conn.commit()
            except Exception as err:
                conn.rollback()
                print(f"Database error for {res_type} reservoirs: {err}", file=sys.stderr)

        all_records.extend(records)

    if conn:
        conn.close()
        print("Database sync completed.")

    if search_query:
        records_to_save = [r for r in all_records if r["name"].lower() == search_query]
        if not records_to_save:
            print(f"No reservoir found matching '{sys.argv[1]}'.")
    else:
        records_to_save = all_records

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(records_to_save, f, indent=2, ensure_ascii=False)

    print(f"Saved {len(records_to_save)} records to {os.path.abspath(OUTPUT_FILE)}")


if __name__ == "__main__":
    main()