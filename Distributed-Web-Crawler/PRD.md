# PRD: Distributed Web Crawler

**Owner:** Product/Platform Team
**Status:** Draft — for design review
**Doc type:** System Design Requirements

---

## 1. Problem Statement

We need a service that continuously discovers and downloads web pages at scale, so downstream teams (Search Indexing, Data/ML) can build indexes and datasets. Today we have no crawling infrastructure — this is a greenfield build.

## 2. Goals

- Crawl billions of pages over time, starting from a seed URL set.
- Discover new URLs by parsing links out of fetched pages.
- Store raw page content somewhere downstream systems can consume it.
- Re-crawl pages periodically to catch content changes.
- Be a "good citizen" of the web (respect site owners, don't get us blocked/sued).

## 3. Non-Goals

- We are **not** building the search index or ranking system — just the crawler and raw content handoff.
- We are **not** rendering JavaScript-heavy SPAs in v1 (static HTML only).
- We are **not** supporting authenticated/paywalled crawling in v1.

## 4. Functional Requirements

| #   | Requirement                                                                                               |
| --- | --------------------------------------------------------------------------------------------------------- |
| F1  | Accept a seed list of URLs to start crawling from.                                                        |
| F2  | Fetch page content (HTML) over HTTP/HTTPS.                                                                |
| F3  | Parse fetched pages to extract outbound links.                                                            |
| F4  | Add newly discovered URLs to the crawl queue, avoiding duplicates.                                        |
| F5  | Store fetched content + metadata (URL, fetch time, HTTP status, content hash) for downstream consumption. |
| F6  | Support re-crawling of previously seen URLs on a schedule (freshness).                                    |
| F7  | Respect `robots.txt` rules per domain before fetching.                                                    |
| F8  | Support prioritization — some URLs/domains should be crawled before others.                               |

## 5. Non-Functional Requirements

| #   | Requirement                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ |
| N1  | **Scale:** design for ~5 billion pages, refreshed on average every 7 days.                                                           |
| N2  | **Throughput:** sustain ~10,000 pages fetched/sec at steady state.                                                                   |
| N3  | **Politeness:** no more than 1 request per domain per X seconds (configurable per domain).                                           |
| N4  | **Fault tolerance:** individual fetcher/worker crashes must not lose queued work.                                                    |
| N5  | **Extensibility:** content storage format should support future consumers (indexer, ML pipelines) without redesign.                  |
| N6  | **Avoid traps:** must detect and bail out of infinite crawl loops (e.g., calendar pages, session-id URLs generating infinite links). |
| N7  | **Dedup:** must not fetch identical content redundantly from mirrored/duplicate URLs.                                                |
| N8  | **Observability:** operators need visibility into crawl rate, queue depth, error rate per domain.                                    |

## 6. Constraints & Assumptions

- Average page size: ~500 KB (HTML + inline resources metadata, not images).
- URL frontier will vastly exceed available memory — needs disk/DB-backed queueing at scale.
- Some domains are hostile to crawlers (rate-limit, block, serve garbage) — system must isolate bad domains so they don't stall the whole crawl.
- Legal/compliance requires strict `robots.txt` and crawl-delay adherence — no exceptions.
- DNS resolution at this scale will itself become a bottleneck if not cached.

## 7. Success Metrics

- Pages crawled per day meets target (~860M/day at steady state for N1/N2).
- < 0.1% of crawl budget wasted on traps/duplicate content.
- 99.9% robots.txt compliance.
- Freshness SLA: 95% of pages re-crawled within 7±1 days.

## 8. Open Questions for the Design

These are intentionally unanswered — resolve them in your design:

1. How do you store and scale the **URL frontier** (the queue of URLs to crawl) when it's too big for memory?
2. How do you **prioritize** which URLs to crawl next (freshness vs. discovery vs. importance)?
3. How do you **dedupe** URLs and content efficiently at billions-of-records scale?
4. How do you enforce **per-domain politeness** without a single domain's queue starving others?
5. Where does **DNS resolution + caching** fit in the pipeline?
6. What does the **storage layer** for raw content look like (blob store vs DB, and why)?
7. How do you detect and stop **crawler traps**?
8. How would you **horizontally scale** fetcher workers, and how do they coordinate without stepping on each other?
