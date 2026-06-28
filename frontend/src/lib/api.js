import axios from "axios";

// Empty base => same-origin "/api" — hits the Cloudflare Pages Function.
// In local dev you can still override via REACT_APP_BACKEND_URL.
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
export const API = `${BACKEND_URL}/api`;

export async function submitAuditRequest(payload) {
  const { data } = await axios.post(`${API}/audit-requests`, payload);
  return data;
}

export async function submitBookingRequest(payload) {
  const { data } = await axios.post(`${API}/booking-requests`, payload);
  return data;
}

export async function submitContactMessage(payload) {
  const { data } = await axios.post(`${API}/contact-messages`, payload);
  return data;
}

export async function fetchAvailability(dateYmd, tz) {
  const { data } = await axios.get(`${API}/availability`, {
    params: { date: dateYmd, tz },
  });
  return data; // [{ label, iso_utc, taken }]
}

export async function submitPlaybookLead(payload) {
  const { data } = await axios.post(`${API}/playbook-requests`, payload);
  return data;
}

export async function submitCalculatorLead(payload) {
  const { data } = await axios.post(`${API}/calculator-leads`, payload);
  return data;
}

// WeHA AI — chat with the automation assistant.
// NOTE: WeHA AI was moved out of the live site. The helpers
// (sendWehaAiMessage / fetchWehaAiModels) now live in
// /future-development/frontend/lib/api-weha-ai.js

// Placeholder download URL for the AI Transformation Playbook
export const PLAYBOOK_DOWNLOAD_URL =
  "https://drive.google.com/uc?export=download&id=PLACEHOLDER_PLAYBOOK_ID";
