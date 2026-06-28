# We Help Automate (WeHA)

Marketing website for **We Help Automate (WeHA)**, an AI automation studio that
turns manual workflows into systems businesses own. Built on the tools clients
already use, handed over with full documentation, no lock-in.

The site is a **Create React App single-page app** deployed on **Cloudflare
Pages**, with form handling done by **Cloudflare Pages Functions** writing to
**Cloudflare D1**, and lead-notification email sent through **Resend**.

---

## Tech stack

| Layer            | Technology                                                        |
| ---------------- | ----------------------------------------------------------------- |
| Frontend         | React 19, React Router 7, CRA + CRACO, Tailwind, shadcn/ui        |
| Animation        | Three.js (hero scenes), Framer Motion, Lenis smooth scroll        |
| Backend (prod)   | Cloudflare Pages Functions (`frontend/functions/api/`)            |
| Database         | Cloudflare D1 (bound as `DB`)                                     |
| Email            | Resend (via `frontend/functions/_lib/notify.js`)                  |
| Hosting          | Cloudflare Pages                                                  |
| SEO              | Per-route meta + JSON-LD (`Seo.jsx`), prerender via react-snap    |

> The Python `backend/server.py` and `backend_test*.py` files are for local
> development and historical testing only. **Cloudflare Pages cannot run Python**,
> so the production backend is the Cloudflare Functions layer, not FastAPI.

---

## Project structure

```
frontend/
  public/            Static assets + SEO files (robots, sitemap, llms.txt, og-default.png)
  src/
    pages/           One component per route
    components/      Shared UI (PageHero, calculators, modals, forms, Three.js scenes)
    lib/             api.js (fetch helpers), resourceLinks.js (Drive download URLs)
  functions/
    api/             Cloudflare Pages Functions (one per form/endpoint)
    _lib/            Shared validate.js + notify.js helpers
  schema.sql         D1 schema (all five lead tables)
  scripts/
    prerender.js     Postbuild static prerender wrapper (react-snap)
future-development/  Parked features not part of the live site
```

---

## Pages

`/` Home, `/services`, `/work`, `/about`, `/contact`, `/resources` and its
children `/resources/workbooks`, `/resources/workflow-automations`,
`/resources/ebooks`.

---

## Forms, endpoints, and D1 tables

Every lead-capture surface has its own `form_name`, endpoint, and D1 table, each
tagged with a `source` for traceability.

| form_name          | endpoint                      | D1 table           | source surface                  |
| ------------------ | ----------------------------- | ------------------ | ------------------------------- |
| `audit_request`    | `POST /api/audit-requests`    | `audit_requests`   | `LeadForm.jsx`                  |
| `booking_request`  | `POST /api/booking-requests`  | `booking_requests` | `BookingModal.jsx`              |
| `playbook_lead`    | `POST /api/playbook-requests` | `playbook_leads`   | `PlaybookLeadForm.jsx`, heroes  |
| `contact_message`  | `POST /api/contact-messages`  | `contact_messages` | `Contact.jsx`                   |
| `calculator_lead`  | `POST /api/calculator-leads`  | `calculator_leads` | `ValueCalculator.jsx`           |

Each function also exposes a matching `GET` returning the newest 1000 rows of its
table. All queries use bound parameters. Inputs are validated and a honeypot
field silently drops bot submissions (`_lib/validate.js`).

---

## Lead magnets and downloads

Gated downloads live in `frontend/src/lib/resourceLinks.js`. Each download is
served from Google Drive (shared "anyone with link, Viewer"). The lead is
captured and stored **before** the file is revealed. To update a file without
breaking its link, use Google Drive's **Manage versions, Upload new version** so
the file ID stays the same.

---

## Local development

```bash
cd frontend
yarn install          # or npm install
yarn start            # CRA dev server (frontend only)
```

To exercise the Cloudflare Functions + D1 locally, use Wrangler:

```bash
# from the frontend directory, after building
npx wrangler pages dev build --d1 DB=<local-d1-name>
```

> Forms will not write to D1 inside the plain CRA dev server, because the D1
> binding only exists under Wrangler or on the deployed Pages project. This is
> expected, not a bug.

---

## Build

```bash
cd frontend
yarn build            # CRA build, then prerender (postbuild) runs react-snap
```

The `postbuild` step runs `scripts/prerender.js`, which prerenders every route to
static HTML so crawlers and LLMs receive fully formed pages without executing
JavaScript. Verify by opening a built route's `index.html` and confirming it
contains real content, not an empty root div.

---

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full step-by-step: Cloudflare
Pages setup, D1 binding, schema apply, environment variables, custom domain, DNS.

---

## Environment variables

Set as **Cloudflare Pages environment variables / secrets** in the Cloudflare
dashboard. **Never** commit them. See **[.env.example](./.env.example)**.

| Variable             | Where      | Purpose                                            |
| -------------------- | ---------- | -------------------------------------------------- |
| `RESEND_API_KEY`     | Cloudflare | Sends lead notification emails (secret)            |
| `LEAD_TO_EMAIL`      | Cloudflare | Inbox that receives lead notifications             |
| `LEAD_FROM_EMAIL`    | Cloudflare | Verified Resend sender address                     |
| `SHEETS_WEBHOOK_URL` | Cloudflare | Optional Sheets / Zapier mirror (no-op if unset)   |
| `REACT_APP_SITE_URL` | Build-time | Canonical site URL for SEO (falls back to prod)    |

> Only `REACT_APP_*` variables are exposed to the browser bundle, so they must
> never hold secrets. All real secrets are backend-only and read from `env`.

---

## SEO

- Per-route `title`, `description`, canonical, OpenGraph, Twitter, and JSON-LD
  via `Seo.jsx` (React 19 native head hoisting, no helmet needed).
- `public/robots.txt` welcomes search and AI crawlers and points to the sitemap.
- `public/sitemap.xml` lists all public routes.
- `public/llms.txt` gives LLM crawlers a clean summary of the business.
- `public/og-default.png` is the default social share image (1200x630).
- Static prerendering (react-snap) makes the SPA fully crawlable.

---

## Brand

- Accent: Ink Violet `#5b3fa6` (light) / `#9b80e0` (dark)
- Background: off-white `#f7f6f2`
- Display: Instrument Serif. Body: Inter
- Wordmark: `We|HA`

Positioning is industry-agnostic and geography-agnostic. Copy avoids em-dashes by
convention.
