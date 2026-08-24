# PRD: URL Shortener + Analytics

**Owner:** Product/Platform Team
**Status:** Draft — for design review
**Doc type:** System Design Requirements

---

## 1. Problem Statement

Users want to convert long URLs into short, shareable links. Beyond just redirecting, we want to give link owners visibility into how their links are performing (clicks, geography, referrers) — this is the differentiator over a plain shortener.

## 2. Goals

- Generate a short URL for any given long URL.
- Redirect short URL → original long URL reliably and fast.
- Track click events per short URL (who/when/where, at a coarse level).
- Let link owners view analytics for their links.
- Support custom aliases (user-chosen short codes) as an option.

## 3. Non-Goals

- No user-facing link editing after creation (v1: create + view only, no update).
- No real-time streaming dashboards — near-real-time (a few minutes delay) is fine for analytics in v1.
- No malware/spam URL scanning in v1 (flag as future work).

## 4. Functional Requirements

| # | Requirement |
|---|---|
| F1 | Accept a long URL and return a short URL. |
| F2 | Support optional custom alias; reject if already taken. |
| F3 | Redirecting a short URL sends the user to the original long URL (HTTP redirect). |
| F4 | Every redirect/click is recorded as an analytics event. |
| F5 | Link owner can view aggregate stats for a link: total clicks, clicks over time, top referrers, top countries. |
| F6 | Short URLs can optionally expire after a set date. |
| F7 | Support link deactivation (owner can disable a link without deleting history). |

## 5. Non-Functional Requirements

| # | Requirement |
|---|---|
| N1 | **Scale (writes):** ~100M new short URLs created per month. |
| N2 | **Scale (reads):** ~10:1 read:write ratio — redirects vastly outnumber creations, expect ~1B redirects/month. |
| N3 | **Latency:** redirect must resolve in <100ms at p99 — this is the user-facing critical path. |
| N4 | **Analytics latency:** dashboard data can lag up to a few minutes behind real clicks (not on the critical path). |
| N5 | **Availability:** redirect service should target 99.99% uptime — a down shortener breaks every link ever shared. |
| N6 | **Uniqueness:** short codes must never collide across the whole system. |
| N7 | **Durability:** URL mappings must not be lost — this is user-generated data with no other source of truth. |
| N8 | **Read-heavy optimization:** redirect path should be optimized independently from the analytics write/aggregation path — they have very different latency/consistency needs. |

## 6. Constraints & Assumptions

- Short code length target: 7 characters (base62) — should comfortably cover years of URL volume without collision.
- Analytics data can be eventually consistent; redirect mapping data should not be.
- Click events carry PII-adjacent data (IP → rough geo) — must be aggregated/anonymized for the analytics view, not exposed raw.
- Traffic will be spiky — a single viral link can spike redirect traffic on one short code far above baseline.

## 7. Success Metrics

- Redirect p99 latency < 100ms.
- Zero short-code collisions in production.
- Analytics dashboard reflects new clicks within 5 minutes.
- 99.99% redirect service uptime.

## 8. Open Questions for the Design

Resolve these in your design:

1. How do you **generate short codes** — and how do you guarantee uniqueness at scale without a bottleneck?
2. Where does **caching** fit for the redirect path, and what's the cache invalidation story (e.g., link deactivated/expired)?
3. How do you keep the **redirect path fast** while **analytics writes** happen on every single click, without one slowing down the other?
4. What does the **analytics pipeline** look like end to end — from a click event to an aggregated number on a dashboard?
5. How do you handle a **single viral short link** getting a huge, disproportionate spike in traffic (hot key problem)?
6. What data store(s) do you use for the URL mapping vs. the raw click events vs. the aggregated analytics — and why different stores (if they are different)?
7. How do you avoid **PII leakage** in analytics while still giving useful geo/referrer breakdowns?

---

*Next step: produce a high-level architecture diagram (boxes + arrows) covering the components needed to satisfy the requirements above.*