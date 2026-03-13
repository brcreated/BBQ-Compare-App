# BBQ Comparison App — Data Architecture

## Source of Truth

All product data originates in **Google Sheets**.

The apps **never read Google Sheets directly**.

Data flow:

Google Sheet
→ Export process
→ JSON datasets
→ Cloudflare R2
→ Customer App

---

## Published JSON Datasets

The system publishes the following datasets:

* brands.json
* families.json
* variants.json
* specs.json
* assets.json
* recommendationRules.json
* manifest.json

---

## Manifest File

`manifest.json` provides dataset metadata.

Example contents:

* publish version
* publish timestamp
* dataset versions
* asset base URL

The customer app loads the manifest first to determine dataset freshness.

---

## Data Design Rules

1. Entities use **IDs and references**.
2. Avoid deeply nested data.
3. Do not duplicate product information across datasets.
4. All entities must have stable IDs.

---

## Entity Overview

Brand
Represents a manufacturer.

Family
Represents a product line within a brand.

Variant
Represents a specific grill or smoker model.

Spec
Represents a product specification.

Asset
Represents images, videos, or media.

RecommendationRule
Defines rules used by the recommendation quiz.

---

## Performance Goals

The customer app must:

* load extremely fast
* avoid large blocking datasets
* lazily load heavy data when needed

The browsing UI should load using only lightweight datasets.
