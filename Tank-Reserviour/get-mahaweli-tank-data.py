import io
import urllib.request
import json
import os
import re
import sys
from datetime import date, datetime

import pdfplumber
import psycopg2

          # Database configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "yala-maha-api")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

MONTH_MAP = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
}

#SCHEMA is BELOW , if table not present automatically created

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS mahawelitanks (
  id                 INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tank_name          TEXT NOT NULL UNIQUE,
  tot_capacity_mcm   NUMERIC(10,3) NOT NULL CHECK (tot_capacity_mcm > 0),
  covered_land_acres NUMERIC(12,2) CHECK (covered_land_acres >= 0),
  latitude           NUMERIC(10,6) CHECK (latitude  BETWEEN -90  AND 90),
  longitude          NUMERIC(10,6) CHECK (longitude BETWEEN -180 AND 180),
  createdat          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- For tables created before the coordinates were added.
-- Coordinates are filled in by hand: the PDF has none, so this script never writes them.
ALTER TABLE mahawelitanks ADD COLUMN IF NOT EXISTS latitude  NUMERIC(10,6) CHECK (latitude  BETWEEN -90  AND 90);
ALTER TABLE mahawelitanks ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,6) CHECK (longitude BETWEEN -180 AND 180);

CREATE TABLE IF NOT EXISTS mahaweli_water_level (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tank_id            INTEGER NOT NULL REFERENCES mahawelitanks(id) ON DELETE CASCADE,
  reading_date       DATE NOT NULL,
  water_level_msl    NUMERIC(7,2),
  storage_mcm        NUMERIC(10,3) CHECK (storage_mcm >= 0),
  storage_percentage NUMERIC(5,2) CHECK (storage_percentage >= 0),
  rainfall_24h_mm    NUMERIC(6,1) CHECK (rainfall_24h_mm >= 0),
  recorded_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tank_day UNIQUE (tank_id, reading_date)
);

CREATE INDEX IF NOT EXISTS idx_water_level_date ON mahaweli_water_level (reading_date DESC);
"""


def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )


def setup_database(conn):
    with conn.cursor() as cur:
        cur.execute(SCHEMA_SQL)  
    conn.commit()


def clean_text_precision(val):  #clean inpt text
    if val is None:
        return ""
    text = str(val).strip()
    if not text:
        return ""

    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"(\d+)\s*-\s*([A-Za-z]+)", r"\1-\2", text)  
    #Some UGLY REGEX HERE :(
    text = re.sub(r"(?<=\d)\s+(?=[\d,\.%])", "", text)         
     #Note to self: don't touch this!
    text = re.sub(r"(?<=[\d,\.%])\s+(?=\d)", "", text)

    if re.match(r"^[\d\s,\.\-%/]+$", text):
        text = text.replace(" ", "")

    return text.strip()


def parse_number(val):
    cleaned = clean_text_precision(val)
    if not cleaned or cleaned in ["-", "", "null"]:
        return None
    #remove % signs in values and "," with "" to sanitize numbers
    cleaned_num = cleaned.replace(",", "").replace("%", "")  
    try:
        val_float = float(cleaned_num)
        return int(val_float) if val_float.is_integer() else val_float
    except ValueError:
        return None


def extract_header_date(pdf):
    for page in pdf.pages:
        text = page.extract_text() or ""
        match = re.search(r"LATEST STATUS OF RESERVOIRS\s+(\d{4})[/-](\d{1,2})[/-](\d{1,2})", text, re.IGNORECASE)  #some regex to get the date the pdf was last updated
        if match:
            return int(match.group(1)), int(match.group(2)), int(match.group(3))
        match_any = re.search(r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})", text)
        if match_any:
            return int(match_any.group(1)), int(match_any.group(2)), int(match_any.group(3))

    today = date.today() 
    return today.year, today.month, today.day


def format_to_standard_date(raw_date_str, base_year, base_month, base_day):
    cleaned = clean_text_precision(raw_date_str)
    if not cleaned or cleaned in ["-", ""]:
        return f"{base_year:04d}-{base_month:02d}-{base_day:02d}"

    match_short = re.search(r"^(\d{1,2})[-/\s]*([A-Za-z]{3,9})$", cleaned)
    if match_short:
        day = int(match_short.group(1))
        mon_name = match_short.group(2).lower()[:3]
        month = MONTH_MAP.get(mon_name, base_month)  #map month with month number

        year = base_year
        if base_month == 1 and month == 12:
            year = base_year - 1

        return f"{year:04d}-{month:02d}-{day:02d}"

    match_full = re.search(r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})", cleaned)
    if match_full:
        return f"{int(match_full.group(1)):04d}-{int(match_full.group(2)):02d}-{int(match_full.group(3)):02d}"

    return f"{base_year:04d}-{base_month:02d}-{base_day:02d}"


def get_underlined_words(page):   #used for extracting only Irrigation System from pdf
    words = page.extract_words()
    lines = []

    for line in page.lines:
        if abs(line["top"] - line["bottom"]) <= 3.0:
            lines.append(line)
    for rect in page.rects:
        if rect["height"] <= 3.0:
            lines.append(rect)

    underlined_text = set()
    for word in words:
        w_x0, w_x1, w_bottom = word["x0"], word["x1"], word["bottom"]
        w_width = w_x1 - w_x0

        for line in lines:
            l_x0, l_x1, l_top = line["x0"], line["x1"], line["top"]
            l_width = l_x1 - l_x0

            if -1.0 <= (l_top - w_bottom) <= 6.0:
                if (l_x0 <= w_x0 + 8) and (l_x1 >= w_x1 - 8):
                    if l_width <= w_width + 30:
                        underlined_text.add(word["text"].strip().lower())
                        break

    return underlined_text


def is_topic_header(row, underlined_words):
    if len(row) < 2:
        return False, ""

    col0 = clean_text_precision(row[0])
    col1 = clean_text_precision(row[1])

    if not col1:
        return False, ""

    cell_words = [w.strip().lower() for w in col1.split() if w.strip()]
    is_underlined = any(w in underlined_words for w in cell_words)
    non_empty_data = sum(1 for c in row[2:] if clean_text_precision(c) not in ["", "-", None])

    if (is_underlined or col0 == "") and non_empty_data == 0:
        return True, col1

    return False, ""


def is_summary_row(row_cells):
    row_text = " ".join([clean_text_precision(c).lower() for c in row_cells if c])   #Removes summery rows
    summary_keywords = ["sub total", "subtotal", "gross total", "total", "grand total"]
    return any(k in row_text for k in summary_keywords)


def map_row_to_custom_json(row, base_year, base_month, base_day):
    while len(row) < 14:
        row.append("")

    return {
        "tank_name": clean_text_precision(row[1]),
        "gross_capacity_mcm": parse_number(row[2]),
        "date": format_to_standard_date(row[4], base_year, base_month, base_day),
        "water_level_msl": parse_number(row[5]),
        "storage_mcm": parse_number(row[6]),
        "storage_percentage": parse_number(row[8]),
        "covered_land_acres": parse_number(row[10]),
        "rainfall_last_24h": parse_number(row[11]),
        "spilling_downstream_discharge_m3_s": parse_number(row[12])
    }


def save_tank_record(cur, record):
    tank_name = record["tank_name"]
    tot_capacity = record.get("gross_capacity_mcm")
    covered_acres = record.get("covered_land_acres")
    if not tot_capacity or tot_capacity <= 0:
        tot_capacity = None

    # Inserts a new tank or updates every field the PDF has. latitude/longitude are not in
    # this statement, so coordinates set by hand are never overwritten.
    # A missing value keeps what is stored; a brand new tank without capacity gets 0.001.
    upsert_sql = """
        INSERT INTO mahawelitanks (tank_name, tot_capacity_mcm, covered_land_acres)
        VALUES (%s, COALESCE(%s, 0.001), %s)
        ON CONFLICT (tank_name) DO UPDATE SET
            tot_capacity_mcm   = COALESCE(%s, mahawelitanks.tot_capacity_mcm),
            covered_land_acres = COALESCE(EXCLUDED.covered_land_acres, mahawelitanks.covered_land_acres)
        RETURNING id
    """
    cur.execute(upsert_sql, [tank_name, tot_capacity, covered_acres, tot_capacity])
    return cur.fetchone()[0]


def save_water_level(cur, tank_id, record):
    reading_date = record.get("date")
    water_level_msl = record.get("water_level_msl")
    storage_mcm = record.get("storage_mcm")
    storage_percentage = record.get("storage_percentage")
    rainfall_24h_mm = record.get("rainfall_last_24h")

    if storage_mcm is not None and storage_mcm < 0:
        storage_mcm = 0
    if storage_percentage is not None and storage_percentage < 0:
        storage_percentage = 0
    if rainfall_24h_mm is not None and rainfall_24h_mm < 0:
        rainfall_24h_mm = 0

    insert_sql = """
        INSERT INTO mahaweli_water_level (
            tank_id, reading_date, water_level_msl, storage_mcm,
            storage_percentage, rainfall_24h_mm
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (tank_id, reading_date) DO UPDATE SET
            water_level_msl    = EXCLUDED.water_level_msl,
            storage_mcm        = EXCLUDED.storage_mcm,
            storage_percentage = EXCLUDED.storage_percentage,
            rainfall_24h_mm    = EXCLUDED.rainfall_24h_mm,
            recorded_at        = NOW()
    """
    cur.execute(insert_sql, [
        tank_id, reading_date, water_level_msl, storage_mcm,
        storage_percentage, rainfall_24h_mm
    ])


def sync_records_to_db(records):
    conn = None
    saved_count = 0
    try:
        conn = get_db_connection()
        setup_database(conn)

        with conn.cursor() as cur:
            for record in records:
                if not record.get("tank_name"):
                    continue
                tank_id = save_tank_record(cur, record)
                save_water_level(cur, tank_id, record)
                saved_count += 1

        conn.commit()
        print(f"Successfully synchronized {saved_count} records to database.")
    except Exception as err:
        if conn:
            conn.rollback()
        print(f"Database sync error: {err}", file=sys.stderr)
    finally:
        if conn:
            conn.close()


def extract_irrigation_reservoirs(pdf_input):
    print(f"Extracting Irrigation System data from: {pdf_input}")

    if pdf_input.startswith(("http://", "https://")):
        req = urllib.request.Request(pdf_input, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            pdf_source = io.BytesIO(resp.read())
        base_name = "downloaded_report"
    else:
        if not os.path.exists(pdf_input):
            print(f"Error: File '{pdf_input}' not found.", file=sys.stderr)
            return
        pdf_source = pdf_input
        base_name = os.path.splitext(os.path.basename(pdf_input))[0]

    extracted_records = []
    current_topic = "General"

    with pdfplumber.open(pdf_source) as pdf:
        base_year, base_month, base_day = extract_header_date(pdf)

        for page in pdf.pages:
            underlined_words = get_underlined_words(page)

            tables = page.extract_tables({
                "vertical_strategy": "lines",
                "horizontal_strategy": "lines",
                "snap_tolerance": 3,
                "join_tolerance": 3,
            })

            if not tables:
                tables = page.extract_tables({
                    "vertical_strategy": "text",
                    "horizontal_strategy": "text",
                })

            for table in tables:
                for row in table:
                    if not row or all(c is None or str(c).strip() == "" for c in row):
                        continue

                    cleaned_row = [clean_text_precision(c) for c in row]
                    row_text = " ".join(cleaned_row).lower()

                    if "gross capacity" in row_text or "water level" in row_text or "latest status" in row_text:
                        continue
                    if cleaned_row[0].lower() == "no" or cleaned_row[1].lower() == "tank/ reservoir":
                        continue
                    if is_summary_row(cleaned_row):
                        continue

                    is_topic, topic_name = is_topic_header(cleaned_row, underlined_words)
                    if is_topic:
                        current_topic = topic_name
                        continue

                    if "irrigation" in current_topic.lower():
                        item = map_row_to_custom_json(cleaned_row, base_year, base_month, base_day)

                        if item["storage_mcm"] is not None:
                            extracted_records.append(item)

    output_dir = "extracted_output"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{base_name}_Irrigation_System.json")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(extracted_records, f, indent=2, ensure_ascii=False)

    print(f"Saved {len(extracted_records)} valid records to JSON: {os.path.abspath(output_path)}")

    sync_records_to_db(extracted_records)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        extract_irrigation_reservoirs(sys.argv[1])
    else:
        pdf_file = 'https://mahaweli.gov.lk/WMS%20DATA/Menue-WMS%20-%20E.pdf' or input("Enter path to PDF file: ").strip().strip('"').strip("'")
        if pdf_file:
            extract_irrigation_reservoirs(pdf_file)
        else:
            print("No PDF path provided.", file=sys.stderr)