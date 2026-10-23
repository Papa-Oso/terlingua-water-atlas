# Water Atlas operating model

**Water Atlas must remain useful without any service operated or funded by its founder.**

Water Atlas is open-source software and a shared directory of water-information sources. People run it with resources they control. Terlingua is the first test case; the same approach should work in other places.

## What is shared

The public core contains code, connector definitions, access instructions, source metadata, documentation and small reviewed examples. The directory describes where information lives, what it covers, how to retrieve it and any known access limits. It can be copied, downloaded and used independently of the project website.

Publishers remain the primary home for their reports, measurements, imagery and GIS services. An installation may keep selected local caches, extracted text and evidence snapshots, subject to source terms. It does not need to mirror every upstream archive. Source attribution, dates and limitations travel with retrieved information.

## Who runs it and pays

| Activity | Responsibility |
| --- | --- |
| Browse a downloaded catalog or snapshot | The user's device; no paid AI account required |
| Retrieve or refresh upstream information | The user's installation and network; any publisher fees use the user's account |
| Ask AI to search or explain evidence | Optional; uses the user's chosen AI provider/account or local model |
| Run scheduled checks or heavier GIS analysis | The user or organization enabling those jobs |
| Operate a future public hosted instance | That instance's operator, within its separately funded budget |

An installation never falls back to a founder's account, API key or billing arrangement. Paid operations must be explicitly configured by the operator. Secrets stay out of source control and are sent only to the configured service that needs them. The core must not depend on a central proxy, project login, hidden telemetry or a founder-operated database.

## Current information without a central service

The planned default is an explicit refresh when someone needs information, with a visible local cache. Optional schedules must be installed and enabled by that user, be off by default, and expose their frequency, request limits, failure state and stop control. Local background checks stop when the machine is off; someone choosing continuous operation supplies the machine and its operating costs.

A fresh check is not necessarily a fresh observation. Keep these dates separate: when the event or measurement occurred, when the publisher issued it, when the installation checked or retrieved it, and when it was reviewed. Display stale data and failed checks honestly. Respect upstream access terms, rate limits and unavailable endpoints.

## Website and donations

An optional static website can explain the project, publish documentation and examples, link to downloads and accept donations through an external provider. That site needs no Water Atlas application backend. Domain, static hosting and donation-provider costs, if any, are choices of the website operator rather than dependencies of the software.

Donations are voluntary and do not unlock the open-source core. They may support maintenance, outreach or a clearly described operating budget. No donation account, payment integration or new hosting service is established by this document.

A hosted version can be added later when funded. It must have its own operator, disclosed resource limits and enforced spending controls. Service pauses or capacity is reduced when that allowance is exhausted; costs never automatically transfer to the founder. The downloadable version continues working independently.

## Status and design checks

Today the repository provides a local map, source library, reviewed snapshot API and retrieval/build scripts. General-purpose connectors, an AI research interface and scheduled source monitoring are planned; they are not active services.

Before adding a feature, check:

- Can someone use or replace it without a project-operated service?
- Who explicitly authorized any paid usage, and whose account pays?
- Can the operator limit, inspect and stop its network requests and jobs?
- Are local data, source definitions and evidence exportable?
- Does the interface distinguish source freshness, retrieval success and human review?

See the [first-version roadmap](ROADMAP.md) for milestones and the [maintenance guide](MAINTENANCE.md) for the current snapshot workflow.
