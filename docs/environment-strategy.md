# BBQ Comparison App — Environment Strategy

## Goal

Use environment variables to keep deployments flexible across local, staging, and production environments.

Do not hardcode:

- API URLs
- R2 dataset URLs
- asset base URLs
- environment labels
- feature flags

---

## Customer App Environment Variables

Example variables:

- VITE_APP_NAME
- VITE_DATA_BASE_URL
- VITE_ASSET_BASE_URL
- VITE_ENV_NAME
- VITE_ENABLE_DEMO_MODE

Purpose:

- app branding
- R2 JSON location
- asset hosting location
- environment labeling
- optional demo-mode toggles

---

## Manager App Environment Variables

Example variables:

- VITE_APP_NAME
- VITE_API_BASE_URL
- VITE_DATA_BASE_URL
- VITE_ENV_NAME
- VITE_ENABLE_PUBLISHING

Purpose:

- app branding
- manager API/function base URL
- dataset base URL
- environment labeling
- publishing controls

---

## Rules

1. Each app manages its own environment variables.
2. Public client variables must use the Vite `VITE_` prefix.
3. Secrets must never be placed in the client app.
4. Deployment-specific values should be configured in Cloudflare per project.
5. Code should read from environment config wrappers, not from raw import.meta.env everywhere.