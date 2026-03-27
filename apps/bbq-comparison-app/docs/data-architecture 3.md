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

---

# Phase 2 — Product Data Model Architecture

Phase 2 defines the **normalized product model** used across the system.

This architecture supports:

* browsing
* product comparison
* recommendation engine
* future manager editing tools
* Shopify integrations
* scalable dataset publishing

---

# Core Entities

## Brands

File: `brands.json`

Represents grill and smoker manufacturers.

Fields:

- BrandId
- BrandName
- LogoURL
- BrandBackgroundURL
- Description
- Active
- SortOrder

---

## Product Families

File: `families.json`

Represents product lines within a brand.

Example:

- Yoder Smokers → YS Series
- Napoleon → Prestige Series

Fields:

- FamilyId
- BrandId
- FamilyName
- FuelType
- Category
- Description
- Active
- SortOrder

Relationships:

Brand  
└── Families

---

## Variants

File: `variants.json`

Represents a specific sellable grill or smoker model.

Examples:

- YS640S Standard
- YS640S Competition Cart
- Napoleon Prestige 500

Fields include:

Core attributes:

- VariantId
- FamilyId
- VariantName
- ModelNumber
- Weight
- Width
- Depth
- Height
- Price

Capability inputs:

- PrimaryCookingArea
- SecondaryCookingArea
- TotalCookingArea
- GrateLevels
- RackWidth
- RackDepth

Capability outputs:

- BurgerCapacity
- BrisketCapacity
- RibRackCapacity
- PorkButtCapacity
- ChickenCapacity

Reserved sync fields:

- ShopifyProductId
- ShopifyVariantId
- ShopifyHandle
- PriceSource
- LastShopifySyncAt

Relationships:

Family  
└── Variants

---

## Colors

File: `colors.json`

Represents available finish options for a variant.

Fields:

- ColorId
- VariantId
- ColorName
- ColorHex
- Active

Relationships:

Variant  
└── Colors

---

## Assets

File: `assets.json`

Represents product images.

Fields:

- ImageId
- VariantId
- ColorId
- ImageURL
- ImageType
- Selected
- SortOrder

Image Types:

- Hero
- Gallery
- Detail
- Lifestyle

Relationships:

Variant  
└── Images

Color  
└── Images (optional)

---

## Specs

File: `specs.json`

Represents additional product attributes used for comparison and product detail pages.

Fields:

- SpecId
- VariantId
- SpecName
- SpecValue
- SpecGroup
- SortOrder

Specs allow unlimited attribute expansion without changing the base schema.

---

## Recommendation Rules

File: `recommendationRules.json`

Defines scoring logic used by the recommendation quiz.

Fields:

- RuleId
- RuleName
- Active
- SortOrder
- Filters
- Scores
- Notes

This dataset allows the recommendation engine to remain **fully data-driven**.

---

## Dataset Manifest

File: `manifest.json`

The manifest tells the application:

* which datasets exist
* version numbers
* dataset hashes
* record counts
* publish timestamps

Example structure:
{
"manifest": [
{
"Dataset": "brands",
"File": "brands.json",
"Version": 1,
"RecordCount": 6,
"Hash": "a1c84e9d6f",
"GeneratedAt": "2026-03-15T18:40:22Z"
}
]
}


The customer app loads this first to determine which datasets must be refreshed.

---

# Dataset Relationships

Brand  
└── Families  
  └── Variants  
    ├── Colors  
    ├── Assets  
    └── Specs

---

# Validation Layer

All exported datasets are validated before publishing.

Schemas live in:
data-tools/schemas


Validation checks include:

* required fields
* enum enforcement
* numeric validation
* duplicate ID detection
* relationship integrity

Invalid datasets **cannot be published**.

---

# Architecture Goals

The system is designed to:

* maintain normalized data structures
* minimize runtime transformation
* ensure predictable IDs
* support future manager editing tools
* enable Shopify synchronization
* deliver lightweight JSON datasets to the client
* support fast side-by-side product comparison

---

# Future Phases

Phase 3 will introduce:

* Google Sheet export pipeline
* automated JSON dataset generation
* validation + publish process
* Cloudflare R2 dataset upload
* dataset versioning