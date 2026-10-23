#!/usr/bin/env python3
"""Inspect or retrieve a bounded selection from the public source catalog.

Python 3.11+, standard library only. Listing is the default; network access
requires --download. Downloads and manifests are local research artifacts and
do not change the published catalog.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import sys
import tempfile
import time
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


PROJECT = Path(__file__).resolve().parents[1]
CATALOG = PROJECT / "research" / "catalog.json"
DOWNLOADS = PROJECT / "downloads"
MAX_BYTES = 60 * 1024 * 1024
MAX_ELAPSED_SECONDS = 60
CHUNK_BYTES = 64 * 1024


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def validate_url(url: str) -> str:
    parts = urlsplit(url)
    if parts.scheme.lower() != "https" or not parts.hostname:
        raise ValueError("Only absolute HTTPS source URLs are supported")
    if parts.username or parts.password:
        raise ValueError("Source URLs must not include credentials")
    if any(ord(char) < 32 for char in url):
        raise ValueError("Source URL contains a control character")
    return url


class HttpsRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, newurl):
        validate_url(newurl)
        return super().redirect_request(request, response, code, message, headers, newurl)


def representation_extension(prefix: bytes, content_type: str) -> str:
    """Name the saved representation by what was returned, not the catalog URL."""
    sample = prefix.lstrip()
    if sample.startswith(b"%PDF-"):
        return ".pdf"
    if sample[:100].lower().startswith((b"<!doctype html", b"<html")):
        return ".html"
    kind = content_type.split(";", 1)[0].strip().lower()
    if kind in {"text/html", "application/xhtml+xml"}:
        return ".html"
    if kind in {"application/json", "application/geo+json"}:
        return ".json"
    if kind in {"text/csv", "application/csv"}:
        return ".csv"
    if kind in {"application/xml", "text/xml"}:
        return ".xml"
    if kind.startswith("text/"):
        return ".txt"
    # A PDF MIME type without the PDF signature may be an error/landing page.
    return ".bin"


def retrieve(record: dict, output_dir: Path, timeout: int = 25) -> dict:
    result = {
        "id": record.get("id"),
        "title": record.get("title"),
        "requested_url": record.get("url"),
        "started_at": utc_now(),
        "reference_sha256": record.get("sha256"),
        "reference_extension": record.get("original_extension"),
        "status": "failed",
    }
    temporary = None
    started = time.monotonic()
    try:
        url = validate_url(record["url"])
        request = Request(url, headers={
            "User-Agent": "TerlinguaWaterAtlas/1.0 (public-record research)",
            "Accept-Encoding": "identity",
        })
        opener = build_opener(HttpsRedirects())
        with opener.open(request, timeout=timeout) as response:
            final_url = validate_url(response.geturl())
            content_type = response.headers.get("Content-Type", "")
            result.update(final_url=final_url, http_status=response.status,
                          content_type=content_type)
            declared = response.headers.get("Content-Length")
            if declared and int(declared) > MAX_BYTES:
                raise ValueError("Source exceeds the 60 MiB per-file limit")
            output_dir.mkdir(parents=True, exist_ok=True)
            digest = hashlib.sha256()
            received = 0
            prefix = b""
            with tempfile.NamedTemporaryFile(dir=output_dir, prefix=".partial-",
                                             suffix=".tmp", delete=False) as destination:
                temporary = Path(destination.name)
                while True:
                    if time.monotonic() - started > MAX_ELAPSED_SECONDS:
                        raise TimeoutError("Source exceeded the 60-second transfer budget")
                    chunk = response.read(CHUNK_BYTES)
                    if not chunk:
                        break
                    received += len(chunk)
                    if received > MAX_BYTES:
                        raise ValueError("Source exceeds the 60 MiB per-file limit")
                    if not prefix:
                        prefix = chunk[:512]
                    digest.update(chunk)
                    destination.write(chunk)
            if not received:
                raise ValueError("Source returned an empty response")
            actual_extension = representation_extension(prefix, content_type)
            identifier = re.sub(r"[^A-Za-z0-9_-]", "-", str(record.get("id", "source")))[:80]
            stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
            filename = f"{identifier}-{stamp}{actual_extension}"
            final_path = output_dir / filename
            temporary.replace(final_path)
            temporary = None
            actual_hash = digest.hexdigest()
            reference_hash = record.get("sha256")
            comparison = ("not_compared" if not reference_hash else
                          "matches_reference" if actual_hash == reference_hash else
                          "different_from_reference")
            result.update(status="downloaded", file=filename, bytes=received,
                          sha256=actual_hash, actual_extension=actual_extension,
                          hash_comparison=comparison)
            if comparison == "different_from_reference":
                result["representation_note"] = (
                    "This response differs from the research snapshot. A live page, "
                    "updated document or report landing page may be a different "
                    "representation; inspect it before using it as evidence."
                )
            expected = str(record.get("original_extension") or "").lower()
            if expected and not expected.startswith("."):
                expected = "." + expected
            if expected and expected != actual_extension:
                result["format_note"] = (
                    f"Catalog reference is {expected}; this response was saved as "
                    f"{actual_extension}. A report viewer may require a fresh export."
                )
    except HTTPError as error:
        result.update(http_status=error.code, error=f"HTTP {error.code}: {error.reason}")
    except Exception as error:
        result["error"] = f"{type(error).__name__}: {error}"
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
        result["finished_at"] = utc_now()
    return result


def nonnegative(value: str) -> int:
    parsed = int(value)
    if parsed < 0:
        raise argparse.ArgumentTypeError("must be zero or greater")
    return parsed


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--group", help="Case-insensitive substring of the source group")
    parser.add_argument("--id", action="append", default=[], dest="ids",
                        help="Exact catalog ID; repeat to select several")
    parser.add_argument("--limit", type=nonnegative, default=5,
                        help="Maximum selected records (default: 5; 0 selects all matches)")
    parser.add_argument("--download", action="store_true",
                        help="Retrieve selected sources into downloads/; otherwise only list")
    args = parser.parse_args(argv)
    try:
        catalog = json.loads(CATALOG.read_text(encoding="utf-8-sig"))
        records = catalog["records"]
        if not isinstance(records, list):
            raise ValueError("catalog records must be a list")
    except (OSError, ValueError, KeyError) as error:
        print(f"Cannot read source catalog: {error}", file=sys.stderr)
        return 2
    selected = [r for r in records
                if (not args.group or args.group.casefold() in str(r.get("group", "")).casefold())
                and (not args.ids or r.get("id") in args.ids)]
    if args.ids:
        missing = sorted(set(args.ids) - {r.get("id") for r in records})
        if missing:
            print("Unknown source ID(s): " + ", ".join(missing), file=sys.stderr)
            return 2
    matches = len(selected)
    if args.limit:
        selected = selected[:args.limit]
    print(f"Selected {len(selected)} of {matches} matching records.")
    for record in selected:
        print(f"{record.get('id')} | {record.get('group')} | {record.get('title')}")
        print(f"  {record.get('url')}")
        if record.get("retrieval_note"):
            print(f"  Note: {record['retrieval_note']}")
    if not args.download:
        print("Dry run: no network requests or files written. Add --download to retrieve.")
        return 0
    if not selected:
        return 0
    DOWNLOADS.mkdir(parents=True, exist_ok=True)
    manifest = DOWNLOADS / "retrieval-manifest.jsonl"
    failures = 0
    try:
        with manifest.open("a", encoding="utf-8") as log:
            for record in selected:
                result = retrieve(record, DOWNLOADS)
                log.write(json.dumps(result, ensure_ascii=False) + "\n")
                log.flush()
                detail = result.get("hash_comparison", result.get("error", ""))
                print(f"{result['id']}: {result['status']} ({detail})")
                failures += result["status"] != "downloaded"
                # Small sequential pause avoids a burst of requests against publishers.
                time.sleep(0.5)
    except OSError as error:
        print(f"Cannot write download manifest: {error}", file=sys.stderr)
        return 2
    print("Retrieval log: downloads/retrieval-manifest.jsonl")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
