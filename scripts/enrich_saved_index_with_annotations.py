#!/usr/bin/env python3

import argparse
import csv
import json
import os
from typing import Any, Dict, List, Optional


def parse_bool(value: Any) -> str:
    if value is True:
        return "True"
    if value is False:
        return "False"
    if value is None:
        return ""
    s = str(value).strip().lower()
    if s in {"true", "1", "yes", "y"}:
        return "True"
    if s in {"false", "0", "no", "n"}:
        return "False"
    return ""


def to_csv_list(values: Any) -> str:
    if not values:
        return ""
    if isinstance(values, str):
        return values
    if isinstance(values, list):
        return ",".join(str(v).strip() for v in values if str(v).strip())
    return str(values)


def load_annotations(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise SystemExit("annotations json must be an object keyed by postId")
    return data


def get_ann(ann_store: Dict[str, Any], shortcode: str, json_filename: str) -> Optional[Dict[str, Any]]:
    # App uses id = shortcode || json_filename, so try both
    if shortcode and shortcode in ann_store and isinstance(ann_store[shortcode], dict):
        return ann_store[shortcode]
    if json_filename and json_filename in ann_store and isinstance(ann_store[json_filename], dict):
        return ann_store[json_filename]
    return None


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Merge InstaBoard annotations JSON into saved_index CSV, producing an enriched CSV with my_* columns."
    )
    parser.add_argument("--input-csv", default="public/saved_index_with_location.csv")
    parser.add_argument("--fallback-input-csv", default="public/saved_index.csv")
    parser.add_argument("--annotations-json", default="annotations.json")
    parser.add_argument("--output-csv", default="public/saved_index_enriched.csv")
    args = parser.parse_args()

    input_csv = args.input_csv if os.path.exists(args.input_csv) else args.fallback_input_csv
    if not os.path.exists(input_csv):
        raise SystemExit(f"Input CSV not found: {input_csv}")

    ann_store = load_annotations(args.annotations_json)

    with open(input_csv, newline="", encoding="utf-8") as f_in:
        reader = csv.DictReader(f_in)
        if not reader.fieldnames:
            raise SystemExit("Input CSV has no header.")

        fieldnames: List[str] = list(reader.fieldnames)
        for col in ["my_tags", "my_notes", "my_northstar", "my_lenses"]:
            if col not in fieldnames:
                fieldnames.append(col)

        rows = list(reader)

    os.makedirs(os.path.dirname(args.output_csv) or ".", exist_ok=True)
    with open(args.output_csv, "w", newline="", encoding="utf-8") as f_out:
        writer = csv.DictWriter(f_out, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()

        updated = 0
        for row in rows:
            shortcode = (row.get("shortcode") or "").strip()
            json_filename = (row.get("json_filename") or "").strip()
            ann = get_ann(ann_store, shortcode, json_filename)

            if ann:
                tags = to_csv_list(ann.get("tags"))
                notes = ann.get("notes") if isinstance(ann.get("notes"), str) else ""
                flags = ann.get("flags") if isinstance(ann.get("flags"), dict) else {}
                northstar = parse_bool(flags.get("northstar"))
                lenses = to_csv_list(ann.get("categories"))

                row["my_tags"] = tags
                row["my_notes"] = notes
                row["my_northstar"] = northstar
                row["my_lenses"] = lenses
                if tags or notes or northstar or lenses:
                    updated += 1
            else:
                row.setdefault("my_tags", "")
                row.setdefault("my_notes", "")
                row.setdefault("my_northstar", "")
                row.setdefault("my_lenses", "")

            writer.writerow(row)

    print(f"Wrote {args.output_csv} (rows={len(rows)}, rows_with_annotations={updated})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


