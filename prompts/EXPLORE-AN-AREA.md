# Help add an area to Water Atlas

Copy the prompt below into an AI tool you control and replace the bracketed values. Start with one area, one or two topics and at most ten sources. The prompt produces a contribution draft; it does not require a Water Atlas account or hosted AI service. People can use the same instructions for manual research.

The proposed contribution format below is a research handoff, not an implemented importer or a replacement for the existing Terlingua snapshot API. See [CONTRIBUTING.md](../CONTRIBUTING.md) before submitting changes.

---

Help me prepare a small, evidence-based source collection for the open-source Water Atlas project.

Area: [PLACE, COUNTRY, AND AN EXPLICIT AREA DESCRIPTION]

Topics: [CHOOSE ONE OR TWO: rivers and flow; groundwater; water quality; rights and physical access; river imagery and channel history; water systems]

Task: [FIND SOURCES / VERIFY EXISTING ACCESS INSTRUCTIONS / TEST ONE RETRIEVAL METHOD / REVIEW AN EXISTING COLLECTION]

Existing collection or source links, if any: [LINKS OR NONE]

Limit: at most ten relevant sources. Prefer public agencies, original datasets, research institutions and official records. Keep all work on my resources. Do not purchase access, provision hosting, create paid accounts, install a recurring job, publish changes or contact people as part of this prompt. If a step needs resources or access I have not configured, describe the gap instead.

The objective is to help another person or AI find and retrieve water information for this place. Establish what sources exist, what each covers, how to use them, and what remains unknown. Do not infer that a place lacks water or legal rights because this search finds no records.

Work as follows:

1. Inspect relevant publisher catalogs and original sources. If browsing or retrieval tools are unavailable, explicitly report that limitation; do not claim current verification from memory. Use the actual check date and preserve publication and measurement dates separately.
2. Avoid duplicating sources already in the supplied collection. Record meaningful corrections or new access methods. An individual report and its agency's catalog may both be useful, but explain their different roles.
3. Prefer documented APIs, GIS services, CSV downloads and public document indexes. When only an interactive portal or records request is available, describe that access path accurately. Do not claim an API exists because a webpage displays data.
4. Retrieve only a small relevant sample when the tools and source permit it. Respect publisher request limits; avoid whole-country archives, large imagery downloads or repeated unchanged requests. Record failures honestly. Never put credentials into returned files or URLs.
5. Separate source discovery, successful access, a tested retrieval method and substantive review. A successful HTTP response alone is not proof that the expected data was returned. Preserve provisional-data flags, units, source IDs and uncertainty where present.
6. For rights/access, keep water withdrawal authorization, groundwater rules, land access/easements, public recreation access and utility service distinct. Link governing documents and the authority's recorded dates/status. Do not determine ownership, permission or transferability from a map point.
7. For river history, distinguish dated water extent, water level and mapped channel position. Note image dates, resolution, clouds and geographic coverage where known. A changed wet outline alone is not proof that a channel or legal boundary moved.

Return a small proposed package with these files, or clearly marked equivalent sections if you cannot write files:

**region.json** — An object containing `id`, `name`, `country`, `area_description`, `topics`, `coverage_notes`, and `geometry`. Use `geometry: null` unless an appropriately sourced geographic footprint is available. If a footprint is supplied, include `geometry_source_url`, `geometry_date` and `geometry_limitations`; never invent a precise boundary from a place name. Describe partial or cross-border coverage explicitly.

**sources.json** — An array of source records. For each, provide:

- `id`, `title`, `publisher`, `url`, `topics`, `geographic_coverage` and `coverage_source_url`.
- `access_method` (API, GIS service, file, document index, interactive portal or records request), `access_instructions`, `formats`, `documentation_url`, `terms_url`, and any known access constraints.
- `publication_date`, `latest_observation_date`, `checked_at`, `retrieved_at`, `reviewed_at` and `expected_update_cadence`. Use ISO-formatted dates/timestamps where verified; keep unknown fields `null`. Mark cadence as publisher-documented or an estimate.
- `verification_status` (`discovered`, `access_checked` or `retrieval_tested`), `verification_notes`, `review_status: "unreviewed_draft"`, `limitations`, and any `related_source_ids`.
- A short `evidence` entry naming the supporting page, record or metadata field and its original URL. If you actually retrieved a sample, include the request, source timestamp, response format and a brief result; otherwise leave the sample absent. Compute hashes only for bytes actually retrieved.

**README.md** — A short plain-English overview of the most useful sources, how to access them, missing information, conflicting evidence and the next small task a contributor could do. State which parts were AI-assisted and which checks were actually performed. Do not mark the package community-reviewed.

If testing a connector, include a bounded reproducible request or short script with its dependencies, expected output and any operator-supplied credential requirement. Use placeholders for credentials. Explain which machine runs it and any potential usage charges. Do not claim that a proposed script has been tested unless you ran it successfully.

Finish with a checklist of what a human reviewer should verify before proposing the package to the project. Produce the draft and stop; I will decide whether and how to submit it.
