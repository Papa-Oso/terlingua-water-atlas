# Water Atlas

Open-source software and a shared source catalog for finding water information, accessing original evidence, and understanding how current it is. Terlingua, Texas is the first test case; the planned connector system will support other places.

**Water Atlas must remain useful without any service operated or funded by its founder.** People run the software on their own computers or infrastructure. Any paid AI, processing or storage uses the operator's own accounts and budget. The core works independently of an optional project website, donations or hosted service.

The [operating model](docs/OPERATING-MODEL.md) defines this commitment. The [roadmap](docs/ROADMAP.md) describes the first connector-based version: find sources, retrieve evidence on demand, show its dates and changes, and optionally schedule checks on the user's own machine. AI would help people find and understand evidence through tools they control.

The planned [community coverage map](docs/COMMUNITY-MAP.md) will highlight contributed areas and invite visitors to help index places they care about. Color will show documented coverage, not water availability. Start contributing with the [copyable area-research prompt](prompts/EXPLORE-AN-AREA.md), using your own AI or research tools.

## What exists and what comes next

| Available now | Planned first version |
| --- | --- |
| Local Terlingua map and searchable source library | Reusable connectors with geographic coverage and access instructions |
| Dated JSON, CSV and GeoJSON snapshots | On-demand retrieval with local caching and explicit freshness status |
| Manual acquisition, audit and source-download scripts | Optional user-managed scheduling and AI tool integration |
| Original-source links and evidence limitations | River history and rights/access research connected by place and date |

The current release is a research snapshot and supporting tools. Live connector services, an AI question interface and a scheduler are not implemented. A static project website may explain the project and accept donations; any future hosted edition would have a separate funded budget and remain optional. No donation collection or hosted edition is configured by this repository.

This independent project supports residents, researchers, utilities and anyone interested in water evidence. Sources retain their own access terms and availability; a local installation still needs internet access to retrieve new information from publishers.

## Explore and reuse

These resources form the Terlingua case study:

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
python -m http.server 8765 --bind 127.0.0.1
```

Open the [map](http://localhost:8765/groundwater-map/dist/) or [source library](http://localhost:8765/research/). This serves the downloaded files on your own computer; no cloud server or project account is required. Leaflet and the well snapshot are bundled; no npm install or build is required. Map backgrounds, regional overlays and original source links need internet access.

## Use the data

The [API guide](docs/API.md) documents formats, identifiers, example code and snapshot dates. The same files are included locally under `api/v1/` and require no API key. Read them from disk, serve your own copy or use the optional public download URLs; there is no server-side query service.

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

Corrections, missing public sources, accessibility improvements and hydrogeological review are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). Current refresh scripts run locally when invoked; publishing changes to the shared snapshot requires maintainer review. No scheduled source updater is active. The [maintenance guide](docs/MAINTENANCE.md) describes the current manual process. Future background checks must be explicitly enabled and run with the operator's resources; they stop when that machine is off unless the operator arranges another place to run them.

## License and attribution

Original code and documentation use the [MIT License](LICENSE). Third-party software, source data, reports, quotations and map services retain their own terms; see [THIRD_PARTY.md](THIRD_PARTY.md). Groundwater records derive from [Texas Water Development Board well data](https://www.twdb.texas.gov/groundwater/data/data-well-reports.asp), with source links and retrieval metadata preserved.
