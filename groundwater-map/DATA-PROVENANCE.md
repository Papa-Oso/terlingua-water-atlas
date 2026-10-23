# Data provenance and rebuild instructions

The snapshot was downloaded on October 23, 2026. Its geographic scope is a 50-statute-mile great-circle radius around Terlingua Ghost Town, 29.3216° N, 103.6160° W. Coordinates use the recorded TWDB map-service geometry. The circle extends into Mexico; these Texas databases do not supply a comprehensive cross-border inventory.

## Official sources

- [TWDB groundwater data and downloads](https://www.twdb.texas.gov/groundwater/data/data-well-reports.asp): describes database limitations, nightly updates, table dictionaries, and report access.
- [Submitted Drillers Reports geographic layer](https://services.twdb.texas.gov/arcgis/rest/services/Public/WellReports/FeatureServer/0) and [SDR bulk archive](https://www.twdb.texas.gov/groundwater/data/SDRDownload.zip).
- [Groundwater Database geographic layer](https://services.twdb.texas.gov/arcgis/rest/services/Public/TWDB_Groundwater_database/FeatureServer/0) and [GWDB bulk archive](https://www.twdb.texas.gov/groundwater/data/GWDBDownload.zip).
- [Plugging reports geographic layer](https://services.twdb.texas.gov/arcgis/rest/services/Public/PluggingReports/FeatureServer/0), joined to PlugData in the SDR archive.
- [TWDB Report 323](https://www.twdb.texas.gov/publications/reports/numbered_reports/doc/R323/R323.pdf), printed page 33: supplemental historical abandonment/water-quality evidence for GWDB 73-44-403.
- [Terlingua town location](https://www.tshaonline.org/handbook/entries/terlingua-tx).

## Rebuild

Python 3.11 or newer; standard library only. Run from this project directory:

```powershell
python scripts/inspect_sources.py
python scripts/build_data.py
python scripts/normalize_data.py
```

The first command reuses downloaded files when available. To force a genuinely new snapshot, use `python scripts/inspect_sources.py --refresh`, then run the other two commands. The full archives total about 235 MB compressed; extracting joined local tables can take a few minutes. A cached rebuild is not a new retrieval. Retain the complete `raw` directory if the exact original snapshot must remain reproducible; for a refresh intended for comparison, first make a separate project copy.

`scripts/remarks_classification.json` contains manually reviewed textual outcome evidence, exact source snippets, and source-supported cross references. `scripts/narrative_yields.json` contains 144 reviewed historical flow readings across 133 GWDB records, with original remarks and stated methods/dates. Both are curated inputs, not generated caches. Review them against changed source records after a future refresh. `normalize_data.py` preserves source remarks and separates the dated Report 323 supplement. If a fresh source contradicts historical evidence, retain both with dates rather than silently overwriting one.

## Extraction and completeness

The geographic query first collects every object ID in a bounding box [-104.47, 28.58, -102.77, 30.06] (WGS84 ordering west, south, east, north). It retrieves IDs in batches of 100, checks transfer-limit flags, and asserts the returned object-ID set exactly matches the requested set. The box covers the entire radius. A final Haversine distance filter uses mean Earth radius 3,958.7613 statute miles; this is a great-circle approximation, not an ellipsoidal property survey.

The API returned 389 SDR, 501 GWDB, and 63 plugging records in the box. The radius contains 331 SDR, 386 GWDB, and 57 plugging records, all of which matched corresponding bulk-table IDs. Counts represent source records, not distinct physical wells. SDR and GWDB can overlap, and a plugging record may reference a displayed well report. Explicit cross references are retained; unverified proximity matches are not merged.

The SDR ArcGIS `outFields=*` query returned an upstream error during retrieval. An explicit field list successfully retrieved IDs, locations, and borehole depths. Complete report attributes, yields, water levels, comments, and quality flags were joined from the official bulk tables. Archived API metadata, ID lists, page responses, filtered bulk rows, and original archives remain under `raw/`. `dist/data/provenance.json` records query URLs, source download times, sizes, SHA-256 hashes and whether the retrieval command used a cache. Source timestamps derive from downloaded-file modification times; build time is stored separately.

## Interpretation

Numeric yields come from WellTest and from manually reviewed, explicit flow statements in GWDB Remarks. Method, duration, and date are retained when supplied. Narrative dates retain their actual precision, including year only; dates that cannot be tied clearly to a particular reading remain unknown. Multiple narrative readings remain separate. For SDR, completion date provides context; there is no separately supplied test date in that table. Exact fractions are converted to gpm. Ranges and `+` or `<` values retain their original text and bounds rather than being replaced by an invented midpoint. Approximate flow wording remains visible with its qualifier. Negative or unparseable values are retained as raw text and do not establish production or failure. Source dictionaries define yield in US gallons per minute and depth/water levels in feet.

Dry and closure evidence are independently retained. An official plugging record, explicit historical abandonment, or a source's Plugged or Destroyed classification takes display precedence; a recorded positive yield can coexist with later closure or dry evidence. Capping for possible re-entry alone is not evidence of a dry or abandoned well. Unused does not mean dry. Test holes, monitoring locations, springs, oil/gas holes and surface-water sites retain their distinct types.

The representative water level is the latest dated numeric record marked Publishable in GWDB, or the latest available numeric SDR level. Older observations and methods remain attached. A water level is not a yield test. Negative depth-to-water can indicate water above land surface; source values are retained, not silently clipped.

Quality data availability and a driller's injurious-strata flag are not drinking-water tests. The map does not establish potable water, present operation, sustained yield, or parcel-specific drilling success. Failure reporting and older records are incomplete, and SDR locations are not state-verified. These limitations prevent interpreting a fraction of reported successes as a drilling probability.
