// Shared lead-notification helper for the Cloudflare Pages Functions.
// Sends a Resend email only when the three required env vars are present, and
// is wrapped in try/catch so a failed email never blocks the D1 write.
//
// Secrets (RESEND_API_KEY, LEAD_TO_EMAIL, LEAD_FROM_EMAIL, SHEETS_WEBHOOK_URL)
// are configured as Cloudflare Pages environment variables / secrets and are
// NEVER hardcoded here.

export async function notifyLead(env, { subject, lines, replyTo } = {}) {
  // Same guard as the original audit function: all three must be set.
  if (env.RESEND_API_KEY && env.LEAD_TO_EMAIL && env.LEAD_FROM_EMAIL) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.LEAD_FROM_EMAIL,
          to: env.LEAD_TO_EMAIL,
          reply_to: replyTo || undefined,
          subject,
          text: (lines || []).join("\n"),
        }),
      });
    } catch (_) {
      // Swallow email errors — the DB write must still succeed.
    }
  }

  // ── OPTIONAL FUTURE: Google Sheets mirror. If env.SHEETS_WEBHOOK_URL is set,
  // POST the lead to it (Apps Script / Zapier webhook). No-op until configured. ──
  if (env.SHEETS_WEBHOOK_URL) {
    // Intentionally left unimplemented. Wire up the Sheets/Zapier POST here later.
  }
}
