"""
Irrigation System Reservoir PDF to JSON Extractor
Extracts only 'Irrigation System'

"""
import pdfplumber
import json
import re
import os
import sys

MONTH_MAP = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
}

DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "yala-maha-api"
DB_USER = "postgres"
DB_PASSWORD = "postgres"

UPSERT_TANK_SQL = """
    INSERT INTO mahawelitanks (
        tank_name,
        tot_capacity_mcm,
        water_level_msl,
        storage_mcm,
        storage_percentage,
        covered_land_acres,
        rainfall_last_24h_mm,
        last_update
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (tank_name) DO UPDATE SET
        tot_capacity_mcm = EXCLUDED.tot_capacity_mcm,
        water_level_msl = EXCLUDED.water_level_msl,
        storage_mcm = EXCLUDED.storage_mcm,
        storage_percentage = EXCLUDED.storage_percentage,
        covered_land_acres = EXCLUDED.covered_land_acres,
        rainfall_last_24h_mm = EXCLUDED.rainfall_last_24h_mm,
        last_update = EXCLUDED.last_update
"""


def clean_text_precision(val):
    """Fixes space and kerning issues in text and numbers."""
    if val is None:
        return ""
    text = str(val).strip()
    if not text:
        return ""

    text = re.sub(r'\s+', ' ', text)
    # Fix dates (e.g. "2 - Oct" -> "2-Oct")
    text = re.sub(r'(\d+)\s*-\s*([A-Za-z]+)', r'\1-\2', text)
    # Fix spaces in numbers (e.g. "26, 024" -> "26,024")
    text = re.sub(r'(?<=\d)\s+(?=[\d,\.%])', '', text)
    text = re.sub(r'(?<=[\d,\.%])\s+(?=\d)', '', text)

    if re.match(r'^[\d\s,\.\-%/]+$', text):
        text = text.replace(' ', '')

    return text.strip()


def parse_number(val):
    #Converts strings to float/int, or None (null in JSON).
    cleaned = clean_text_precision(val)
    if not cleaned or cleaned in ["-", "", ""]:
        return None

    cleaned_num = cleaned.replace(",", "").replace("%", "")
    try:
        val_float = float(cleaned_num)
        if val_float.is_integer():
            return int(val_float)
        return val_float
    except ValueError:
        return None


def extract_header_date(pdf):
    """Extracts report date from title banner (e.g. '2026/10/05')."""
    for page in pdf.pages:
        text = page.extract_text() or ""
        match = re.search(r'LATEST STATUS OF RESERVOIRS\s+(\d{4})[/-](\d{1,2})[/-](\d{1,2})', text, re.IGNORECASE)
        if match:
            return int(match.group(1)), int(match.group(2)), int(match.group(3))
        match_any = re.search(r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})', text)
        if match_any:
            return int(match_any.group(1)), int(match_any.group(2)), int(match_any.group(3))

    return 2026, 10, 5


def format_to_standard_date(raw_date_str, base_year, base_month):
    """Converts '2-Oct' to '2026-10-02'."""
    cleaned = clean_text_precision(raw_date_str)
    if not cleaned or cleaned in ["-", "", ""]:
        return None

    match_short = re.search(r'^(\d{1,2})[-/\s]*([A-Za-z]{3,9})$', cleaned)
    if match_short:
        day = int(match_short.group(1))
        mon_name = match_short.group(2).lower()[:3]
        month = MONTH_MAP.get(mon_name, base_month)

        year = base_year
        if base_month == 1 and month == 12:
            year = base_year - 1

        return f"{year:04d}-{month:02d}-{day:02d}"

    match_full = re.search(r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})', cleaned)
    if match_full:
        return f"{int(match_full.group(1)):04d}-{int(match_full.group(2)):02d}-{int(match_full.group(3)):02d}"

    return None


def get_underlined_words(page):
    """Detects text with vector underline graphics."""
    words = page.extract_words()
    lines = []

    for line in page.lines:
        if abs(line['top'] - line['bottom']) <= 3.0:
            lines.append(line)
    for rect in page.rects:
        if rect['height'] <= 3.0:
            lines.append(rect)

    underlined_text = set()
    for word in words:
        w_x0, w_x1, w_bottom = word['x0'], word['x1'], word['bottom']
        w_width = w_x1 - w_x0

        for line in lines:
            l_x0, l_x1, l_top = line['x0'], line['x1'], line['top']
            l_width = l_x1 - l_x0

            if -1.0 <= (l_top - w_bottom) <= 6.0:
                if (l_x0 <= w_x0 + 8) and (l_x1 >= w_x1 - 8):
                    if l_width <= w_width + 30:
                        underlined_text.add(word['text'].strip().lower())
                        break

    return underlined_text


def is_topic_header(row, underlined_words):
    """Checks if row is an underlined section topic."""
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
    """Identifies and skips summary rows."""
    row_text = " ".join([clean_text_precision(c).lower() for c in row_cells if c])
    summary_keywords = ["sub total", "subtotal", "gross total", "total", "grand total"]
    return any(k in row_text for k in summary_keywords)


def map_row_to_custom_json(row, base_year, base_month):
    """Maps row data to customized JSON schema."""
    while len(row) < 14:
        row.append("")

    storage_mcm = parse_number(row[6])

    # JSON Object Schema
    return {
        "tank_name": clean_text_precision(row[1]),
        "gross_capacity_mcm": parse_number(row[2]) ,
        "date": format_to_standard_date(row[4], base_year, base_month),
        "water_level_msl": parse_number(row[5]),
        
        "storage_mcm": storage_mcm,
        "storage_percentage": parse_number(row[8]),
        "covered_land_acres": parse_number(row[10]),
        "rainfall_last_24h": parse_number(row[11]),
        "spilling_downstream_discharge_m3_s": parse_number(row[12])
    }


def upsert_reservoirs(records):
    """Insert extracted reservoir records, updating existing tanks by name."""
    try:
        import psycopg
    except ImportError as exc:
        raise RuntimeError(
            "PostgreSQL support requires psycopg. Install it with "
            "`pip install \"psycopg[binary]\"`."
        ) from exc

    connection_settings = {
        "host": DB_HOST,
        "port": DB_PORT,
        "dbname": DB_NAME,
        "user": DB_USER,
        "password": DB_PASSWORD,
    }
    table_sql = """
        CREATE TABLE IF NOT EXISTS mahawelitanks (
            id SERIAL PRIMARY KEY,
            tank_name VARCHAR(50) NOT NULL UNIQUE,
            tot_capacity_mcm DECIMAL(6,3),
            water_level_msl DECIMAL(7,3),
            storage_mcm DECIMAL(6,3),
            storage_percentage DECIMAL(6,2),
            covered_land_acres INT,
            rainfall_last_24h_mm DECIMAL(6,3),
            createdAt TIMESTAMP DEFAULT NOW(),
            last_update DATE
        )
    """
    values = [
        (
            record["tank_name"],
            record.get("gross_capacity_mcm"),
            record.get("water_level_msl"),
            record.get("storage_mcm"),
            record.get("storage_percentage"),
            record.get("covered_land_acres"),
            record.get("rainfall_last_24h"),
            record.get("date")
        )
        for record in records
        if record.get("tank_name")
    ]

    with psycopg.connect(**connection_settings) as connection:
        with connection.cursor() as cursor:
            cursor.execute(table_sql)
            if values:
                cursor.executemany(UPSERT_TANK_SQL, values)

    return len(values)


def extract_irrigation_reservoirs(pdf_path):
    if not os.path.exists(pdf_path):
        print(f" Error: File '{pdf_path}' not found.")
        return

    print(f"\n Extracting 'Irrigation System' data from: {pdf_path}")
    print("=" * 60)

    extracted_records = []
    current_topic = "General"

    with pdfplumber.open(pdf_path) as pdf:
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

                    # Skip headers
                    if "gross capacity" in row_text or "water level" in row_text or "latest status" in row_text:
                        continue
                    if cleaned_row[0].lower() == "no" or cleaned_row[1].lower() == "tank/ reservoir":
                        continue
                    if is_summary_row(cleaned_row):
                        continue

                    # Topic detection
                    is_topic, topic_name = is_topic_header(cleaned_row, underlined_words)
                    if is_topic:
                        current_topic = topic_name
                        continue

                    # ONLY PROCESS "Irrigation System" TOPIC
                    if "irrigation" in current_topic.lower():
                        item = map_row_to_custom_json(cleaned_row, base_year, base_month)

                        # FILTER LOGIC: Remove object if storage MCM is null
                        if item["storage_mcm"] is not None:
                            extracted_records.append(item)
                        else:
                            print(f"   Removed item with null storage MCM: [{item['tank_name']}]")

    # Save to JSON
    output_dir = "extracted_output"
    os.makedirs(output_dir, exist_ok=True)
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    output_path = os.path.join(output_dir, f"{base_name}_Irrigation_System.json")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(extracted_records, f, indent=2, ensure_ascii=False)

    print(f"\n [FILE CREATED] Cleaned JSON saved to:\n   {os.path.abspath(output_path)}")
    print(f"\n--- Output Sample ({len(extracted_records)} valid reservoirs found) ---")
    print(json.dumps(extracted_records[:2], indent=2))
    upserted_count = upsert_reservoirs(extracted_records)
    print(f"\n Upserted {upserted_count} reservoir records into mahawelitanks.")
    print("\n Done!")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        extract_irrigation_reservoirs(sys.argv[1])
    else:
        pdf_file = input("Enter path to PDF file: ").strip().strip('"').strip("'")
        if pdf_file:
            extract_irrigation_reservoirs(pdf_file)
        else:
            print(" No PDF path provided.")