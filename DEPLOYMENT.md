# Deploying WeHA to Cloudflare Pages

This is the full launch checklist, in order. Do these once for the initial
launch; after that, every `git push` to the production branch redeploys
automatically.

---

## 1. Create the Cloudflare Pages project

1. In the Cloudflare dashboard, go to **Workers & Pages, Create, Pages, Connect to Git**.
2. Select this repository and the production branch.
3. Build settings:
   - **Framework preset:** Create React App
   - **Build command:** `cd frontend && yarn install && yarn build`
   - **Build output directory:** `frontend/build`
   - **Root directory:** leave as repo root (the build command cd's into frontend)
4. Save and deploy. The first build also runs the `postbuild` prerender step.

> If the prerender step fails on Cloudflare's builder due to Chromium, the build
> log will show it. The prerender wrapper (`frontend/scripts/prerender.js`) lets
> puppeteer download its own Chromium when `PUPPETEER_EXECUTABLE_PATH` is unset,
> which is the default on Cloudflare. If it still struggles, deploy without
> prerender first to confirm the site works, then revisit prerendering.

---

## 2. Create and bind the D1 database

```bash
# create the database (run locally with Wrangler authenticated to your account)
wrangler d1 create weha-db
```

1. In the Pages project, go to **Settings, Functions, D1 database bindings**.
2. Add a binding with **Variable name `DB`** pointing to `weha-db`.
3. Apply this for both Production and Preview environments.

Then apply the schema (creates all five lead tables, safe to re-run):

```bash
wrangler d1 execute weha-db --file=frontend/schema.sql --remote
```

Verify the tables exist:

```bash
wrangler d1 execute weha-db --command "SELECT name FROM sqlite_master WHERE type='table';" --remote
```

You should see: `audit_requests`, `booking_requests`, `playbook_leads`,
`contact_messages`, `calculator_leads`.

---

## 3. Set environment variables and secrets

In the Pages project, **Settings, Environment variables**. Add these (mark the
API key as a **Secret**, encrypted):

| Variable             | Example value                         | Notes                              |
| -------------------- | ------------------------------------- | ---------------------------------- |
| `RESEND_API_KEY`     | `re_xxxxxxxx`                         | From your Resend dashboard. Secret. |
| `LEAD_TO_EMAIL`      | `hi@wehelpautomate.com`               | Where lead notifications arrive.   |
| `LEAD_FROM_EMAIL`    | `noreply@wehelpautomate.com`          | Must be a verified Resend sender.  |
| `SHEETS_WEBHOOK_URL` | (leave unset)                         | Optional; enables a Sheets mirror. |
| `REACT_APP_SITE_URL` | `https://www.wehelpautomate.com`      | Build-time, for SEO canonicals.    |

Set these for **Production** (and Preview if you want previews to send mail).
Redeploy after adding them so the functions pick them up.

> Until all three of `RESEND_API_KEY`, `LEAD_TO_EMAIL`, and `LEAD_FROM_EMAIL` are
> set, forms still save to D1 but no notification email is sent. That is by
> design (see `_lib/notify.js`).

---

## 4. Set up Resend

1. Create a Resend account and add your domain.
2. Add the DKIM / SPF DNS records Resend gives you (in Cloudflare DNS once the
   domain is on Cloudflare; see step 5).
3. Verify the sender domain, then use a verified address for `LEAD_FROM_EMAIL`.

---

## 5. Custom domain and DNS

1. Register the domain (e.g. via Namecheap).
2. In Cloudflare, add the site and switch the registrar's nameservers to the
   Cloudflare nameservers Cloudflare provides. Wait for propagation.
3. In the Pages project, **Custom domains**, add `wehelpautomate.com` and
   `www.wehelpautomate.com`. Cloudflare creates the records automatically.
4. Add the Resend DKIM/SPF records (from step 4) in Cloudflare DNS.
5. Optionally set up **Cloudflare Email Routing** to forward
   `hi@wehelpautomate.com` to your real inbox (free; receiving only).

---

## 6. Post-deploy verification

Run through this before driving traffic:

- [ ] Every route loads and refreshes without a 404 (deep-link test).
- [ ] **View Source** on `/services` shows real HTML content, not an empty root
      div (confirms prerendering worked).
- [ ] Submit the contact form with your own email. Confirm a row appears in D1
      and (once Resend is set) a notification email arrives.
- [ ] Submit one gated download. Confirm the lead saves and the correct file
      downloads.
- [ ] Run one calculation in each calculator. Confirm the gate popup captures the
      lead, it lands in `calculator_leads`, and the floating result popup shows.
- [ ] Share a link on LinkedIn or WhatsApp and confirm the OG preview image and
      title render.
- [ ] Test the site on a real phone, especially the Three.js hero and scrolling.

To read leads from D1 at any time:

```bash
wrangler d1 execute weha-db --command "SELECT created_at,name,email,source FROM contact_messages ORDER BY created_at DESC LIMIT 20;" --remote
```

---

## Routine updates

After launch, just push to the production branch. Cloudflare rebuilds and
redeploys automatically, including the prerender step. To update a downloadable
asset, replace it in Google Drive via **Manage versions** so its link does not
change.
