-- WeHA form submissions. Each form has its own table.
-- Safe to re-run: every statement uses IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS audit_requests (
  id             TEXT PRIMARY KEY,
  form_name      TEXT NOT NULL DEFAULT 'audit_request',
  source         TEXT,
  name           TEXT NOT NULL,
  company        TEXT,
  country        TEXT,
  industry       TEXT,
  process        TEXT NOT NULL,
  contact_method TEXT,
  email          TEXT,
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_requests (created_at DESC);

CREATE TABLE IF NOT EXISTS booking_requests (
  id             TEXT PRIMARY KEY,
  form_name      TEXT NOT NULL DEFAULT 'booking_request',
  source         TEXT,
  name           TEXT NOT NULL,
  company        TEXT,
  country        TEXT,
  industry       TEXT,
  process        TEXT NOT NULL,
  contact_method TEXT,
  email          TEXT,
  slot_iso_utc   TEXT,
  timezone       TEXT,
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_booking_created_at ON booking_requests (created_at DESC);

CREATE TABLE IF NOT EXISTS playbook_leads (
  id               TEXT PRIMARY KEY,
  form_name        TEXT NOT NULL DEFAULT 'playbook_lead',
  source           TEXT,
  asset_title      TEXT,
  name             TEXT NOT NULL,
  company          TEXT,
  designation      TEXT,
  email            TEXT NOT NULL,
  industry         TEXT,
  country          TEXT,
  session_interest TEXT,
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_playbook_created_at ON playbook_leads (created_at DESC);

CREATE TABLE IF NOT EXISTS calculator_leads (
  id TEXT PRIMARY KEY,
  form_name TEXT NOT NULL DEFAULT 'calculator_lead',
  source TEXT,                 -- 'calculator:services' | 'calculator:work'
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  inputs_json TEXT,            -- the selected calculator inputs, as JSON
  result_summary TEXT,         -- the headline result, for context
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_calc_created_at ON calculator_leads (created_at DESC);

CREATE TABLE IF NOT EXISTS contact_messages (
  id             TEXT PRIMARY KEY,
  form_name      TEXT NOT NULL DEFAULT 'contact_message',
  source         TEXT,
  name           TEXT NOT NULL,
  company        TEXT,
  country        TEXT,
  industry       TEXT,
  process        TEXT NOT NULL,
  contact_method TEXT,
  email          TEXT,
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contact_messages (created_at DESC);
