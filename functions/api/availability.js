// GET /api/availability?date=YYYY-MM-DD&tz=<IANA tz>
//
// Returns business-hours booking slots for the requested local date, shaped as
// [{ label, iso_utc, taken }]. This mirrors backend/server.py /api/availability
// so the booking modal behaves identically in preview (FastAPI) and production
// (this Cloudflare Pages Function).
//
// Slots: Monday to Friday, 09:00 to 18:00 local time, 30 minute increments,
// future only (at least 15 minutes out). Weekends and past dates return [].

const BUSINESS_START_HOUR = 9; // local time, inclusive
const BUSINESS_END_HOUR = 18; // local time, exclusive
const SLOT_MINUTES = 30;
const WORK_DAYS = new Set([1, 2, 3, 4, 5]); // Mon..Fri (JS getUTCDay: 0=Sun)
const MIN_LEAD_MS = 15 * 60 * 1000;

// Keep in sync with backend/server.py ALLOWED_TIMEZONES and BookingModal.jsx.
const ALLOWED_TIMEZONES = new Set([
  "Asia/Dubai",
  "Australia/Sydney",
  "Asia/Singapore",
  "Asia/Kolkata",
  "America/New_York",
]);

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });

const pad2 = (n) => String(n).padStart(2, "0");
// FastAPI emits ISO UTC with a trailing Z and no milliseconds; match that so a
// slot key produced here equals the one stored on booking submit.
const isoSeconds = (d) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

// Offset (ms) of `timeZone` at the instant `date`. A positive value means the
// zone is ahead of UTC. Uses Intl so no timezone library is needed in the
// Workers runtime.
function tzOffsetMs(timeZone, date) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map = {};
  for (const p of dtf.formatToParts(date)) map[p.type] = p.value;
  let hour = Number(map.hour);
  if (hour === 24) hour = 0; // some engines emit "24" at midnight
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    hour,
    Number(map.minute),
    Number(map.second)
  );
  return asUTC - date.getTime();
}

// UTC Date for a given wall-clock time in `timeZone`. Refines once to handle
// DST transition edges.
function zonedWallTimeToUtc(timeZone, y, m, d, hour, minute) {
  const guess = Date.UTC(y, m - 1, d, hour, minute, 0);
  const offset = tzOffsetMs(timeZone, new Date(guess));
  let utc = guess - offset;
  const offset2 = tzOffsetMs(timeZone, new Date(utc));
  if (offset2 !== offset) utc = guess - offset2;
  return new Date(utc);
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const date = (url.searchParams.get("date") || "").trim();
  const tz = (url.searchParams.get("tz") || "").trim();

  if (!ALLOWED_TIMEZONES.has(tz)) {
    return json({ detail: `Unsupported timezone: ${tz}` }, 400);
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return json({ detail: "Date must be YYYY-MM-DD" }, 400);
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);

  // Weekday of the requested calendar date (independent of timezone).
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun..6=Sat
  if (!WORK_DAYS.has(weekday)) return json([]);

  const nowMs = Date.now();
  const candidates = [];
  for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      const utcDate = zonedWallTimeToUtc(tz, y, m, d, hour, minute);
      if (utcDate.getTime() > nowMs + MIN_LEAD_MS) {
        candidates.push({
          label: `${pad2(hour)}:${pad2(minute)}`,
          iso_utc: isoSeconds(utcDate),
        });
      }
    }
  }

  if (candidates.length === 0) return json([]);

  // Mark slots already booked across booking_requests and audit_requests.
  // Best effort: if the lookup fails, default to not-taken so the modal still
  // shows selectable times.
  let booked = new Set();
  try {
    if (env && env.DB) {
      const isoKeys = candidates.map((s) => s.iso_utc);
      const placeholders = isoKeys.map(() => "?").join(", ");
      const sql =
        `SELECT slot_iso_utc FROM booking_requests WHERE slot_iso_utc IN (${placeholders}) ` +
        `UNION ` +
        `SELECT slot_iso_utc FROM audit_requests WHERE slot_iso_utc IN (${placeholders})`;
      const { results } = await env.DB.prepare(sql)
        .bind(...isoKeys, ...isoKeys)
        .all();
      booked = new Set((results || []).map((r) => r.slot_iso_utc));
    }
  } catch (_) {
    booked = new Set();
  }

  return json(
    candidates.map((s) => ({
      label: s.label,
      iso_utc: s.iso_utc,
      taken: booked.has(s.iso_utc),
    }))
  );
}
