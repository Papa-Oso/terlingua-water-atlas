# Terlingua Groundwater Atlas

An interactive map of public Texas groundwater records within 50 statute miles of Terlingua Ghost Town, centered at 29.3216° N, 103.6160° W. This is an evidence map, not a drilling-success prediction.

## Open and use

The static application is in `dist/`. Serve that directory over HTTP (for example, `python -m http.server 8765 --directory dist`) and open `http://localhost:8765`. Map backgrounds and regional overlays require internet access. The well-record snapshot is stored locally with the application.

Click a record to inspect reported depth, yield, dates, source evidence and the original report. Filters narrow the displayed records. Enter a parcel's latitude and longitude to compare nearby records. Downloaded records reflect the current filter. Nearby production does not establish that a parcel has the same geology or water supply.

The initial view also shows three curated land-search areas with linked well evidence and asking-price examples checked October 23, 2026. `dist/data/search-areas.json` contains the published shortlist; `listing-research.json` and `area-water-analysis.json` retain the research. The numbered boxes are approximate search windows, not parcel boundaries, aquifer outlines or predictions. Seller listing points and access descriptions are approximate. Prices are asks rather than closed-sale comparables. The former $40,000 Ocotillo Avenue listing was removed in June 2026 and is excluded from the published shortlist.

## Evidence rules

- A positive reported yield establishes only historical production evidence; it does not establish current operation, sustainable supply or drinking-water quality.
- A dry-hole category requires explicit source evidence. Missing yield, zero-valued fields without context, unused status and the existence of a plugging report are not interchangeable with a documented dry hole.
- Plugging or abandonment is tracked separately from water production. A well may have produced water before it was abandoned. Partial plugging back is not necessarily abandonment of the entire well.
- Missing fields remain unknown. Records from different databases are not automatically merged into a single physical well. Springs and other feature types must be read using their source type.
- Texas records do not provide complete coverage of the geographic circle, including its portion in Mexico. Unrecorded wells and unreported failures are absent. Locations can be approximate.
- Well depth, borehole depth and water level describe different things. Read the source evidence and field labels before using a number to estimate drilling costs.

The extracted data, retrieval metadata and source evidence are in `dist/data/`. Reproducible acquisition scripts are in `scripts/`; raw downloads and API responses are retained locally in `raw/` and excluded from source publication because the statewide archives are large.

## Sources

- [TWDB well data and bulk downloads](https://www.twdb.texas.gov/groundwater/data/data-well-reports.asp)
- [Submitted driller reports geographic service](https://services.twdb.texas.gov/arcgis/rest/services/Public/WellReports/FeatureServer)
- [Groundwater database geographic service](https://services.twdb.texas.gov/arcgis/rest/services/Public/TWDB_Groundwater_database/FeatureServer)
- [Plugging reports geographic service](https://services.twdb.texas.gov/arcgis/rest/services/Public/PluggingReports/FeatureServer)
- [TWDB Report 323: Hydrogeology of the Terlingua Area (1990)](https://www.twdb.texas.gov/publications/reports/numbered_reports/doc/R323/R323.pdf)
- [Terlingua location reference, UNT Digital Library](https://digital.library.unt.edu/explore/locations/p01185/)

## Predictive-map investigation

A credible probability map needs a denominator: drilling attempts with known outcomes, including failures. A cluster of recorded producing wells cannot provide that denominator. The sources also span different dates, reporting practices, and reasons for recording a well. A failure fraction in this snapshot must not be presented as the probability that new drilling will fail.

The next analysis should first define three separate outcomes: (1) encountered water, (2) sustained a specified yield during a specified test, and (3) met a stated water-quality requirement. Drilling depth and cost are separate targets. Choose practical thresholds with the prospective parcel and intended use in mind.

Before fitting a model, audit ambiguous records, review source reports, reconcile duplicate physical wells, exclude springs from drilling outcomes, attach dates and location uncertainty, and distinguish dry holes from wells closed for other reasons. Join verified geological units, elevation, slope and drainage distance at each location. Regional geological maps are context at their published scale, not parcel-level subsurface observations.

Compare a simple interpretable baseline with any more complex model. Hold out geographically separated areas and recent records for testing; nearby records in random train/test splits can exaggerate performance. Evaluate calibration as well as discrimination. Report uncertainty and withhold predictions in places unlike the training data. Depth estimates should disclose their sample size and error range.

Until those checks are possible, the most defensible next view is data coverage and neighboring evidence. It must be labeled as evidence density, never drilling likelihood. The current application intentionally provides documented observations and nearby-record comparisons without assigning a probability of finding water.

For a specific property, a useful follow-up is its boundary or coordinates, matched nearby original logs, a current sustained pumping test where available, and current water chemistry. Those observations can change a purchase or drilling assessment much more than an unsupported smooth heat map.
