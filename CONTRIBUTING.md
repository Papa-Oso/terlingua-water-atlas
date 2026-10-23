# Contributing

Help make Water Atlas useful to people and AI tools that need traceable water information. Contributions from local residents, utility operators, hydrogeologists, water engineers, data researchers and software developers are welcome. Terlingua is the first case study, and source/connector improvements should be reusable elsewhere.

## Share what you found

1. Use **Help map this area** on the [Water Atlas website](https://water-atlas.surefawn18.chatgpt.site/) to prepare a prompt. Run it with your own AI or research tools; manual research is equally welcome.
2. [Submit findings](https://water-atlas.surefawn18.chatgpt.site/#submit) by naming the area and pasting your result. Include original source links and dates where possible, and disclose AI assistance. A few useful sources are enough.
3. Open the prepared GitHub issue, check its public contents and post it. Short submissions can be prefilled. For longer results, copy the prepared text into the issue or download it for later. GitHub requires an account to post; the website does not require an account, API key or paid AI service.

You can also use the [County or area research issue template](https://github.com/Papa-Oso/terlingua-water-atlas/issues/new?template=county-research.md) directly. No coding, repository fork or pull request is required to suggest sources. Do not include private information or credentials.

Submissions start as **unreviewed drafts**. They do not automatically change county colors. Maintainers check the evidence, add accepted sources and coverage metadata in a pull request, and publish a new static website version. Review availability is not guaranteed. The [review guide](docs/REVIEW-CONTRIBUTIONS.md) explains this process and the difference between accepting a source and awarding the map's **Reviewed** level.

## Independence and operating costs

Follow the [operating model](docs/OPERATING-MODEL.md): Water Atlas must remain useful without any service operated or funded by its founder.

- Make core functionality run locally with portable source catalogs and exports. Project-operated accounts, gateways, subscriptions and databases must be optional.
- Keep credentials with the operator. Paid requests use their explicitly configured provider and budget; never fall back to a maintainer's key or account.
- Make network activity and cost implications visible. Background schedules require explicit setup, clear pause/removal instructions and bounded work. Installation alone must not create an ongoing job.
- Use publisher APIs, conditional/incremental requests, shared local caches and ordinary code where practical. Run AI only when the operator requests or configures it; preserve a useful non-AI path.
- Keep local queries, credentials and caches local by default. Do not add mandatory telemetry or central uploads.
- Treat a donation-supported website or hosted edition as a separately operated option. Its usage limits or funding ending must not disable a local installation.

For connector or AI changes, explain which machine runs the work, which accounts can incur charges, how retrieval is bounded, where data is stored, and what happens when a source or optional service is unavailable. See the [roadmap](docs/ROADMAP.md) for planned acceptance checks.

## Useful contributions

For a new area, start with the [area-research prompt](prompts/EXPLORE-AN-AREA.md) and the [community coverage guide](docs/COMMUNITY-MAP.md). A few well-supported sources are useful; you do not need to build every connector. AI-generated packages are drafts until reviewed. An issue or pull request can document unverified access or missing evidence without claiming the area is complete.

- Correct a location, measurement, source link or evidence classification.
- Find a missing public report or a more recent version of an existing source.
- Reconcile records that may refer to the same physical well while preserving their original identifiers.
- Review geological interpretation, pumping-test evidence or water-use accounting.
- Improve the map's accessibility, reliability or documentation.

For a substantial change, open an issue describing the problem, proposed result and supporting evidence before implementing it. Small corrections can go directly into a pull request.

## Evidence changes

Include the publisher, public source URL, document or measurement date, retrieval date, and the page, table or record identifier supporting the change. Explain what the evidence establishes and what remains uncertain. Keep observations, interpretations and proposed next steps distinct.

Preserve original values and units alongside normalized values when practical. A blank field is not zero. A reported yield is not a sustainable yield. A plugging record is not automatically a dry hole. A budget, agenda or proposed schedule is not evidence of completed construction. Corrections should retain enough provenance for another person to reproduce the decision.

Link to third-party reports and record their metadata rather than adding complete documents unless redistribution permission has been established. Do not add private correspondence, credentials, session data or unnecessary personal information. Public availability does not by itself establish permission to relicense a document.

## Code and data checks

Run the local map from the repository root:

```sh
python -m http.server 8765 --bind 127.0.0.1 --directory groundwater-map/dist
```

For changes to the well snapshot, run:

```sh
python groundwater-map/scripts/audit_snapshot.py
```

After changing published well data, the source catalog or findings, regenerate and validate the API snapshot:

```sh
python scripts/build_api.py
python scripts/build_api.py --check
python scripts/check_repository.py
```

See the [maintenance method](docs/MAINTENANCE.md) for source discovery, retrieval, review and publication, and the [API instructions](docs/API.md) for the public interface. Generated API files should change with their reviewed source inputs.

For contribution-flow or county-coverage changes, run:

```sh
node --check website/dist/submission-engine.js
node --check website/dist/submission.js
node website/scripts/test-submission-engine.cjs
node website/scripts/check-coverage.cjs
```

The [maintainer review guide](docs/REVIEW-CONTRIBUTIONS.md) covers evidence acceptance, county metadata and the separate static publication step. Automated checks do not approve research or award a coverage level.

For interface changes, check the map, filters, record details, table and export in a browser. Keep source attribution visible. Explain the validation performed in the pull request, along with any known limitations. Do not label a cached rebuild as a new retrieval; preserve the actual snapshot date.

## Research standards

Any proposed prediction needs a defined outcome, validated observations, geographically separated evaluation and an honest uncertainty assessment. Well density or a fraction of recorded producing wells must not be presented as a probability of drilling success. Preserve disagreements and missing information where the evidence does not settle them.

Focus discussion on evidence and community water needs. A contribution may identify an unanswered question without supplying a final engineering design. Claims about particular people or organizations should remain factual, relevant and supported.

By contributing original code or documentation, you agree to make it available under this project's MIT license. Identify third-party material and its applicable terms separately, as described in [THIRD_PARTY.md](THIRD_PARTY.md).
