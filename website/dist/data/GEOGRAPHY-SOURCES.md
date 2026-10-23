# Geographic sources

The map uses local geographic files. It does not need a paid map API or remote tile server.

## World outlines

`world.geojson` contains 177 generalized country and administrative features from [Natural Earth Admin 0 countries, version 5.1.1, scale 1:110 million](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/). Made with Natural Earth. The data are [public domain](https://www.naturalearthdata.com/about/terms-of-use/).

This small-scale dataset omits some small countries and islands. Its boundaries follow Natural Earth's de facto representation, not a legal determination by Water Atlas. Selecting or entering a place by name remains important when a place is too small to appear on the map.

## Counties and equivalents

`us-counties.geojson` contains 3,235 county and equivalent features from the [U.S. Census Bureau's 2025 cartographic boundary files](https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.2025.html), scale 1:5 million. This includes U.S. territories. The [official dataset catalog](https://catalog.data.gov/dataset/2025-cartographic-boundary-file-shp-county-and-equivalent-for-united-states-1-5000000) lists [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Credit: U.S. Census Bureau, Geography Division.

Boundaries represent the 2025 geographic vintage, not the retrieval date. These generalized boundaries are suitable for thematic navigation; they are not parcel surveys, rights boundaries, or an assessment of water availability.

Each feature has a five-character Census GEOID in both `id` and `properties.GEOID`. Preserve leading zeros. `name` is the full county/equivalent name; `state`, `stateCode`, `stateFips`, `shortName`, and `country` support readable prompts. `center` is an interior navigation point in longitude, latitude order. Brewster County, Texas is `48043`.

## Processing and checks

The source shapefiles were downloaded on October 23, 2026. Census coordinates were transformed from NAD83 (EPSG:4269) to WGS 84 (EPSG:4326) using PROJ through pyproj. Natural Earth already uses WGS 84. Polygon coordinates were reduced to a 0.0001-degree precision grid with valid topology and outer rings oriented counterclockwise. No additional line simplification was applied.

All 3,412 output features have unique identifiers within their layer and valid, nonempty polygon geometry. Terlingua's reference point falls inside Brewster County. County rings do not cross the antimeridian; multi-island feature bounds may still span both sides of it. Antarctica's outer ring closes across the South Pole. A map renderer should handle these global geographic conventions appropriately.

`geography-sources.json` includes the original download URLs, retrieval dates, source and generated-file SHA-256 hashes, feature counts, coordinate conventions, and limitations. It distinguishes source geography from Water Atlas's separately curated information-coverage records. A county outline by itself makes no claim about the breadth or completeness of research.
