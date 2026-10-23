# Terlingua Water Atlas

An open research project to understand groundwater and water-service options around Terlingua, Study Butte and southern Brewster County, Texas.

The atlas brings together an interactive map of documented groundwater records and a catalog of public water-system research. The aim is to make existing evidence easier to inspect, correct and build on before proposing new wells or infrastructure.

## Start here

With Python 3.11 or newer, run this command from the repository root:

```sh
python -m http.server 8765 --directory groundwater-map/dist
```

Open [http://localhost:8765](http://localhost:8765). The static app includes Leaflet and the well-data snapshot; no npm install or build is required. Map backgrounds, regional overlays and links to source reports need internet access.

Click a map record to inspect reported depth, water production, dates and supporting evidence. Use the filters and table to compare records, then follow the original source links. Exports contain the currently filtered records.

## What is included

| Location | Contents |
| --- | --- |
| [`groundwater-map/dist/`](groundwater-map/dist/) | Static map application and groundwater-data snapshot |
| [`groundwater-map/scripts/`](groundwater-map/scripts/) | Data acquisition, normalization and audit code |
| [`research/index.html`](research/index.html) | Searchable public-source catalog |
| [`research/catalog.json`](research/catalog.json) | Public-source catalog with provenance and review information |
| [`research/findings.json`](research/findings.json) | Research findings with source references and limitations |
| [`docs/research-overview.md`](docs/research-overview.md) | Plain-English findings and the remaining research questions |

The **October 23, 2026 snapshot contains 774 source records** within 50 straight-line miles of Terlingua Ghost Town (29.3216° N, 103.6160° W). Of these, 663 are classified as water-well records. The collection also includes springs, monitoring sites, test holes and other source types. These counts are **not counts of unique physical wells**: several databases can describe the same well.

The public-source catalog covers utility reports, county proceedings, state planning and funding records, groundwater-district materials, and historical water-use reports. It links to original publications; this release does not rehost the complete third-party document archive. A catalog entry records discovery and review status, not endorsement or proof that every page was substantively reviewed.

To browse the catalog, serve the repository root in another terminal:

```sh
python -m http.server 8766
```

Open [http://localhost:8766/research/index.html](http://localhost:8766/research/index.html). To preview a selection of source downloads, run:

```sh
python scripts/download_sources.py --group State --limit 5
```

The downloader lists its selection by default. Add `--download` to retrieve it. Publisher links can change, and some report viewers require an interactive export; a failed download does not establish that the source no longer exists.

## How to read the evidence

- **Positive yield** means a source reported water production. Historical flow does not establish current operation, sustainable supply or drinking-water quality.
- **Dry** requires explicit source evidence. Missing measurements and unexplained zero values remain unknown.
- **Plugged or abandoned** records document closure separately from production. Closure alone does not tell us why a well was closed.
- **Unknown** preserves a gap in the available evidence.

The map currently provides observations, source links and regional context. It does not assign drilling-success probabilities, predict new-well depths or recommend property purchases. Unreported failures, uncertain coordinates, duplicate records and uneven reporting prevent a defensible success rate from this snapshot. Texas sources also leave part of the study circle in Mexico uncovered.

The optional search-area layer retains historical asking-price examples checked October 23, 2026. Its boxes are approximate comparison areas, not parcel boundaries, confirmed availability or current purchase recommendations. Listing prices and road descriptions are dated research leads and do not establish water rights or supply.

## Why this work matters

Public records already describe a February 2026 groundwater conceptual model, planned repairs to existing water infrastructure, and actual annual water-use figures. They provide a useful starting point for investigating additional supply, treatment efficiency and service access. They do not yet establish how much extra water could reliably serve the region. See the [research overview](docs/research-overview.md) for the evidence and open questions.

This is an independent community research project. It is not an official publication of a utility, government agency or groundwater district.

## Contribute

Useful contributions include correcting evidence classifications, locating missing public reports, reconciling duplicate wells, improving map accessibility, and reviewing the hydrogeology or water accounting. Start with [CONTRIBUTING.md](CONTRIBUTING.md). Changes to well data should pass:

```sh
python groundwater-map/scripts/audit_snapshot.py
python scripts/check_repository.py
```

The audit checks source identifiers, geographic scope, evidence fields and numeric validity. It does not validate the original measurements or establish physical well uniqueness.

## License and sources

Original project code and documentation are available under the [MIT License](LICENSE). Third-party software, source data, reports, quotations and map services retain their own terms; they are not relicensed under MIT. See [THIRD_PARTY.md](THIRD_PARTY.md).

Primary groundwater sources are the [Texas Water Development Board's well data](https://www.twdb.texas.gov/groundwater/data/data-well-reports.asp), [submitted driller reports](https://services.twdb.texas.gov/arcgis/rest/services/Public/WellReports/FeatureServer), [Groundwater Database](https://services.twdb.texas.gov/arcgis/rest/services/Public/TWDB_Groundwater_database/FeatureServer) and [plugging reports](https://services.twdb.texas.gov/arcgis/rest/services/Public/PluggingReports/FeatureServer). Source URLs and retrieval metadata accompany the data.
