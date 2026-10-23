"""Build a deterministic, read-only data API from the reviewed public snapshot.

Uses only the Python standard library. This does not retrieve fresh sources.
Run with --check to validate inputs and compare the published files without writes.
"""
from pathlib import Path
import argparse
import copy
import csv
import hashlib
import io
import json
import math

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "api" / "v1"
BASE_URL = "https://raw.githubusercontent.com/Papa-Oso/terlingua-water-atlas/codex/initial-public-release/api/v1/"


def read_json(relative_path):
    return json.loads((ROOT / relative_path).read_text(encoding="utf-8-sig"))


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, allow_nan=False,
                       sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def source_lookup(records):
    """Every canonical ID and explicit alias must resolve to exactly one record."""
    lookup = {}
    canonical_ids = set()
    for record in records:
        identifier = record["id"]
        require(identifier not in canonical_ids, f"Duplicate source ID: {identifier}")
        canonical_ids.add(identifier)
        aliases = record.get("source_aliases", [])
        require(isinstance(aliases, list), f"Aliases must be a list: {identifier}")
        for name in [identifier, *aliases]:
            require(isinstance(name, str) and bool(name), f"Invalid source ID/alias: {name!r}")
            require(name not in lookup or lookup[name] == identifier,
                    f"Ambiguous source ID/alias: {name}")
            lookup[name] = identifier
    return lookup


def resolve_findings(value, lookup):
    """Canonicalize structured source_ids; retain the original prose and dates."""
    value = copy.deepcopy(value)
    count = 0

    def walk(node):
        nonlocal count
        if isinstance(node, dict):
            for key, item in node.items():
                if key == "source_ids":
                    require(isinstance(item, list), "Finding source_ids must be a list")
                    resolved = []
                    for identifier in item:
                        require(identifier in lookup, f"Unresolved finding source: {identifier}")
                        resolved.append(lookup[identifier])
                        count += 1
                    node[key] = resolved
                else:
                    walk(item)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(value)
    return value, count


def csv_bytes(wells):
    """Preserve the source CSV's columns and cells, using portable LF line ends."""
    source = ROOT / "groundwater-map/dist/data/wells.csv"
    with source.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.reader(handle))
    require(bool(rows) and "id" in rows[0], "CSV header has no record ID")
    id_column = rows[0].index("id")
    identifiers = [row[id_column] for row in rows[1:]]
    require(len(identifiers) == len(set(identifiers)), "Duplicate CSV record IDs")
    require(set(identifiers) == {well["id"] for well in wells}, "CSV and JSON record IDs differ")
    buffer = io.StringIO(newline="")
    csv.writer(buffer, lineterminator="\n").writerows(rows)
    return buffer.getvalue().encode("utf-8")


def build_artifacts():
    wells_payload = read_json("groundwater-map/dist/data/wells.json")
    catalog = read_json("research/catalog.json")
    findings = read_json("research/findings.json")
    provenance = read_json("groundwater-map/dist/data/provenance.json")
    wells = wells_payload["wells"]
    metadata = wells_payload["metadata"]
    require(metadata["record_count"] == len(wells), "Incorrect well-record count")
    require(len({row["id"] for row in wells}) == len(wells), "Duplicate well-record IDs")
    require(catalog["record_count"] == len(catalog["records"]), "Incorrect catalog count")
    lookup = source_lookup(catalog["records"])
    findings, reference_count = resolve_findings(findings, lookup)

    features = []
    for well in wells:
        lat, lon = well["lat"], well["lon"]
        require(all(isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)
                    for x in [lat, lon]), f"Invalid coordinates: {well['id']}")
        require(-90 <= lat <= 90 and -180 <= lon <= 180, f"Out-of-range coordinates: {well['id']}")
        features.append({
            "type": "Feature", "id": well["id"],
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {key: value for key, value in well.items() if key not in {"lat", "lon"}},
        })
    geojson = {"type": "FeatureCollection", "metadata": copy.deepcopy(metadata), "features": features}
    artifacts = {
        "wells.json": json_bytes(wells_payload),
        "wells.csv": csv_bytes(wells),
        "wells.geojson": json_bytes(geojson),
        "sources.json": json_bytes(catalog),
        "findings.json": json_bytes(findings),
        "provenance.json": json_bytes(provenance),
    }
    retrieved_dates = sorted({record["retrieved_date"] for record in catalog["records"]
                              if record.get("retrieved_date")})
    artifact_details = {}
    counts = {"wells.json": len(wells), "wells.csv": len(wells),
              "wells.geojson": len(wells), "sources.json": len(catalog["records"])}
    for name, content in artifacts.items():
        detail = {"path": name, "url": BASE_URL + name, "bytes": len(content),
                  "sha256": hashlib.sha256(content).hexdigest(),
                  "mediaType": "text/csv" if name.endswith(".csv") else
                               "application/geo+json" if name.endswith(".geojson") else "application/json"}
        if name in counts:
            detail["recordCount"] = counts[name]
        artifact_details[name] = detail
    manifest = {
        "schemaVersion": 1,
        "title": "Terlingua Water Atlas public data API",
        "baseUrl": BASE_URL,
        "access": {"method": "GET", "authenticationRequired": False,
                   "type": "static snapshot files", "serverSideQueryParameters": False},
        "snapshotDate": metadata["retrieved_at"],
        "sourceDates": {
            "wellsRetrievedAt": metadata["retrieved_at"],
            "wellSourceRetrievalStartedAt": metadata.get("snapshot_started_at_utc"),
            "wellSourceRetrievalCompletedAt": metadata.get("snapshot_completed_at_utc"),
            "wellPayloadBuiltAt": metadata.get("built_at_utc"),
            "catalogAsOf": catalog["as_of"],
            "catalogFirstRetrievedDate": retrieved_dates[0] if retrieved_dates else None,
            "catalogLastRetrievedDate": retrieved_dates[-1] if retrieved_dates else None,
            "note": "Publication, measurement and retrieval dates are separate. Rebuilding this API does not refresh sources.",
        },
        "counts": {"wellSourceRecords": len(wells),
                   "waterLevelObservations": sum(len(row.get("water_levels", [])) for row in wells),
                   "sourceCatalogRecords": len(catalog["records"]),
                   "resolvedStructuredFindingReferences": reference_count},
        "artifacts": artifact_details,
        "sourceIdentifiers": "sources.json retains explicit source_aliases; structured source_ids in findings.json use canonical catalog IDs.",
        "license": "Original code and documentation: MIT. Third-party records and reports retain publisher terms; see THIRD_PARTY.md.",
        "limitations": [
            "Source records are not necessarily unique physical wells; the Texas-only study area is within 50 miles of Terlingua Ghost Town.",
            "Historical reported yield does not establish current operation, safe drinking water, sustainable yield or spare supply.",
            "Missing values remain unknown. Explicit dry evidence and closure evidence are separate from missing measurements.",
            "Manual outcome classifications and narrative yields belong to the reviewed source snapshot; changed source text needs review before reuse.",
            "The source catalog is not exhaustive; discovery, retrieval and substantive review are separate states.",
            "Findings include interpretation and historical plans; they are not live operational or construction-status reports.",
        ],
    }
    artifacts["manifest.json"] = json_bytes(manifest)
    return artifacts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate and compare generated files without writing")
    args = parser.parse_args()
    try:
        artifacts = build_artifacts()
    except (KeyError, TypeError, ValueError, OSError) as error:
        raise SystemExit(f"API validation failed: {error}") from error
    if args.check:
        differences = [name for name, content in artifacts.items()
                       if not (OUTPUT / name).is_file() or (OUTPUT / name).read_bytes() != content]
        if differences:
            raise SystemExit("API files need rebuilding: " + ", ".join(differences))
        print(f"Validated {len(artifacts)} API files and source references; generated contents match.")
    else:
        OUTPUT.mkdir(parents=True, exist_ok=True)
        for name, content in artifacts.items():
            (OUTPUT / name).write_bytes(content)
        print(f"Built {len(artifacts)} API files from the existing reviewed snapshot; no sources refreshed.")


if __name__ == "__main__":
    main()
