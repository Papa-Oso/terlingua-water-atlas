# Maintaining Water Atlas and the Terlingua snapshot

The published map, source library and API are reviewed snapshots. Their purpose is to make public evidence accessible and reusable, with its original context. Updates should improve that evidence without promoting a particular property, supplier or infrastructure proposal.

**Current implementation:** local files, a static map and library, and read-only snapshot exports. There is no scheduled source updater, AI service or cloud database. The commands below run on the operator's computer using Python 3.11 or newer from the repository root. Downloads and any associated costs belong to that operator; they do not automatically publish changes or upload local state.

The [operating model](OPERATING-MODEL.md) requires that the core remain useful without a founder-operated service. This guide covers the existing manual refresh process. The [roadmap](ROADMAP.md) describes future connectors, on-demand freshness checks and optional user-managed schedules; those features are not yet implemented.

## 1. Retrieve sources and discover new publications

### Groundwater data

The acquisition script retrieves official TWDB geographic records and statewide bulk archives. It caches downloads by default. To deliberately refresh them:

```sh
python groundwater-map/scripts/inspect_sources.py --refresh
python groundwater-map/scripts/build_data.py
```

The first command downloads sources into the ignored `groundwater-map/raw/` directory and records URLs, hashes and retrieval metadata in `download_manifest.json`. It can download large statewide archives. Preserve any earlier raw snapshot needed for comparison before refreshing: `--refresh` replaces the corresponding cached files. The second command extracts the study-area tables from those downloads; it does not yet publish a new map snapshot.

Without `--refresh`, `inspect_sources.py` reuses existing downloaded files. That is a cached rebuild, not a fresh observation of the upstream sources.

### Public reports and webpages

Preview a bounded selection of existing catalog entries:

```sh
python scripts/download_sources.py --group State --limit 5
```

Retrieve that selection:

```sh
python scripts/download_sources.py --group State --limit 5 --download
```

The downloader saves timestamped responses and appends results to `downloads/retrieval-manifest.jsonl`. It records actual content type, hash comparisons and failures. These local downloads do not update the published catalog or findings. A changed hash may reflect webpage markup, a revised document or a report-viewer landing page; inspect the response before treating it as new evidence. Some viewers require an interactive export.

**The downloader does not discover newly published documents.** Review publisher indexes separately: utility reports and notices, county agendas and minutes, groundwater-district meetings and studies, and relevant state planning or funding pages. Add newly located items to `research/catalog.json` with stable IDs, public URLs, dates, source attribution, an accurate retrieval state and review limitations. Maintain the catalog's counts and groups. Do not fabricate a hash or describe a source as downloaded when only its link has been found; adjust the schema and validation deliberately if adding discovery-only records.

## 2. Compare and review before changing claims

Compare the new sources with the previous snapshot. Record added, removed and changed records, especially changes to coordinates, construction, yield, water levels, outcomes and source wording. A record disappearing from a live response is not proof that the physical well disappeared.

Review the curated interpretation files before regenerating well data:

- `groundwater-map/scripts/remarks_classification.json`
- `groundwater-map/scripts/narrative_yields.json`

These files contain decisions based on specific source narratives. Recheck their evidence against any changed records; do not silently carry an old interpretation into a different source version. Preserve original values, dates, qualifiers and source identifiers. Keep duplicate source records separate until a supported physical-well match is documented.

For the source library, review affected statements in `research/findings.json` and related documentation. Separate observations from interpretation. An agenda, funding commitment, proposed schedule and completed project are different kinds of evidence. Downloading a later report does not automatically validate every earlier conclusion.

## 3. Build the reviewed outputs

Once the source changes and curated interpretations have been reviewed, regenerate the map payload:

```sh
python groundwater-map/scripts/normalize_data.py
python groundwater-map/scripts/audit_snapshot.py
```

Inspect the diff of the generated well JSON, CSV, summary and provenance files. Check counts and material changes against the reviewed sources. The audit verifies identifiers, geographic scope and field validity; it cannot establish whether a reported measurement is physically correct or whether two records describe one well.

After updating the source catalog and findings, build and check the API:

```sh
python scripts/build_api.py
python scripts/build_api.py --check
python scripts/check_repository.py
```

The API builder publishes the reviewed inputs as deterministic files under `api/v1/`. It does not refresh upstream data. Its `--check` mode validates the inputs and confirms that generated outputs match the published files without writing changes. See [API.md](API.md) for the interface and validation details.

Check the map, source library and API links locally. Inspect representative changed records and confirm filters, details and exports still work. Keep source attribution and limitations visible. If the API contract changes incompatibly, introduce a new API version rather than silently changing `v1`.

## 4. Publish a traceable update

Prepare a pull request with the source snapshot dates, changes to counts or conclusions, newly reviewed material, validation results and unresolved gaps. Check the proposed files for unintended source archives, credentials, session data and private correspondence. Keep original publisher terms attached to source-derived material; the project MIT license does not relicense it.

Publish the reviewed commit and record its full SHA. That SHA gives API consumers an immutable reference to the files they used. Update dated README figures and any affected overview text when the underlying snapshot changes. A publish date alone must not replace source dates.

## Dates and review state

| Field or event | Meaning |
| --- | --- |
| Measurement date | When the reported observation or test occurred |
| Document date | When the publisher issued the material, if known |
| Retrieval date | When this project obtained that particular response or export |
| Review date and status | When and how the evidence was examined; retrieval alone is not substantive review |
| Build or publish date | When derived files were generated or released |

Retain entry-level dates for collections that mix old and new sources. Do not mass-update every retrieval date when only a few documents were checked. Mark failed or inaccessible sources and preserve their prior provenance. A successful HTTP response can still contain an error page or incomplete export.

## User-managed automation and storage

A future installation should refresh on request and optionally use a schedule explicitly set up by its operator. Scheduling must be off by default, include pause/removal instructions, and bound requests, retries and processing. Checks run on that operator's machine or their chosen infrastructure; they pause when it is off. The project must not supply a central fallback job or a maintainer's billing account. Existing repository CI checks code and snapshots on pushes and pull requests; it is not a live source monitor.

Source checks should retain local retrieval logs, avoid excessive requests and compare only relevant changes. Finding new meeting packets and reports requires publisher-specific discovery in addition to checking known URLs. A successful check does not establish a recent measurement or a verified legal status. The operator may propose reviewed changes back to the public catalog, but local use must not depend on publication or maintainer availability.

Prefer portable files and, when needed, a local database for metadata and caches. Preserve stable source IDs, version history, dates and exportable snapshots. Keep selected excerpts or evidence versions where needed for traceability instead of mirroring every upstream archive. Separate raw retrievals from reviewed interpretations. Any cloud database or hosted monitoring service is an optional deployment paid for by its operator and must support the same import/export path.

A future shared service may run only within its separately funded operating budget, with quotas and a defined pause/shutdown policy. Donation shortfalls must not become an automatic personal expense for the founder or cause the local software to stop working. No hosted service, donation collection or background monitoring is configured by these instructions.
