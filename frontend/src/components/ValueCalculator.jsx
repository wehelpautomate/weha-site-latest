import { useState } from "react";
import { Calculator, ArrowRight, Lock, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { submitCalculatorLead } from "@/lib/api";
import { validateName, validateEmail, validateCompany, isHoneypotTripped } from "@/lib/spamGuard";

// Lead is captured once per SPA session, then both calculators recalculate
// freely without re-gating. This module-scoped flag is reset on a full page
// reload (it is not browser storage).
let sessionLeadCaptured = false;

const DISCLAIMER =
  "This is a conservative estimate for planning. Real results depend on your specific workflows. Book a free AI Audit for a precise model.";

/**
 * ValueCalculator
 * A reusable, gated calculator that shows its result in a floating popup.
 *
 * Flow:
 *  1. Render title, intro, optional accentNote, and 5 dropdown inputs.
 *  2. Calculate button.
 *  3. On Calculate: compute the result, then
 *       - if the lead is not captured this session, open the GATE dialog
 *         (Name, Email, Company). On a successful POST to /api/calculator-leads,
 *         mark captured, close the gate, and open the RESULT dialog.
 *       - if already captured, open the RESULT dialog straight away.
 *  4. The RESULT is shown only in a Dialog, never inline. "Recalculate" closes
 *     the result so the user can change inputs and run again, with no re-gating.
 *
 * Props: title, intro, inputs [{key,label,options:[{label,value}]}],
 *        compute(values) => { headline, breakdown:[{label,value}], note },
 *        source, accentNote.
 */
export default function ValueCalculator({
  title,
  intro,
  inputs,
  compute,
  source,
  accentNote,
  testid = "value-calculator",
}) {
  // Store the SELECTED OPTION INDEX per input (robust against duplicate values).
  const [sel, setSel] = useState(() =>
    Object.fromEntries(inputs.map((i) => [i.key, 0]))
  );
  const [captured, setCaptured] = useState(sessionLeadCaptured);
  const [gateOpen, setGateOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [lead, setLead] = useState({ name: "", email: "", company: "" });
  const [hp, setHp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const setIndex = (key) => (e) =>
    setSel((s) => ({ ...s, [key]: Number(e.target.value) }));

  // Resolve the selected option values into the shape compute expects.
  const resolved = () =>
    Object.fromEntries(inputs.map((i) => [i.key, i.options[sel[i.key]].value]));

  // Human-readable record of the chosen options for storage.
  const chosenLabels = () =>
    inputs.reduce((acc, i) => {
      acc[i.label] = i.options[sel[i.key]].label;
      return acc;
    }, {});

  const updateLead = (k) => (e) => setLead((l) => ({ ...l, [k]: e.target.value }));

  const handleCalculate = () => {
    const r = compute(resolved());
    setResult(r);
    if (captured) {
      setResultOpen(true);
    } else {
      setError("");
      setGateOpen(true);
    }
  };

  const handleGateSubmit = async (e) => {
    e.preventDefault();
    if (isHoneypotTripped(hp)) return;

    const err =
      validateName(lead.name) ||
      validateEmail(lead.email) ||
      (lead.company ? validateCompany(lead.company) : null);
    if (err) {
      setError(err);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await submitCalculatorLead({
        name: lead.name,
        email: lead.email,
        company: lead.company,
        source,
        inputs_json: JSON.stringify(chosenLabels()),
        result_summary: result ? result.headline : "",
      });
      sessionLeadCaptured = true;
      setCaptured(true);
      setGateOpen(false);
      setResultOpen(true);
      toast.success("Thanks. Here is your estimate.");
    } catch (err2) {
      const msg = err2?.response?.data?.detail || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* CALCULATOR CARD (in hero) */}
      <div
        data-testid={testid}
        className="glass rounded-2xl p-7 md:p-8 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] border border-weha-border bg-weha-bg/85 backdrop-blur-xl"
      >
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] uppercase text-weha-teal">
          <Calculator size={13} /> Free interactive tool
        </span>
        <h3 className="weha-display text-2xl md:text-3xl mt-2 text-weha-text leading-tight">{title}</h3>
        {intro && <p className="mt-2 text-sm text-weha-muted leading-relaxed">{intro}</p>}
        {accentNote && (
          <p className="mt-3 inline-flex items-start gap-1.5 rounded-lg bg-weha-teal-soft px-3 py-2 text-xs text-weha-teal leading-relaxed">
            {accentNote}
          </p>
        )}

        <div className="mt-5 space-y-3.5">
          {inputs.map((input) => (
            <div key={input.key}>
              <label className="weha-label" htmlFor={`${testid}-input-${input.key}`}>
                {input.label}
              </label>
              <select
                id={`${testid}-input-${input.key}`}
                className="weha-input text-base"
                value={String(sel[input.key])}
                onChange={setIndex(input.key)}
                data-testid={`${testid}-input-${input.key}`}
              >
                {input.options.map((o, idx) => (
                  <option key={idx} value={String(idx)}>
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
          Calculate <Calculator size={16} />
        </button>

        {!captured && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-weha-faint">
            <Lock size={12} /> Enter your details once, then explore freely.
          </p>
        )}
      </div>

      {/* GATE DIALOG: capture lead before showing the result */}
      <Dialog open={gateOpen} onOpenChange={(o) => !submitting && setGateOpen(o)}>
        <DialogContent
          className="max-w-md border-weha-border bg-weha-bg text-weha-text sm:rounded-2xl max-h-[90vh] overflow-y-auto"
          data-testid={`${testid}-gate`}
        >
          <DialogHeader>
            <DialogTitle className="weha-display text-2xl text-weha-text">See your estimate</DialogTitle>
            <DialogDescription className="text-weha-muted">
              Enter your details once to unlock the calculator. You can then change the inputs and
              recalculate as much as you like.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGateSubmit} className="space-y-4 mt-1" data-testid={`${testid}-gate-form`}>
            {/* Honeypot: hidden from real users; bots that fill it are blocked. */}
            <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" tabIndex={-1}>
              <input type="text" name="company_url" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
            </div>

            <div>
              <label className="weha-label" htmlFor={`${testid}-gate-name`}>Name</label>
              <input id={`${testid}-gate-name`} className="weha-input text-base" value={lead.name} onChange={updateLead("name")} placeholder="Your name" autoComplete="name" data-testid={`${testid}-gate-name`} />
            </div>
            <div>
              <label className="weha-label" htmlFor={`${testid}-gate-email`}>Work email</label>
              <input id={`${testid}-gate-email`} type="email" className="weha-input text-base" value={lead.email} onChange={updateLead("email")} placeholder="you@company.com" autoComplete="email" data-testid={`${testid}-gate-email`} />
            </div>
            <div>
              <label className="weha-label" htmlFor={`${testid}-gate-company`}>Company</label>
              <input id={`${testid}-gate-company`} className="weha-input text-base" value={lead.company} onChange={updateLead("company")} placeholder="Company" autoComplete="organization" data-testid={`${testid}-gate-company`} />
            </div>

            {error && (
              <p className="text-sm text-red-500" role="alert" data-testid={`${testid}-gate-error`}>{error}</p>
            )}

            <button type="submit" disabled={submitting} className="btn-teal w-full justify-center disabled:opacity-60" data-cursor="hover" data-testid={`${testid}-gate-submit`}>
              {submitting ? "Calculating…" : "Show my estimate"} <ArrowRight size={16} />
            </button>
            <p className="text-xs text-weha-faint leading-relaxed">
              We will never spam. Unsubscribe in one click. Your data stays private and is never shared.
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* RESULT DIALOG: the rich, floating result */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent
          className="max-w-lg border-weha-border bg-weha-bg text-weha-text sm:rounded-2xl max-h-[90vh] overflow-y-auto"
          data-testid={`${testid}-result`}
        >
          <DialogHeader>
            <DialogTitle className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-weha-teal">
              <Sparkles size={15} /> Your estimate
            </DialogTitle>
            <DialogDescription className="sr-only">Your calculated estimate and a breakdown of the figures.</DialogDescription>
          </DialogHeader>

          {result && (
            <div className="space-y-5">
              <p className="weha-display text-2xl md:text-3xl text-weha-text leading-snug">
                {result.headline}
              </p>

              <div className="rounded-xl border border-weha-border bg-weha-surface divide-y divide-weha-border">
                {result.breakdown.map((row, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-sm text-weha-muted">{row.label}</span>
                    <span className="weha-display text-lg text-weha-text">{row.value}</span>
                  </div>
                ))}
              </div>

              {result.note && (
                <div className="flex gap-3 rounded-xl bg-weha-teal-soft p-4">
                  <CheckCircle2 size={18} className="text-weha-teal mt-0.5 shrink-0" />
                  <p className="text-sm text-weha-text leading-relaxed">{result.note}</p>
                </div>
              )}

              <p className="text-xs text-weha-faint leading-relaxed">{DISCLAIMER}</p>

              <button
                type="button"
                onClick={() => setResultOpen(false)}
                className="btn-teal w-full justify-center"
                data-cursor="hover"
                data-testid={`${testid}-recalculate`}
              >
                Change inputs and recalculate <RefreshCw size={15} />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
