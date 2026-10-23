# Water Atlas first-version roadmap

Build a local tool that helps people and AI find water information, retrieve it from its publisher, and see how current it is. Terlingua and the nearby Rio Grande are the first test area. The [operating model](OPERATING-MODEL.md) is a requirement throughout: the core works without a service operated or funded by the founder.

## Starting point

The repository already contains a Terlingua well map, a source catalog, reviewed findings, static API exports and scripts for selected downloads and snapshot builds. These are useful fixtures and examples. They are not a live water service, a general connector system or an AI assistant. The milestones below describe work still to build.

## 1. Make the source directory portable

Define a small documented source format with stable IDs, publisher, topics, geographic coverage, access URLs, API or download instructions, formats, terms, expected publishing cadence and known limitations. Geographic coverage can be an area or named feature rather than a precise point. Include discovery-only sources without claiming they were retrieved or reviewed.

Keep publication, observation, check/retrieval and review dates distinct. Put an installation's check history and credentials in local state; do not pretend one person's successful check is continuous public monitoring. Preserve shared reviewed versions separately.

**Acceptance:** someone can search the downloaded directory by place and topic without an AI account, follow the access instructions, and export the selected source records. Add a second area's sample sources without changing the core schema.

## 2. Implement four bounded connector examples

| Connector | Terlingua test question | First-version boundary |
| --- | --- | --- |
| River conditions | What is the latest published flow or level at relevant stations, and how has it changed? | Preserve station IDs, units, observation times, qualifiers and gaps; verify each station's geographic relevance. |
| Wells and GIS | What documented wells and groundwater records cover this area? | Retain source identifiers, dates and uncertain locations; reported production is not a current supply guarantee. |
| Rights, rules and access | Which authorities and documents govern water use or physical access here? | Index withdrawal permissions, groundwater rules, easements and public access separately; distinguish proposals, issued records and known effective dates. |
| River imagery and channel history | Which dated images or channel datasets can help compare this stretch over time? | Search and retrieve selected metadata or scenes; distinguish water extent from channel movement. Begin with reviewed comparisons, not automatic conclusions. |

Each connector should offer discovery where supported, bounded retrieval, provenance and clear errors. It must record unsupported operations rather than silently guessing. Some sources will remain manual access instructions because a dependable public interface is unavailable. Border and cross-jurisdiction questions must show coverage gaps.

**Acceptance:** each working connector retrieves a small real example directly from its publisher, preserves enough provenance to repeat it, and handles a failed request without replacing cached evidence with an empty result. The user can inspect what will be requested and cap the work.

## 3. Add local refresh and change tracking

Refresh on demand, reuse recent local responses, and avoid reprocessing unchanged content. Separate checking known URLs from discovering newly published records. Show whether an apparent change is new evidence, a revised file, a removed listing or merely a retrieval failure. Keep selected earlier versions where permitted.

Offer optional user-installed scheduling only after manual refresh works. Schedules start disabled, run on the user's chosen machine and have explicit request limits, retry limits, logs and a stop command. No project-wide background service is required.

**Acceptance:** a changed sample is detected, an unchanged sample is skipped, and a failed check leaves the prior evidence available with a visible warning. Scheduling can be enabled and removed without a cloud account, and the documentation explains that checks stop when its machine is off.

## 4. Let AI use the same evidence tools

Expose documented local operations for finding sources, fetching selected evidence, comparing versions and reporting status. Add an optional AI interface that uses the operator's configured provider or local model. Plain search and retrieval remain usable without AI.

Answers cite source records and relevant dates, distinguish observations from interpretation, and state missing evidence. Do not infer permission from a location, current production from an old well test, or a river boundary from a water outline. Treat retrieved documents as evidence, not instructions to execute actions or disclose credentials.

**Acceptance:** a user can ask a Terlingua water question, inspect the evidence behind the answer and reproduce its retrieval. With no AI configuration, the same source search and downloads still work. Paid requests cannot use a project-owned fallback key.

## 5. Add a simple local place-and-time view

Combine source search, a map and a timeline. Let someone select an area, discover covering sources, compare available dates and open original records. Show coverage and resolution limits. Store small metadata and selective excerpts locally; fetch large imagery or detailed GIS data only when requested.

**Acceptance:** a new user can investigate one location, find a measurement, locate applicable rights/access documents, compare two available dates and identify unresolved gaps. They can export their source list and local evidence references.

## Release boundary

Version one succeeds when this workflow runs on a user's computer with documented resource controls. It does not promise exhaustive coverage, automatic legal determinations, real-time monitoring while offline, or a funded public AI service. Donation setup, founder-operated hosting, full imagery archives and continuous global monitoring are outside this release.

Keep the [current maintenance workflow](MAINTENANCE.md) available while these capabilities are developed. Preserve dated Terlingua snapshots so new connector outputs can be checked against known examples rather than silently replacing the research history.
