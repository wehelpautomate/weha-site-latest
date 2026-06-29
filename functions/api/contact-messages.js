// POST /api/contact-messages  — stores a contact message in D1 and emails a notification.
// GET  /api/contact-messages   — returns recent contact messages (newest first).

import { notifyLead } from "../_lib/notify.js";
import { validateName, validateEmail, validateCompany, validateFreeText, honeypotTripped } from "../_lib/validate.js";

const FORM_NAME = "contact_message";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ detail: "Invalid JSON body." }, 422);
  }

  // Honeypot: silently accept-and-drop bot submissions.
  if (honeypotTripped(body)) return json({ detail: "Submission could not be processed." }, 422);

  const name = (body.name || "").trim();
  const process = (body.process || "").trim();

  const spamError =
    validateName(name) ||
    validateCompany(body.company, true) ||
    validateEmail(body.email, false) ||
    validateFreeText(process, "the process you want to fix");
  if (spamError) {
    return json({ detail: spamError }, 422);
  }

  const record = {
    id: crypto.randomUUID(),
    form_name: FORM_NAME,
    source: body.source ? String(body.source).trim() : null,
    name,
    company: (body.company || "").trim(),
    country: (body.country || "").trim(),
    industry: (body.industry || "").trim(),
    process,
    contact_method: (body.contact_method || "").trim(),
    email: body.email ? String(body.email).trim() : null,
    created_at: new Date().toISOString(),
  };

  try {
    await env.DB.prepare(
      `INSERT INTO contact_messages
       (id, form_name, source, name, company, country, industry, process, contact_method, email, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        record.id, record.form_name, record.source, record.name, record.company,
        record.country, record.industry, record.process, record.contact_method,
        record.email, record.created_at
      )
      .run();
  } catch (err) {
    return json({ detail: "Could not save request.", error: String(err) }, 500);
  }

  await notifyLead(env, {
    subject: `New WeHA contact message — ${record.company || record.name}`,
    replyTo: record.email,
    lines: [
      `New contact message submitted via the WeHA site:`,
      ``,
      `Name:           ${record.name}`,
      `Company:        ${record.company}`,
      `Country:        ${record.country}`,
      `Industry:       ${record.industry}`,
      `Contact method: ${record.contact_method}`,
      `Email:          ${record.email || "—"}`,
      ``,
      `Process described:`,
      `${record.process}`,
      ``,
      `Source:    ${record.source || "—"}`,
      `Submitted: ${record.created_at}`,
      `Ref: ${record.id}`,
    ],
  });

  return json(record, 200);
}

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, form_name, source, name, company, country, industry, process,
              contact_method, email, created_at
       FROM contact_messages
       ORDER BY created_at DESC
       LIMIT 1000`
    ).all();
    return json(results || []);
  } catch (err) {
    return json({ detail: "Could not fetch requests.", error: String(err) }, 500);
  }
}
