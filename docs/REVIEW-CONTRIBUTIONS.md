# Review a county contribution

Visitors can [prepare a GitHub submission on the website](https://water-atlas.surefawn18.chatgpt.site/#submit) or use the [research issue template](https://github.com/Papa-Oso/terlingua-water-atlas/issues/new?template=county-research.md). They post the issue themselves. An issue is an unreviewed suggestion, not a published source collection or a map update.

## From issue to map

1. **Check the place and scope.** Confirm the five-digit U.S. county FIPS against `website/dist/data/us-counties.geojson`. Ask for clarification in the issue if the location or claimed coverage is ambiguous. Research about another country, a watershed or part of a county is welcome; preserve that scope. The current county shading only supports U.S. county boundaries.
2. **Check the original evidence.** Open the publisher's links and verify the particular records or claims being accepted. Record publication/observation dates separately from access and review dates. Preserve unknown values, conflicting reports and failed access. AI output and an accessible URL alone do not verify a claim. Accept a useful subset when the rest cannot be supported.
3. **Publish the accepted collection in a pull request.** Add source metadata and access instructions to an appropriate collection in the repository. Provide a browsable static collection under `website/dist/` or a public HTTPS collection URL. Retain publisher, source URL, dates, identifiers, scope and limitations; link to reports rather than copying them without permission. Reference the submission issue in the pull request and explain what was accepted or left unresolved.
4. **Update the coverage registry in that pull request.** Add or revise the county in `website/dist/data/coverage.json`. Link the collection and submission issue, choose the supported level, and describe the actual coverage. Do not change a county color just because an issue arrived. A new entry starts at the lowest level justified by its published contents.
5. **Run the checks and review the preview.** Use the commands below, then check the county's color, details, collection link and contribution buttons in a browser. CI checks file structure and consistency; a person checks the evidence. Merge only after the required review.
6. **Deploy the static website separately.** Publish the reviewed `website/dist/` files using the chosen static host. A merge does not deploy the website: no automatic publication workflow is configured. Verify the live county panel, then link the published result from the issue and close it when resolved. No application backend, hosted AI or new scheduled job is needed.

If a submission cannot yet support a published change, explain the missing evidence in the issue. Avoid promising a review deadline. Accepting a source does not certify water availability, drinking-water safety, sustainable yield or legal access.

## Coverage registry fields

The registry has `schema_version: 1`, an `updated_at` date and a `counties` array. Use the two existing county entries as structural examples, while preserving their historical scope and dates.

| Field | What to record |
| --- | --- |
| `fips`, `name`, `state`, `country` | The county's five-digit identifier and labels matching the bundled geography. |
| `level` | `sources_listed`, `organized`, `connected` or `reviewed`, using the evidence requirements below. |
| `published_at` | The collection's actual publication date, in `YYYY-MM-DD` form. This is not an observation date or a claim of live data. |
| `coverage` | `partial` or `county`. Use `partial` unless the stated collection covers the county. |
| `summary`, `scope` | A short description and the precise area, topics, dates and gaps represented. Whole-county geometry does not imply whole-county evidence. |
| `collection_url` | A path relative to the website root, or an HTTPS URL, where visitors can read the accepted collection. |
| `evidence_urls` | Original public HTTPS sources supporting the collection. |
| `topics` | Topic entries with `name`, a short `label`, and `status` of `available` or `needed`. |
| `source_issue` | The actual `https://github.com/Papa-Oso/terlingua-water-atlas/issues/NUMBER` submission URL. Required for new counties. |
| `metrics` | Optional documented counts, such as `source_records` and `water_well_records`; omit unsupported counts. |

The original Brewster and Presidio entries use `origin: "terlingua_case_study"` because they predate this submission flow. Do not copy that exception into a new county.

## Choosing a level

| Map level | Evidence needed before publication |
| --- | --- |
| Sources listed | Published source names, links and usable access instructions, with limitations. |
| Organized | A dated, structured collection that visitors can explore. Partial coverage is still possible. |
| Connected | The organized collection plus named reusable retrieval methods tested successfully on recorded dates. Add `connector_tests` with `name`, `tested_at` and `evidence_url` for each reported test. A historical test does not establish current availability. |
| Reviewed | The connected requirements plus an independent contributor's review of the stated sources and methods. Add `review` with `reviewer`, `reviewed_at`, `notes` and `evidence_url`. Notes must say what was checked and what was outside the review. |

An ordinary maintainer acceptance check does **not** automatically award **Reviewed**. That level requires its additional published evidence and an identified reviewer other than the original author. Neither **Reviewed** nor whole-county scope means every water topic is complete. Source freshness remains separate from information depth.

## Validate and preview

From the repository root:

```sh
node --check website/dist/app.js
node --check website/dist/submission-engine.js
node --check website/dist/submission.js
node website/scripts/test-prompt-engine.cjs
node website/scripts/test-submission-engine.cjs
node website/scripts/check-coverage.cjs
python scripts/check_repository.py
python -m http.server 8765 --bind 127.0.0.1 --directory website/dist
```

Open `http://127.0.0.1:8765/`. The coverage check catches invalid county identities, malformed metadata and unsupported level structure; it cannot determine whether a source is true or a reviewer did the claimed work. If source catalog or well snapshot inputs also changed, follow the additional [maintenance checks](MAINTENANCE.md).
