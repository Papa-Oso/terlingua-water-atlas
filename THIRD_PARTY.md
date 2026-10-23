# Third-party materials and attribution

The MIT license covers original project code and documentation. It does not change the rights or terms attached to source datasets, quoted report text, third-party software, map tiles, linked publications or agency marks. This project does not claim government affiliation or endorsement.

## Bundled software

**Leaflet 1.9.4** is included in `groundwater-map/dist/vendor/`. It is copyright 2010–2023 Volodymyr Agafonkin and copyright 2010–2011 CloudMade, under the BSD 2-Clause License. The complete notice is retained in [`LEAFLET-LICENSE.txt`](groundwater-map/dist/vendor/LEAFLET-LICENSE.txt). See [Leaflet](https://leafletjs.com/).

## Texas Water Development Board data

The groundwater snapshot derives from Texas Water Development Board (TWDB) geographic services and bulk downloads:

- [Well data and bulk downloads](https://www.twdb.texas.gov/groundwater/data/data-well-reports.asp)
- [Submitted Drillers Reports](https://services.twdb.texas.gov/arcgis/rest/services/Public/WellReports/FeatureServer)
- [Groundwater Database](https://services.twdb.texas.gov/arcgis/rest/services/Public/TWDB_Groundwater_database/FeatureServer)
- [Plugging Reports](https://services.twdb.texas.gov/arcgis/rest/services/Public/PluggingReports/FeatureServer)

TWDB's [site policy](https://www.twdb.texas.gov/policies/site/index.asp), under Copyright Policy, permits copying and distribution of its information with appropriate credit. This project credits TWDB, retains source references, and distinguishes its normalized fields and evidence classifications from original records. The source-derived data and quoted evidence are not relicensed under MIT. Follow the source policy and any item-specific notices when reusing them.

## Map backgrounds and regional layers

The app requests these services over the internet; their tiles are not bundled in this repository:

| Service | Attribution and terms |
| --- | --- |
| OpenStreetMap standard tiles | © OpenStreetMap contributors; [copyright and database license](https://www.openstreetmap.org/copyright), [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) |
| Esri World Topographic Map | Esri and the service's credited contributors, including USGS and NOAA; consult the [service metadata](https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer) and applicable provider terms |
| TWDB regional geology and aquifers | Texas Water Development Board and the contributors identified by each layer; [TWDB data services](https://www.twdb.texas.gov/mapping/data-services.asp), [Geologic Atlas of Texas](https://www.twdb.texas.gov/groundwater/aquifer/GAT/index.asp) |

Keep these attributions visible when adapting the map. A public tile endpoint is not permission for unrestricted bulk downloads or offline redistribution.

## Research catalog and publications

The research catalog links to material published by Study Butte Water Supply Corporation, Brewster County, Brewster County Groundwater Conservation District, TWDB, other agencies and identified third parties. Publisher and source URL remain attached to each record. Reports, financial filings, presentations, website text and maps retain their original rights; this repository does not apply a blanket public-domain designation to them.

The public release includes catalog metadata and project-authored findings rather than the complete downloaded report archive. Downloading an original from a catalog link does not change its copyright or reuse terms. Check the publication and publisher's terms before redistributing it.

If a credit, source right or license is missing or incorrect, open an issue identifying the affected file and original publication so it can be corrected.
