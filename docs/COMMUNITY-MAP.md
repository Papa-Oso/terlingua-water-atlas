# Water Atlas community coverage map

The [static community website](../website/dist/index.html) shows where people have contributed useful water information and helps visitors add an area they care about. Research and AI work run with each contributor's own resources.

The first website is implemented as portable static files in `website/dist/`. Run `python -m http.server 8765 --bind 127.0.0.1` from the repository root and open `http://localhost:8765/website/dist/`. See the [operating model](OPERATING-MODEL.md) for the cost boundary and the [roadmap](ROADMAP.md) for the underlying tools still to build.

## What a visitor sees

The world map uses graduated U.S. county colors to show information depth. Unindexed areas stay muted but readable, with a clear label: **Not yet indexed.** Color represents the project's evidence coverage, not water abundance, water quality, drilling potential or legal permission.

Clicking a contributed county shows its dated snapshot, topics, known gaps and links to the well map and source collection. Clicking an unindexed area offers **Help map this area** and a prompt the visitor can copy or download for their own AI tool. County and country search works in the browser; the prompt builder also accepts any named area. A text list of contributed counties and status labels provides another way to explore.

Terlingua is the first example. Brewster and Presidio counties are labeled **Organized records / Partial area**, using the October 23, 2026 snapshot. The records cover parts of those counties within 50 miles of Terlingua, not their entire areas. General-purpose live connectors remain planned; neither county is labeled connected, reviewed or complete. The study circle extends into Mexico, where this Texas well inventory has no coverage.

## Information-depth legend

| Label | Required evidence |
| --- | --- |
| Not indexed | No published regional source collection yet; this says nothing about the existence of water or records elsewhere. |
| Sources listed | Named sources and access instructions have been published, with their limitations. |
| Organized | A dated, structured collection can be explored; its coverage may remain partial. |
| Connected | Named reusable retrieval methods succeeded on recorded test dates. This is not a promise that they still work. |
| Reviewed | An identified contributor other than the author reviewed the stated sources and methods, with a review date and notes. |

The county shading is a navigation aid; topic details show different levels of work within each area. The initial collection includes a well snapshot, indexed studies and water-system sources, some rights/access documents, and gaps for river flow and channel imagery. As collections grow, record progress separately by topic. Show the precise sources or claims reviewed; a regional badge cannot establish that every document or topic has been checked. Avoid a single readiness percentage or a permanent "complete" designation.

Freshness is separate: show the latest observation or publication date, last successful check, last review and known failures. A newly checked old report remains an old report. Optional connector health information must name the installation or contributor reporting it and when; a static website does not independently verify that it is live.

Bundled Natural Earth world geography and U.S. Census county boundaries have source metadata in `website/dist/data/`. County boundaries are navigation areas and do not establish complete coverage. Future collections can use comparable local boundaries or sourced geographic footprints elsewhere; the prompt builder already accepts areas outside the U.S.

## Contribution flow

1. Choose a place and topic, such as river history, groundwater or access documents.
2. Choose a bounded task: find sources, verify access instructions, test retrieval, or review an existing collection.
3. Copy or download the generated prompt with the selected place, topics, task and source limit. The [starter research prompt](../prompts/EXPLORE-AN-AREA.md) is also available as a plain file.
4. Run it using the visitor's own AI or research tools. Manual contributions are equally welcome; an AI subscription is not required.
5. Inspect the result and submit a small source package or correction through a repository issue or pull request. Mark AI-produced work as an unreviewed draft.
6. Community maintainers review evidence and publish an update. The founder is not required to personally research, review or fund every region, and review availability is not guaranteed.

Useful contributions can be small: one working endpoint, a corrected URL, a clearer access instruction or a documented gap. Finding sources, writing connectors and reviewing evidence are distinct tasks; contributors do not need to do everything before helping.

## Static delivery and costs

The website renders versioned region and source metadata from ordinary files. Map navigation, county/country search and prompt generation run entirely in the visitor's browser. Reviewed repository updates publish a new coverage snapshot. This needs no Water Atlas account system, hosted AI, central query database or always-running research service.

External map services and original source links retain their own access terms. Static hosting, a domain and an optional external donation link are choices of the website operator. A separately funded hosted edition may later offer additional services, but local research, the catalog and contribution files must remain independently usable.

## Next contributions

Use the first website to return one useful, traceable source entry with the contributor's own tools. Add a second regional collection and a validated region-package importer, then extend geographic navigation beyond U.S. counties as needed. Live retrieval, automated source checks and channel-change analysis remain later work.
