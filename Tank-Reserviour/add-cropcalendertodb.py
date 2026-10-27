#!/usr/bin/env python3
"""Sync water issue schedule JSON data to PostgreSQL."""

import argparse
import json
import os
import sys
from pathlib import Path
import psycopg2
from psycopg2.extras import execute_batch

TABLE_NAME = "water_issue_schedule"

DB_CONFIG = {
    "host": os.environ.get("PGHOST", "localhost"),
    "port": int(os.environ.get("PGPORT", "5432")),
    "dbname": os.environ.get("PGDATABASE", "postgres"),
    "user": os.environ.get("PGUSER", "postgres"),
    "password": os.environ.get("PGPASSWORD", ""),
}

COLUMNS = (
    "no",
    "tank_name",
    "section",
    "initial_extent_ha",
    "water_start",
    "water_end",
    "paddy_target_days",
    "paddy_target_area",
    "paddy_area_percentage",
    "other_crops_target_days",
    "other_crops_target_area",
    "other_crops_area_percentage",
)


def create_table_if_not_exists(cur):
    query = f"""
    CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
        id SERIAL PRIMARY KEY,
        no INT,
        tank_name TEXT NOT NULL,
        section TEXT,
        initial_extent_ha NUMERIC,
        water_start DATE,
        water_end DATE,
        paddy_target_days INT,
        paddy_target_area NUMERIC,
        paddy_area_percentage NUMERIC,
        other_crops_target_days INT,
        other_crops_target_area NUMERIC,
        other_crops_area_percentage NUMERIC,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_tank_section_start UNIQUE NULLS NOT DISTINCT (tank_name, section, water_start)
    );
    """
    cur.execute(query)


def load_json_data(file_path):
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"JSON file not found: {path}")

    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if isinstance(data, dict):
        return [data]
    elif isinstance(data, list):
        return data
    else:
        raise ValueError("Invalid JSON content: expected an object or list of objects")


def sync_to_postgres(records, db_config):
    if not records:
        print("No records to insert.", file=sys.stderr)
        return 0

    column_names = ", ".join(COLUMNS)
    placeholders = ", ".join(["%s"] * len(COLUMNS))
    
    update_assignments = ", ".join(
        f"{col} = EXCLUDED.{col}"
        for col in COLUMNS
        if col not in ("tank_name", "section", "water_start")
    )

    upsert_query = f"""
        INSERT INTO {TABLE_NAME} ({column_names})
        VALUES ({placeholders})
        ON CONFLICT (tank_name, section, water_start)
        DO UPDATE SET
            {update_assignments},
            updated_at = now();
    """

    values_list = [
        tuple(record.get(col) for col in COLUMNS)
        for record in records
    ]

    conn = psycopg2.connect(**db_config)
    try:
        with conn:
            with conn.cursor() as cur:
                create_table_if_not_exists(cur)
                execute_batch(cur, upsert_query, values_list)
        print(f"Successfully synced {len(records)} record(s) to {TABLE_NAME}.", file=sys.stderr)
        return len(records)
    finally:
        conn.close()


def main():
    parser = argparse.ArgumentParser(description="Insert water issue schedule JSON data into PostgreSQL.")
    parser.add_argument(
        "--file",
        type=Path,
        required=True,
        help="Path to the JSON file containing schedule records.",
    )
    args = parser.parse_args()

    try:
        records = load_json_data(args.file)
        sync_to_postgres(records, DB_CONFIG)
    except Exception as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())