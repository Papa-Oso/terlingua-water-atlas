# Water Atlas static community website

The public website is entirely static: HTML, CSS, browser JavaScript, local geographic files and a dated Terlingua case-study snapshot. It has no application backend, hosted AI, database, telemetry or required map API. Prompt creation, place lookup and contribution drafting run on the visitor's device. The public site is https://water-atlas.surefawn18.chatgpt.site/.

Serve the site locally with Python 3.11 or newer:

```sh
python -m http.server 8772 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:8772/`. The bundled world map, county search and prompt builder need no external services after the files load. The case-study map optionally fetches backgrounds and geology layers directly from their publishers; source-report links also need internet access.

Deploy `dist/` on any static host or ordinary file server. No build step, npm dependencies, environment variables or paid AI keys are needed. `.openai/hosting.json` is specific to the optional Sites deployment; it is not required to use or host these files elsewhere. Static hosting and domain costs, if any, belong to the chosen operator; no paid infrastructure is provisioned by the application.

## Content and evidence

County colors indicate the depth of the published source collection, never water abundance, water quality or legal rights. Brewster and Presidio counties have organized records within the 50-mile Terlingua study area. Both inventories are partial. The initial highlighted collection is dated October 23, 2026; general live connectors and independent community review are not claimed.

- `dist/data/terlingua.json` supplies case-study facts and county counts.
- `dist/data/world.geojson` and `us-counties.geojson` supply generalized geography; attribution and processing notes accompany them.
- `dist/case-study/` contains the factual map and searchable 353-entry source library.
- `dist/prompt-engine.js` creates plain-text research prompts for the user's own tools.
- `dist/submission.js` and `submission-engine.js` prepare a GitHub issue from pasted findings. Short drafts prefill the issue; longer drafts are copied or downloaded in full. GitHub sign-in is needed only to post. Nothing posts automatically.
- `dist/data/coverage.json` controls county colors, published scope, collection links and contribution provenance. Maintainers change this file after evidence review; submissions do not modify it.
- `dist/prompts/explore-an-area.md` is a standalone contribution guide.

Visit `/#submit` to prepare a contribution. A generated research prompt includes a return link with the area prefilled. Drafts remain in the page until copied, downloaded or handed to GitHub; refreshing loses unsaved text. Findings over the submission limit remain intact for editing or download. See the repository’s `docs/REVIEW-CONTRIBUTIONS.md` for the issue-to-map review process.

The proposed research-package format is a handoff for review, not an automatic importer. Other countries and small places can be entered directly in the prompt builder; county-level geometry is currently provided for the United States only. No donations/payment integration is configured.

## Checks

```sh
node --check dist/app.js
node scripts/test-prompt-engine.cjs
node --check dist/submission.js
node scripts/test-submission-engine.cjs
node scripts/check-coverage.cjs
```

Test browser flows for known and unindexed counties, country search, custom area prompts, topic/task changes, copying and downloading, keyboard operation and small screens. Source code and contribution instructions are published in the [Water Atlas repository](https://github.com/Papa-Oso/terlingua-water-atlas).

Original project code is MIT licensed. Leaflet's BSD license is included in `dist/vendor/`; geography attribution is in `dist/data/GEOGRAPHY-SOURCES.md`. Original source data and reports retain their publisher terms.
