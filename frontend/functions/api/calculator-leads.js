// POST /api/calculator-leads  stores a calculator lead in D1 and emails a notification.
// GET  /api/calculator-leads   returns recent calculator leads (newest first).
//
// Mirrors functions/api/playbook-requests.js: same validation lib, honeypot,
// notifyLead helper, bound D1 params, and generic error messages.

import { notifyLead } from "../_lib/notify.js";
import { validateName, validateEmail, validateCompany, honeypotTripped } from "../_lib/validate.js";

const FORM_NAME = "calculator_lead";
const MAX_INPUTS = 4000;
const MAX_SUMMARY = 500;

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
  const email = body.email ? String(body.email).trim() : "";

  const spamError =
    validateName(name) || validateEmail(email, true) || validateCompany(body.company, false);
  if (spamError) {
    return json({ detail: spamError }, 422);
  }

  const record = {
    id: crypto.randomUUID(),
    form_name: FORM_NAME,
    source: body.source ? String(body.source).trim() : null,
    name,
    email,
    company: (body.company || "").trim(),
    inputs_json: body.inputs_json ? String(body.inputs_json).slice(0, MAX_INPUTS) : null,
    result_summary: body.result_summary ? String(body.result_summary).slice(0, MAX_SUMMARY) : null,
    created_at: new Date().toISOString(),
  };

  try {
    await env.DB.prepare(
      `INSERT INTO calculator_leads
       (id, form_name, source, name, email, company, inputs_json, result_summary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        record.id, record.form_name, record.source, record.name, record.email,
        record.company, record.inputs_json, record.result_summary, record.created_at
      )
      .run();
  } catch (err) {
    return json({ detail: "Could not save request.", error: String(err) }, 500);
  }

  await notifyLead(env, {
    subject: `New WeHA calculator lead: ${record.company || record.name}`,
    replyTo: record.email,
    lines: [
      `New calculator lead submitted via the WeHA site:`,
      ``,
      `Name:    ${record.name}`,
      `Company: ${record.company}`,
      `Email:   ${record.email}`,
      ``,
      `Source:  ${record.source || "(none)"}`,
      `Result:  ${record.result_summary || "(none)"}`,
      `Inputs:  ${record.inputs_json || "(none)"}`,
      `Submitted: ${record.created_at}`,
      `Ref: ${record.id}`,
    ],
  });

  return json(record, 200);
}

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, form_name, source, name, email, company, inputs_json, result_summary, created_at
       FROM calculator_leads
       ORDER BY created_at DESC
       LIMIT 1000`
    ).all();
    return json(results || []);
  } catch (err) {
    return json({ detail: "Could not fetch requests.", error: String(err) }, 500);
  }
}
