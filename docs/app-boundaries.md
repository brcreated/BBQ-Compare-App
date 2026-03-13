# BBQ Comparison App — App Boundaries

## Customer App Responsibilities

The customer app is the showroom-facing experience.

It is responsible for:

- splash screen experience
- browsing by brand
- browsing by fuel type
- comparison workflow
- frozen comparison rail
- product detail pages
- cooking capacity visualization
- recommendation quiz
- reading published JSON datasets

The customer app must:

- remain extremely fast
- remain read-only
- never connect directly to Google Sheets
- avoid admin and editing workflows

---

## Manager App Responsibilities

The manager app is the internal operational tool.

It is responsible for:

- researching products
- approving or denying products
- reviewing product images
- editing product information
- activating or deactivating products
- publishing updates to the customer app

The manager app may later include:

- authentication
- audit history
- validation tools
- publishing controls

---

## Shared Package Responsibilities

Shared packages exist to prevent duplicated logic.

They are responsible for:

- shared data types
- shared formatting helpers
- shared comparison helpers
- shared recommendation helpers
- shared validation helpers

---

## Boundary Rules

1. The customer app must not contain manager workflows.
2. The manager app must not contain showroom UI logic.
3. Shared packages must not contain app-specific page logic.
4. Both apps must use the same core data models.
5. The customer app reads published JSON only.