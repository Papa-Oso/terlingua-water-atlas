# Contributing

Help make the evidence easier to check and the research easier to reproduce. Contributions from local residents, utility operators, hydrogeologists, water engineers, data researchers and software developers are welcome.

## Useful contributions

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
python -m http.server 8765 --directory groundwater-map/dist
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

For interface changes, check the map, filters, record details, table and export in a browser. Keep source attribution visible. Explain the validation performed in the pull request, along with any known limitations. Do not label a cached rebuild as a new retrieval; preserve the actual snapshot date.

## Research standards

Any proposed prediction needs a defined outcome, validated observations, geographically separated evaluation and an honest uncertainty assessment. Well density or a fraction of recorded producing wells must not be presented as a probability of drilling success. Preserve disagreements and missing information where the evidence does not settle them.

Focus discussion on evidence and community water needs. A contribution may identify an unanswered question without supplying a final engineering design. Claims about particular people or organizations should remain factual, relevant and supported.

By contributing original code or documentation, you agree to make it available under this project's MIT license. Identify third-party material and its applicable terms separately, as described in [THIRD_PARTY.md](THIRD_PARTY.md).
