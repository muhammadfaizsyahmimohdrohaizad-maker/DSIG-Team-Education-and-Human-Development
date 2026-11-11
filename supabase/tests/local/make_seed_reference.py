#!/usr/bin/env python3
"""Rebuilds supabase/seed_reference.sql from the payload printed by scripts/import-reference.ts --print.
Usage: python3 supabase/tests/local/make_seed_reference.py /tmp/ref.json > supabase/seed_reference.sql"""
import json, pathlib, re, sys

payload = json.load(open(sys.argv[1]))
body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
if "$ref$" in body:
    sys.exit("payload contains the $ref$ quote tag")
current = (pathlib.Path(__file__).resolve().parents[2] / "seed_reference.sql").read_text()
current = re.sub(r"source_version [^)]+\)", "source_version " + payload["source_version"] + ")", current, count=1)
sys.stdout.write(re.sub(r"\$ref\$.*?\$ref\$", lambda m: "$ref$" + body + "$ref$", current, count=1, flags=re.S))
