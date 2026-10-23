# Public data API

Use the same public evidence behind the map and source library in your own research, map or application. This API consists of versioned **read-only snapshot files**. It needs no account, API key or database. Download a file and filter it in your application; URL query parameters do not filter the response.

## Endpoints

Base URL:

```text
https://raw.githubusercontent.com/Papa-Oso/terlingua-water-atlas/codex/initial-public-release/api/v1/
```

Every endpoint uses `GET`. The response body is the complete named file. The hosting service may supply a generic text content type; parse JSON based on the documented file format.

| File | Contents |
| --- | --- |
| [`manifest.json`](../api/v1/manifest.json) | API schema version, source snapshot dates, counts, artifact sizes and SHA-256 hashes |
| [`wells.json`](../api/v1/wells.json) | Original `metadata` and `wells` arrays, including reported tests, observations and evidence |
| [`wells.geojson`](../api/v1/wells.geojson) | GeoJSON FeatureCollection with `[longitude, latitude]` point coordinates and the original metadata |
| [`wells.csv`](../api/v1/wells.csv) | Compact table with the existing map export's columns; use JSON for nested tests and observations |
| [`sources.json`](../api/v1/sources.json) | Source catalog with original URLs, dates, historical hashes, review states, limitations and aliases |
| [`findings.json`](../api/v1/findings.json) | Topic-organized research findings, retaining source dates and caveats |
| [`provenance.json`](../api/v1/provenance.json) | Groundwater retrieval manifest: original query/download URLs, timestamps, cache states and historical hashes |

The `v1` directory defines this interface. The branch URL serves the latest **published** snapshot; it does not query Texas databases on each request. For a reproducible citation, replace `codex/initial-public-release` in the URL with the full Git commit SHA of the release you used. Record the manifest's source dates and artifact hashes with your analysis.

## Read and filter records

Python 3.11 or newer, using only its standard library:

```python
import json
from urllib.request import urlopen

base = "https://raw.githubusercontent.com/Papa-Oso/terlingua-water-atlas/codex/initial-public-release/api/v1/"
with urlopen(base + "wells.json", timeout=30) as response:
    payload = json.load(response)

# Historical source records with explicitly reported positive yield.
# These are not a list of currently functioning or potable wells.
records = [row for row in payload["wells"]
           if row["record_kind"] == "water_well"
           and row["status"] == "positive_yield"]
print(payload["metadata"]["retrieved_at"], len(records))
print([(row["id"], row["depth_ft"], row["yield_gpm"]) for row in records[:5]])
```

JavaScript, for example from Node.js:

```javascript
const base = 'https://raw.githubusercontent.com/Papa-Oso/terlingua-water-atlas/codex/initial-public-release/api/v1/';
const response = await fetch(base + 'sources.json');
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const catalog = await response.json();
const countyRecords = catalog.records.filter(row => row.group === 'County');
console.log(catalog.as_of, countyRecords.map(row => ({id: row.id, title: row.title, url: row.url})));
```

Use the repository's local web server during development, or download the files once and read them locally. Cache your copy instead of retrieving the entire snapshot for every map interaction. HTTP availability and hosting limits are controlled by the host; this project makes no uptime guarantee.

## Identifiers, dates and evidence

- Well IDs such as `GWDB-7344402` identify **source records**, not a deduplicated physical-well register. Keep the original source/report IDs when joining other data.
- `null` means unavailable, not zero. A yield range or threshold may have no exact `yield_gpm`; inspect `yield_raw`, qualifier and bounds.
- Historical positive yield, explicit dry evidence and plugging evidence may coexist. The displayed `status` uses the documented precedence rules; underlying evidence remains available.
- Source catalog IDs are canonical within the project. Some records carry `source_aliases`, such as `state-01` for `state-001`. The API builder resolves structured `source_ids` in findings to the canonical catalog IDs. Original prose and page references are preserved, so prose may still use an alias.
- `document_date`, measurement dates, `retrieved_date`, `as_of` and build times describe different events. Rebuilding the API does not make a historical measurement current.
- Catalog hashes and byte counts describe the archived research snapshot. Manifest artifact hashes describe the public API files. These are different hashes of different objects.
- Findings are organized by topic and retain their existing structures: some sections are structured records, others are narrative text. Not every citation is represented as a structured `source_ids` field. Treat findings as sourced research, not a uniform measurements table.

**Limits travel with the data.** The collection is incomplete and may contain duplicate or approximate locations. Historical tests do not establish present water quality, drought-reliable yield or spare utility supply. Manual classifications and narrative extractions were reviewed against the dated snapshot; changed source remarks need review. An agenda or funded plan is not proof of completed construction. There is no drilling-success score or property recommendation in this API.

The source library links to original publications. A catalog entry does not mean the entire report is redistributed here or has been fully reviewed. Original project code and documentation use the MIT license; third-party material retains its publisher's terms. See [THIRD_PARTY.md](../THIRD_PARTY.md).

## Build and validate

From the repository root:

```sh
python scripts/build_api.py
python scripts/build_api.py --check
```

The builder reads the already-reviewed well JSON/CSV, source catalog, findings and groundwater provenance. It validates counts, record IDs, coordinates, matching CSV/JSON record IDs and structured finding references, then creates deterministic files under `api/v1/`. `--check` performs the same validation and fails if the committed API files differ; it writes nothing and makes no network requests.

Refresh upstream sources and review resulting changes **before** regenerating the API. Keep the source catalog's discovery and review statuses accurate. Checking whether an existing URL changed is not the same as finding newly published records. The API is a publication format, not an automatic discovery or interpretation system.
