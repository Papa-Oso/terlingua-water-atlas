# Maintaining the public information resource

The published map, source library and API are reviewed snapshots. Their purpose is to make public evidence accessible and reusable, with its original context. Updates should improve that evidence without promoting a particular property, supplier or infrastructure proposal.

**Current operating model:** files in a public GitHub repository, a static map and library, and read-only API exports. There is no scheduled source updater and no cloud database. The commands below use Python 3.11 or newer and run from the repository root.

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

## Automation and a future database

A useful first automation would check known URLs for changes and run the existing validators, then open a reviewable update. It should retain retrieval logs, avoid excessive requests and leave interpretation to review. Discovery of new meeting packets and reports needs its own publisher-specific process. Neither process is active today.

Static files currently make the resource easy to host, copy and cite. A cloud database could become useful for incremental observations, geographic queries, richer search or several active contributors. If that need develops, retain stable source IDs, original-source provenance, revision history and downloadable snapshots. Keep reviewed published records separate from newly ingested material. A database improves access and operations; it does not make an old observation current or validate an interpretation.
