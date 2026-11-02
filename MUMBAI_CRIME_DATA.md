# Mumbai police reports

## What is connected

The built-in signed-in route engine reads the reviewed local Mumbai police collection and saves the evidence with new journeys. Old journeys stay unchanged. Sample journeys do not use real police records. A custom Express route server continues to use its own results.

The collection currently contains **one original police press note**, dated 1 October 2025, covering an incident on 29 September 2025. Its original PDF was visually reviewed. No names, home addresses, victim details or narrative text are stored. Its landmark has no verified coordinates and it is older than a year, so it does **not** change route scores. This is a working source-linked collection, not a complete Mumbai crime dataset.

Press notes selectively describe incidents. Published FIR access can require CAPTCHA; do not bypass it. Public availability does not imply permission for bulk reuse: confirm terms and permission before building a larger collection.

## Local VS Code imports

Use PostgreSQL for this module (the same schema as the app's Cloud database), not a browser database or a direct MongoDB connection. Apply the police-evidence schema from the migration files to your own PostgreSQL with the corresponding roles/RLS, or run a compatible local Cloud stack. The existing app account connection must point to that stack for route reads to use those imports. A standalone unrelated PostgreSQL is not automatically read by the hosted app. Never place database credentials in browser settings or a `VITE_` variable.

1. Download the original official PDF to a local folder.
2. Create a curated JSON document matching `data/mumbai-police/agripada-2025-10-01.json`.
3. Manually verify the category, occurrence date, source locator and location precision. Only use street coordinates after checking the actual occurrence location; never locate station totals at a station building.
4. Set `LOCAL_CRIME_DATABASE_URL` in your local environment, privately, using a privileged connection to **your own** database. Lovable Cloud does not provide a database password.
5. Run `bun scripts/import-mumbai-police.ts path/to/curated.json path/to/original.pdf`.

The importer validates fields and reporting dates, verifies the PDF SHA-256, runs a transaction and prevents duplicate source records. It does not automatically trust AI extraction or fetch arbitrary report URLs.

## Score rules

- Area and station totals: never street evidence.
- Partial press notes: historical context only; no numeric adjustment.
- For numeric adjustments: a curator must establish a complete reporting boundary covering the entire route, at least 28 reporting days, with an end date within 90 days. The route engine reads the latest suitable period only.
- Only dated, verified street incidents within 250 metres count. Future incidents and those older than 365 days are excluded.
- Experimental adjustment: subtract 2 points per recorded incident, capped at 20, from the open-place/help comparison. Zero incidents provides no bonus. This is not a validated danger probability.
- Failed or truncated queries: preserve the existing comparison and show that crime could not be checked.
- Lighting remains unknown; this collection does not establish working streetlights.

**Current blocker:** a permissioned, sufficiently complete and geographically verified Mumbai reporting collection is still needed before any real crime-based change to route scores can be justified.