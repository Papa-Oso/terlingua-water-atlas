# Water Atlas community coverage map

The optional public website should show where people have contributed useful water information and help visitors add an area they care about. The website is a static entry point to the project; research and AI work run with each contributor's own resources.

This is a product plan, not a deployed website feature. See the [operating model](OPERATING-MODEL.md) for the cost boundary and the [roadmap](ROADMAP.md) for the underlying tools.

## What a visitor sees

Start with a world map. Keep unindexed areas muted but readable, with a clear label: **Not yet indexed by Water Atlas.** Use color to highlight published regional source collections. Color represents the project's evidence coverage, not water abundance, water quality, drilling potential or legal permission.

Clicking a contributed area opens its source collection, available topics, access instructions, known gaps and dates. Clicking an unindexed area offers **Help map this area** and a prompt the visitor can copy into their own AI tool. A search box can select a place without using the map. Provide a text list of regions and status labels so color is never the only way to understand coverage.

Terlingua is the first example. Its initial label should be **Sources listed / Terlingua snapshot available**, with the snapshot date and Texas-only coverage clearly visible. General-purpose live connectors remain planned. Do not present it as fully connected, fully reviewed or complete. The existing study circle extends into Mexico; the website must not color that portion as covered by the Texas well inventory.

## Show progress by topic

| Label | Required evidence |
| --- | --- |
| Not indexed | No published regional source collection yet; this says nothing about the existence of water or records elsewhere. |
| Sources listed | Named sources and access instructions have been published, with their limitations. |
| Retrieval tested | A named connector or retrieval method succeeded on a recorded date. This is not a promise that it still works. |
| Community reviewed | An identified contributor other than the author reviewed the stated scope, with a review date and notes. |

Apply these labels separately to rivers, groundwater, water quality, rights/access, imagery and water systems. Show the precise sources or claims reviewed; a regional badge cannot establish that every document or topic has been checked. Avoid a single readiness percentage or a permanent "complete" designation.

Freshness is separate: show the latest observation or publication date, last successful check, last review and known failures. A newly checked old report remains an old report. Optional connector health information must name the installation or contributor reporting it and when; a static website does not independently verify that it is live.

Use named regions and explicit coverage descriptions initially. Add geographic footprints only with provenance and an honest scale; county boundaries and approximate search boxes do not establish complete coverage. Overlapping collections can cover the same place or different topics.

## Contribution flow

1. Choose a place and topic, such as river history, groundwater or access documents.
2. Choose a bounded task: find sources, verify access instructions, test a connector, or review an existing collection.
3. Copy a prompt with the selected place, task and expected output. The [starter research prompt](../prompts/EXPLORE-AN-AREA.md) is available now as a plain file.
4. Run it using the visitor's own AI or research tools. Manual contributions are equally welcome; an AI subscription is not required.
5. Inspect the result and submit a small source package or correction through a repository issue or pull request. Mark AI-produced work as an unreviewed draft.
6. Community maintainers review evidence and publish an update. The founder is not required to personally research, review or fund every region, and review availability is not guaranteed.

Useful contributions can be small: one working endpoint, a corrected URL, a clearer access instruction or a documented gap. Finding sources, writing connectors and reviewing evidence are distinct tasks; contributors do not need to do everything before helping.

## Static delivery and costs

The website can render versioned region and source metadata from ordinary files. The prompt builder can substitute the selected area and topic entirely in the visitor's browser. Reviewed repository updates can publish a new coverage snapshot. This needs no Water Atlas account system, hosted AI, central query database or always-running research service.

External map services and original source links retain their own access terms. Static hosting, a domain and an optional external donation link are choices of the website operator. A separately funded hosted edition may later offer additional services, but local research, the catalog and contribution files must remain independently usable.

## First website milestone

Publish a readable world overview with the Terlingua collection, topic-specific status and honest dates; provide region search, an accessible region list, and the **Help map this area** action with a copyable prompt. Verify that an unfamiliar contributor can return one useful, traceable source entry using their own tools. The complete world index and automated channel analysis are later work.
