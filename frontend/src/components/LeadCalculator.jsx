import { useState } from "react";
import { Calculator, ArrowRight, Lock, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { submitPlaybookLead } from "@/lib/api";
import { validateName, validateEmail, validateCompany, isHoneypotTripped } from "@/lib/spamGuard";

/**
 * LeadCalculator
 * A reusable, gated calculator card used in page heros.
 *
 * Behaviour (in this exact order):
 *  1. Render `inputs` as styled dropdowns.
 *  2. Show a "Calculate" button.
 *  3. First click (before capture) opens a popup collecting Name, Email, Company.
 *  4. Submitting the popup POSTs to /api/playbook-requests (with the chosen
 *     inputs serialized into asset_title) using the given `source`.
 *  5. ONLY on a successful POST does the popup close and the computed result
 *     reveal in place.
 *  6. After capture, changing inputs recomputes live, with no re-gating
 *     (the "captured" flag lives in component state, not browser storage).
 *
 * Props:
 *  - title    : string
 *  - subtitle : string
 *  - inputs   : [{ label, key, options: [{ label, value }] }]
 *  - compute  : (values) => ({ headline, lines: [...], note })
 *  - source   : string  (lead source value)
 *  - testid   : string  (optional, for test hooks)
 */
export default function LeadCalculator({
  title,
  subtitle,
  inputs,
  compute,
  source,
  testid = "lead-calculator",
}) {
  // Selected value per input, defaulting to each input's first option.
  const [values, setValues] = useState(() =>
    Object.fromEntries(inputs.map((i) => [i.key, i.options[0].value]))
  );
  const [captured, setCaptured] = useState(false);
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lead, setLead] = useState({ name: "", email: "", company: "" });
  const [hp, setHp] = useState("");
  const [error, setError] = useState("");

  const updateValue = (key) => (e) => {
    const raw = e.target.value;
    const input = inputs.find((i) => i.key === key);
    const opt = input.options.find((o) => String(o.value) === raw);
    const val = opt ? opt.value : raw;
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      // After capture, recompute live so changing inputs updates the result
      // immediately, with no re-gating.
      if (captured) setResult(compute(next));
      return next;
    });
  };

  const handleCalculate = () => {
    if (captured) {
      setResult(compute(values));
    } else {
      // Do NOT compute yet. Gate behind the lead popup first.
      setError("");
      setOpen(true);
    }
  };

  // Human-readable serialization of the current selections for the lead record.
  const serializeSelections = () =>
    inputs
      .map((i) => {
        const opt = i.options.find((o) => o.value === values[i.key]);
        return `${i.label} ${opt ? opt.label : values[i.key]}`;
      })
      .join("; ");

  const updateLead = (k) => (e) => setLead((l) => ({ ...l, [k]: e.target.value }));

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (isHoneypotTripped(hp)) return;

    const err =
      validateName(lead.name) || validateEmail(lead.email) || validateCompany(lead.company);
    if (err) {
      setError(err);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await submitPlaybookLead({
        name: lead.name,
        company: lead.company,
        email: lead.email,
        source,
        asset_title: `${title} | ${serializeSelections()}`,
      });
      // Only reveal results after a successful capture.
      setCaptured(true);
      setOpen(false);
      setResult(compute(values));
      toast.success("Thanks. Here is your estimate.");
    } catch (err2) {
      const msg =
        err2?.response?.data?.detail || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        data-testid={testid}
        className="glass rounded-2xl p-7 md:p-8 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] border border-weha-border bg-weha-bg/85 backdrop-blur-xl"
      >
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] uppercase text-weha-teal">
          <Calculator size={13} /> Free estimate
        </span>
        <h3 className="weha-display text-2xl md:text-3xl mt-2 text-weha-text leading-tight">{title}</h3>
        {subtitle && <p className="mt-2 text-sm text-weha-muted leading-relaxed">{subtitle}</p>}

        <div className="mt-6 space-y-4">
          {inputs.map((input) => (
            <div key={input.key}>
              <label className="weha-label" htmlFor={`${testid}-${input.key}`}>
                {input.label}
              </label>
              <select
                id={`${testid}-${input.key}`}
                className="weha-input"
                value={String(values[input.key])}
                onChange={updateValue(input.key)}
                data-testid={`${testid}-${input.key}`}
              >
                {input.options.map((o) => (
                  <option key={String(o.value)} value={String(o.value)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleCalculate}
          className="btn-teal w-full justify-center mt-6"
          data-cursor="hover"
          data-testid={`${testid}-calculate`}
        >
          {result ? "Recalculate" : "Calculate"}
          {result ? <ArrowRight size={16} /> : <Calculator size={16} />}
        </button>

        {!captured && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-weha-faint">
            <Lock size={12} /> Enter your details once, then explore freely.
          </p>
        )}

        {result && (
          <div
            className="mt-6 border-t border-weha-border pt-6"
            data-testid={`${testid}-result`}
            aria-live="polite"
          >
            <div className="inline-flex items-center gap-2 text-weha-teal">
              <Sparkles size={16} />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase">Your estimate</span>
            </div>
            <p className="weha-display text-2xl md:text-3xl mt-3 text-weha-text leading-snug">
              {result.headline}
            </p>
            <ul className="mt-4 space-y-2.5">
              {result.lines.map((line, idx) => (
                <li key={idx} className="flex gap-3 text-weha-text leading-relaxed">
                  <span className="text-weha-teal mt-2 h-1.5 w-1.5 rounded-full bg-weha-teal shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {result.note && (
              <p className="mt-5 rounded-xl border border-weha-border bg-weha-surface p-4 text-sm text-weha-muted leading-relaxed">
                {result.note}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Lead capture popup. Radix Dialog gives focus trap + Escape to close. */}
      <Dialog open={open} onOpenChange={(o) => !submitting && setOpen(o)}>
        <DialogContent
          className="border-weha-border bg-weha-bg text-weha-text sm:rounded-2xl"
          data-testid={`${testid}-popup`}
        >
          <DialogHeader>
            <DialogTitle className="weha-display text-2xl text-weha-text">
              See your estimate
            </DialogTitle>
            <DialogDescription className="text-weha-muted">
              Enter your details once to unlock the calculator. You can then change the inputs and
              recalculate as much as you like.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLeadSubmit} className="space-y-4 mt-1" data-testid={`${testid}-popup-form`}>
            {/* Honeypot: hidden from real users; bots that fill it are blocked. */}
            <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" tabIndex={-1}>
              <input
                type="text"
                name="company_url"
                tabIndex={-1}
                autoComplete="off"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
              />
            </div>

            <div>
              <label className="weha-label" htmlFor={`${testid}-lead-name`}>Name</label>
              <input
                id={`${testid}-lead-name`}
                className="weha-input"
                value={lead.name}
                onChange={updateLead("name")}
                placeholder="Your name"
                autoComplete="name"
                data-testid={`${testid}-lead-name`}
              />
            </div>
            <div>
              <label className="weha-label" htmlFor={`${testid}-lead-email`}>Work email</label>
              <input
                id={`${testid}-lead-email`}
                type="email"
                className="weha-input"
                value={lead.email}
                onChange={updateLead("email")}
                placeholder="you@company.com"
                autoComplete="email"
                data-testid={`${testid}-lead-email`}
              />
            </div>
            <div>
              <label className="weha-label" htmlFor={`${testid}-lead-company`}>Company</label>
              <input
                id={`${testid}-lead-company`}
                className="weha-input"
                value={lead.company}
                onChange={updateLead("company")}
                placeholder="Company"
                autoComplete="organization"
                data-testid={`${testid}-lead-company`}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500" role="alert" data-testid={`${testid}-popup-error`}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-teal w-full justify-center disabled:opacity-60"
              data-cursor="hover"
              data-testid={`${testid}-popup-submit`}
            >
              {submitting ? "Calculating…" : "Show my estimate"} <CheckCircle2 size={16} />
            </button>
            <p className="text-xs text-weha-faint leading-relaxed">
              We will never spam. Unsubscribe in one click. Your data stays private and is never shared.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
