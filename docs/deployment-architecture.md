# BBQ Comparison App — Deployment Architecture

## Overview

The BBQ Comparison system uses a static-first architecture optimized for speed and reliability.

Core components:

Customer App (PWA)
Manager App (PWA)
Published JSON datasets
Cloudflare infrastructure

---

## Customer App Deployment

The customer comparison app is deployed as a **Cloudflare Pages project**.

Characteristics:

* static React build
* optimized for showroom performance
* reads published JSON datasets
* never connects directly to Google Sheets
* aggressively cacheable

Primary responsibilities:

* browsing products
* comparison UI
* product detail pages
* recommendation quiz
* showroom touchscreen experience

---

## Manager App Deployment

The manager backend app is deployed as a **separate Cloudflare Pages project**.

Characteristics:

* internal admin interface
* product review tools
* publishing workflows
* editing tools
* future authentication support

Primary responsibilities:

* product editing
* image review
* activation / deactivation
* publishing updated datasets

---

## JSON Data Hosting

Published datasets are stored in **Cloudflare R2**.

Example structure:

/data/brands.json
/data/families.json
/data/variants.json
/data/specs.json
/data/assets.json
/data/recommendationRules.json
/data/manifest.json

The customer app reads these datasets directly.

---

## Cloudflare Pages Functions

Pages Functions will later handle:

* publishing endpoints
* admin-only operations
* dataset validation
* Shopify integrations
* image management

The customer browsing experience should not rely on runtime APIs for normal operation.

---

## Performance Strategy

The architecture prioritizes:

* static assets
* CDN caching
* minimal API usage
* lightweight JSON datasets

This ensures fast load times on showroom devices.
