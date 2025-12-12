#!/usr/bin/env python3

import argparse
import csv
import json
import lzma
import os
from typing import Dict, Optional, Tuple


def parse_address_json(value) -> Optional[Dict]:
    if value is None:
        return None
    if isinstance(value, dict):
        return value
    if isinstance(value, str) and value.strip():
        try:
            return json.loads(value)
        except Exception:
            return None
    return None


def split_city_region(city_name: str) -> Tuple[str, str]:
    """
    Instaloader location.address_json often provides city_name like:
      - 'San Francisco, California'
      - 'Onomichi, Hiroshima'
    region_name is frequently empty in this dataset, so we derive region from the comma.
    """
    if not city_name:
        return "", ""
    parts = [p.strip() for p in city_name.split(",") if p.strip()]
    if len(parts) <= 1:
        return city_name.strip(), ""
    return parts[0], parts[-1]


def extract_location(saved_dir: str, json_filename: str) -> Tuple[str, str, str]:
    """
    Returns: (location_name, location_city, location_region)
    """
    path = os.path.join(saved_dir, json_filename)
    if not os.path.exists(path):
        return "", "", ""

    try:
        with lzma.open(path, "rt", encoding="utf-8", errors="replace") as f:
            data = json.load(f)
    except Exception:
        return "", "", ""

    node = data.get("node", {}) if isinstance(data, dict) else {}
    loc = node.get("location") if isinstance(node, dict) else None
    if not isinstance(loc, dict):
        return "", "", ""

    location_name = (loc.get("name") or "").strip()
    addr = parse_address_json(loc.get("address_json"))

    city = ""
    region = ""
    if isinstance(addr, dict):
        city_name = (addr.get("city_name") or "").strip()
        if city_name:
            city, region = split_city_region(city_name)
        # If region is still missing, try region_name (sometimes present)
        if not region:
            region = (addr.get("region_name") or "").strip()

    return location_name, city, region


def main() -> int:
    parser = argparse.ArgumentParser(description="Add city/region location columns to saved_index CSV using local Instaloader JSON metadata.")
    parser.add_argument("--input-csv", default="public/saved_index.csv", help="Path to the existing saved_index CSV.")
    parser.add_argument("--saved-dir", default="public/saved", help="Directory containing *.json.xz files referenced by json_filename.")
    parser.add_argument("--output-csv", default="public/saved_index_with_location.csv", help="Path to write the enriched CSV.")
    args = parser.parse_args()

    with open(args.input_csv, newline="", encoding="utf-8") as f_in:
        reader = csv.DictReader(f_in)
        if not reader.fieldnames:
            raise SystemExit("Input CSV has no header.")

        fieldnames = list(reader.fieldnames)
        for col in ["location_name", "location_city", "location_region"]:
            if col not in fieldnames:
                fieldnames.append(col)

        rows = list(reader)

    os.makedirs(os.path.dirname(args.output_csv) or ".", exist_ok=True)
    with open(args.output_csv, "w", newline="", encoding="utf-8") as f_out:
        writer = csv.DictWriter(f_out, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()

        updated = 0
        for row in rows:
            json_filename = (row.get("json_filename") or "").strip()
            location_name, city, region = extract_location(args.saved_dir, json_filename) if json_filename else ("", "", "")
            row["location_name"] = location_name
            row["location_city"] = city
            row["location_region"] = region
            if location_name or city or region:
                updated += 1
            writer.writerow(row)

    print(f"Wrote {args.output_csv} (rows={len(rows)}, rows_with_location={updated})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


