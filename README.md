# Terlingua Water Atlas

An open public-information resource for groundwater and water systems around Terlingua, Study Butte and southern Brewster County, Texas.

Explore documented well records, find original public reports, and reuse the evidence in your own research or application. This independent resource supports residents, researchers, utilities and anyone interested in the area's water. It does not represent an agency, endorse property purchases or advocate a particular infrastructure project.

## Explore and reuse

| Resource | What it provides |
| --- | --- |
| [Interactive map](groundwater-map/dist/index.html) | Well locations, reported depth and production, evidence categories, filters and exports |
| [Source library](research/index.html) | Searchable references to utility reports, county proceedings, groundwater studies and public agency records |
| [Data API](docs/API.md) | Read-only JSON, CSV and GeoJSON snapshots for other tools |
| [Research overview](docs/research-overview.md) | Sourced findings and unresolved questions |
| [Maintenance guide](docs/MAINTENANCE.md) | How sources are retrieved, changes reviewed and updates published |

The map and library links above identify the HTML entry points; GitHub's file viewer displays their source. Run the local server below to use them interactively.

**Snapshot: October 23, 2026.** The map contains 774 source records within 50 straight-line miles of Terlingua Ghost Town, including 663 classified as water-well records. Multiple records may describe the same physical well. The source library contains 353 catalog entries and preserves discovery, retrieval and review information; it is not an exhaustive archive.

## Run locally

Use Python 3.11 or newer. From the repository root:

```sh
python -m http.server 8765
```

Open the [map](http://localhost:8765/groundwater-map/dist/) or [source library](http://localhost:8765/research/). Leaflet and the well snapshot are bundled; no npm install or build is required. Map backgrounds, regional overlays and original source links need internet access.

## Use the data

The [API guide](docs/API.md) documents formats, identifiers, example code and snapshot dates. The files require no API key. Download and filter them in your application; there is no server-side query service.

API base URL:

```text
https://raw.githubusercontent.com/Papa-Oso/terlingua-water-atlas/codex/initial-public-release/api/v1/
```

Start with `manifest.json` for file URLs, counts, dates and hashes. The branch URL follows published updates. For reproducible research, replace the branch name with the full Git commit SHA of the version you used.

## Read evidence in context

- **Positive yield** means a source reported production; it does not establish present operation, sustainable supply or drinking-water quality.
- **Dry** requires explicit evidence. Missing measurements and unexplained zero values remain unknown.
- **Plugged or abandoned** records document closure. Closure alone does not establish a dry hole.
- **Unknown** preserves a gap in the available evidence.

Records can be duplicated, incomplete or approximately located. Texas data leave the Mexican portion of the study circle uncovered. The map provides no drilling-success probability or predicted new-well depth. Publication, measurement, retrieval and review dates describe different events; a newly downloaded record may describe an old observation.

Historical exploratory files remain available for provenance. Their dated property examples and technical screening ideas are not current recommendations.

## Keep it useful

Corrections, missing public sources, accessibility improvements and hydrogeological review are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). Updates currently require review and publication by a maintainer; no scheduled source updater is active. The [maintenance guide](docs/MAINTENANCE.md) describes the process and when a database could become useful.

## License and attribution

Original code and documentation use the [MIT License](LICENSE). Third-party software, source data, reports, quotations and map services retain their own terms; see [THIRD_PARTY.md](THIRD_PARTY.md). Groundwater records derive from [Texas Water Development Board well data](https://www.twdb.texas.gov/groundwater/data/data-well-reports.asp), with source links and retrieval metadata preserved.
