import { useState } from "react";
import { Download, BookOpen, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { submitPlaybookLead, PLAYBOOK_DOWNLOAD_URL } from "@/lib/api";
import { validateName, validateEmail, validateCompany, isHoneypotTripped } from "@/lib/spamGuard";

const SESSION_OPTIONS = ["Yes, book me in", "Maybe later", "No, just the playbook"];

const initial = {
  name: "",
  company: "",
  designation: "",
  email: "",
  industry: "",
  country: "",
  session_interest: "",
};

export default function PlaybookLeadForm({
  heading = "Get the AI Transformation Playbook",
  subheading,
  testid = "playbook-form",
  source = "unknown",
  compact = false,
  // Resource-gate mode: capture only name + email, then open `downloadUrl`.
  minimal = false,
  downloadUrl,
  assetTitle,
  submitLabel,
  onSuccess,
}) {
  const [form, setForm] = useState(initial);
  const [hp, setHp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // A provided downloadUrl always wins (used by the hero playbook magnet so the
  // real PDF is delivered instead of the placeholder).
  const fileUrl = downloadUrl || PLAYBOOK_DOWNLOAD_URL;

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();

    // Honeypot: silently drop bot submissions.
    if (isHoneypotTripped(hp)) return;

    const spamError = minimal
      ? (validateName(form.name) || validateEmail(form.email))
      : (validateName(form.name) || validateCompany(form.company) || validateEmail(form.email));
    if (spamError) {
      toast.error(spamError);
      return;
    }

    setSubmitting(true);
    try {
      const payload = minimal
        ? { name: form.name, email: form.email, source, asset_title: assetTitle }
        : { ...form, source };

      // Capture the lead first. Only reveal the file after this succeeds.
      await submitPlaybookLead(payload);
      setDone(true);
      toast.success(minimal ? "Thanks. Your download is starting." : "Playbook unlocked. Download starting.");
      if (fileUrl) window.open(fileUrl, "_blank", "noopener,noreferrer");
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.detail || "Something went wrong. Email hello@wehelpautomate.com";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-testid={testid}
      className={`glass rounded-2xl ${compact || minimal ? "p-6" : "p-7 md:p-8"} shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] border border-weha-border bg-weha-bg/85 backdrop-blur-xl`}
    >
      {done ? (
        <div className="py-4" data-testid={`${testid}-success`}>
          <div className="inline-flex items-center gap-2 text-weha-teal">
            <CheckCircle2 size={20} />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase">Sent · Check your downloads</span>
          </div>
          <h3 className="weha-display text-3xl mt-3 text-weha-text">
            {minimal ? "Your download is on its way." : "Your playbook is on its way."}
          </h3>
          <p className="mt-3 text-weha-muted leading-relaxed">
            If the download did not start,{" "}
            <a className="text-weha-teal underline" href={fileUrl} target="_blank" rel="noreferrer">
              click here to retry
            </a>
            .
          </p>
          <button
            onClick={() => { setDone(false); setForm(initial); }}
            className="btn-ghost mt-5"
            data-testid={`${testid}-reset`}
          >
            {minimal ? "Download another" : "Request another copy"}
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} data-testid={`${testid}-form`} className="space-y-4">
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
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] uppercase text-weha-teal">
              <BookOpen size={13} /> {minimal ? "Free download" : "Free · 28-page PDF"}
            </span>
            <h3 className="weha-display text-2xl md:text-3xl mt-2 text-weha-text leading-tight">{heading}</h3>
            <p className="mt-2 text-sm text-weha-muted leading-relaxed">
              {subheading
                ? subheading
                : minimal
                ? "Enter your name and email and we will open your download right away."
                : "The same diagnostic we use with paying clients. Playbooks, scorecards and 12 reference workflows."}
            </p>
          </div>

          {minimal ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="weha-label" htmlFor={`${testid}-name`}>Name</label>
                <input
                  id={`${testid}-name`} className="weha-input"
                  value={form.name} onChange={update("name")}
                  placeholder="Your name"
                  data-testid={`${testid}-name`}
                />
              </div>
              <div>
                <label className="weha-label" htmlFor={`${testid}-email`}>Work email</label>
                <input
                  id={`${testid}-email`} type="email" className="weha-input"
                  value={form.email} onChange={update("email")}
                  placeholder="you@company.com"
                  data-testid={`${testid}-email`}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="weha-label" htmlFor={`${testid}-name`}>Name</label>
                  <input
                    id={`${testid}-name`} className="weha-input"
                    value={form.name} onChange={update("name")}
                    placeholder="Your name"
                    data-testid={`${testid}-name`}
                  />
                </div>
                <div>
                  <label className="weha-label" htmlFor={`${testid}-company`}>Company</label>
                  <input
                    id={`${testid}-company`} className="weha-input"
                    value={form.company} onChange={update("company")}
                    placeholder="Company"
                    data-testid={`${testid}-company`}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="weha-label" htmlFor={`${testid}-designation`}>Designation</label>
                  <input
                    id={`${testid}-designation`} className="weha-input"
                    value={form.designation} onChange={update("designation")}
                    placeholder="e.g. Operations Manager"
                    data-testid={`${testid}-designation`}
                  />
                </div>
                <div>
                  <label className="weha-label" htmlFor={`${testid}-email`}>Work email</label>
                  <input
                    id={`${testid}-email`} type="email" className="weha-input"
                    value={form.email} onChange={update("email")}
                    placeholder="you@company.com"
                    data-testid={`${testid}-email`}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="weha-label" htmlFor={`${testid}-industry`}>Industry</label>
                  <input
                    id={`${testid}-industry`} className="weha-input"
                    value={form.industry} onChange={update("industry")}
                    placeholder="What your business does"
                    data-testid={`${testid}-industry`}
                  />
                </div>
                <div>
                  <label className="weha-label" htmlFor={`${testid}-country`}>Country</label>
                  <input
                    id={`${testid}-country`} className="weha-input"
                    value={form.country} onChange={update("country")}
                    placeholder="Where you are based"
                    data-testid={`${testid}-country`}
                  />
                </div>
              </div>

              <div>
                <label className="weha-label" htmlFor={`${testid}-session`}>
                  Open to a quick 15 to 30 min session to check your company&apos;s AI readiness?
                </label>
                <select
                  id={`${testid}-session`} className="weha-input"
                  value={form.session_interest} onChange={update("session_interest")}
                  data-testid={`${testid}-session`}
                >
                  <option value="">Select an option</option>
                  {SESSION_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-teal w-full justify-center disabled:opacity-60"
            data-cursor="hover"
            data-testid={`${testid}-submit`}
          >
            {submitting ? "Preparing your copy…" : (submitLabel || (minimal ? "Get the download" : "Download Playbook"))} <Download size={16} />
          </button>
          <p className="text-xs text-weha-faint leading-relaxed">
            We will never spam. Unsubscribe in one click. Your data stays private and is never shared.
          </p>
        </form>
      )}
    </div>
  );
}
