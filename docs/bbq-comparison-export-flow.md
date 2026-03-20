# BBQ Comparison App — Export Flow

## Purpose

The customer app never reads Google Sheets directly.

The export pipeline reads source workbook data, validates it, generates normalized datasets, writes local JSON output for review, and can optionally publish those files to Cloudflare R2.

Pipeline:

Google Sheets  
→ source adapter  
→ source validation  
→ export runner  
→ JSON datasets  
→ manifest  
→ local output and/or R2 publish

---

## Current export-safe workbook schema

### Required tabs

- Brands
- Families
- Variants

### Supported optional tabs

- Colors
- Assets
- Specs
- RecommendationRules

### Allowed foundation tab, not export-required yet

- VariantColors

### Current required headers by tab

#### Brands
- brand_id
- brand_name

#### Families
- family_id
- brand_id
- family_name

#### Variants
- variant_id
- family_id
- variant_name

#### Colors
- color_id
- color_name

#### Assets
- asset_id
- entity_type
- entity_id
- url

#### Specs
- spec_id
- entity_type
- entity_id
- spec_key
- spec_value

#### RecommendationRules
- rule_id

---

## Locked schema rules

- `Variants` is the main product-row sheet.
- `Specs` is the expandable comparison-attribute sheet.
- `VariantColors` is the approved normalized join-sheet direction, but exporter support must be added through centralized config before export depends on it.
- `Colors` currently has canonical required headers `color_id` and `color_name`.
- Expanded workbook columns are allowed only when centralized config and exporter support are updated to safely support them.
- Centralized tab/header config must remain the single source of truth.
- Workbook schema changes must be made in config first, not scattered across exporters.

---

## Source layer files

Located in:

`data-tools/sheet-export/source/`

Main files:
- `sheetConfig.js`
- `normalizeHeaders.js`
- `parseSheetRows.js`
- `googleSheetsWorkbook.js`
- `googleSheetsAdapter.js`
- `validateSourceStructure.js`

Responsibilities:
- define workbook tab/header expectations
- normalize headers
- parse rows with source traceability
- load Google Sheet tab data
- surface structural issues clearly before export runs

---

## Execution entry points

Main runner:

`data-tools/sheet-export/runExport.js`

CLI entry:

`data-tools/sheet-export/runExportCli.js`

### Local export command

```bash
npm run export -- --spreadsheet=YOUR_SHEET_ID