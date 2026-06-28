import PageHero from "@/components/PageHero";
import CTABanner from "@/components/CTABanner";
import Reveal from "@/components/Reveal";
import ScrollSection from "@/components/ScrollSection";
import IntegrationStrip from "@/components/IntegrationStrip";
import Magnetic from "@/components/Magnetic";
import LeadCalculator from "@/components/LeadCalculator";
import Seo from "@/components/Seo";
import { ArrowRight } from "lucide-react";
import { useBooking } from "@/context/BookingContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ------------------------------------------------------------------ *
 * Automation ROI Calculator (Services hero).
 * Simple multiplication only. Automation is assumed to remove about
 * 70 percent of repetitive admin time (a fixed, conservative factor).
 * ------------------------------------------------------------------ */
const roiInputs = [
  {
    label: "How many people do repetitive admin work?",
    key: "people",
    options: [
      { label: "1", value: 1 },
      { label: "2 to 3", value: 2.5 },
      { label: "4 to 6", value: 5 },
      { label: "7 plus", value: 8 },
    ],
  },
  {
    label: "Roughly how many hours each, per week, on repetitive tasks?",
    key: "hours",
    options: [
      { label: "2", value: 2 },
      { label: "5", value: 5 },
      { label: "10", value: 10 },
      { label: "15 plus", value: 15 },
    ],
  },
  {
    label: "Rough cost level of that time?",
    key: "rate",
    options: [
      { label: "Entry level", value: 15 },
      { label: "Mid level", value: 25 },
      { label: "Senior level", value: 40 },
    ],
  },
];

const computeRoi = (v) => {
  const weeklyHoursSaved = v.people * v.hours * 0.7;
  const weekly = Math.round(weeklyHoursSaved);
  const monthly = Math.round(weeklyHoursSaved * 4.3);
  const yearly = Math.round(weeklyHoursSaved * 52);
  const valuePerYear = Math.round(weeklyHoursSaved * 52 * v.rate);
  return {
    headline: `About ${weekly} hours a week could be given back to your team.`,
    lines: [
      `That is roughly ${monthly} hours a month and ${yearly} hours a year.`,
      `At your selected cost level, that is about ${valuePerYear.toLocaleString()} in value reclaimed per year, in your own currency.`,
    ],
    note: "This is a simple estimate to show the scale of the opportunity. Real savings depend on your exact workflows, which is what a free AI Audit maps precisely. The 70 percent figure reflects the share of repetitive admin that automation typically removes.",
  };
};

const pillars = [
  {
    n: "Pillar 01",
    name: "Deterministic AI Solutions",
    title: "Connect your tools so they finally talk to each other",
    desc: "Rule-based, reliable automations that move data and trigger actions between the apps you already use. Predictable, fast to deploy, and running quietly in the background so your team stops doing it by hand.",
    looks: [
      "Lead capture & routing",
      "Data sync between apps",
      "Automated reports",
      "Notifications & reminders",
      "Document generation",
    ],
    built: "n8n, Make.com, Zapier, Google Workspace automation, and your existing app stack.",
    cta: "Automate My Tools",
  },
  {
    n: "Pillar 02",
    name: "Autonomous Agentic AI Solutions",
    title: "AI that reasons, decides, and gets work done on its own",
    desc: "Custom AI agents that handle tasks needing judgment. They read and respond, triage, draft, and make multi-step decisions end to end, instead of just following fixed rules.",
    looks: [
      "Inbox & ticket triage",
      "First-draft generation",
      "Research & summarization",
      "Multi-step task execution",
      "Autonomous follow-through",
    ],
    built: "OpenClaw, Hermes, Claude Code, and modern agent frameworks.",
    cta: "Build My AI Agent",
  },
  {
    n: "Pillar 03",
    name: "AI Transformation Consulting",
    title: "A clear AI roadmap, without the guesswork",
    desc: "Purely advisory. We help you understand where AI fits in your business, what to automate first, how to sequence it, and how to avoid expensive mistakes. This is consulting and strategy only: we advise, we don't build, in this engagement.",
    looks: [
      "AI readiness assessment",
      "Opportunity mapping",
      "Prioritization roadmap",
      "Tool & vendor guidance",
      "Team enablement",
    ],
    outcome: "A documented roadmap your team can act on.",
    cta: "Get My Roadmap",
  },
];

const fits = [
  { problem: "You know exactly what should happen, every time.", pillar: "Deterministic AI Solutions" },
  { problem: "The task needs judgment, reading, or decisions.", pillar: "Autonomous Agentic AI Solutions" },
  { problem: "You're not sure where AI even fits yet.", pillar: "AI Transformation Consulting" },
];

const howWeWork = [
  "Every engagement starts with a free AI Audit. We map how you work before building anything.",
  "We build on the tools you already use. No forced migrations, no rip-and-replace.",
  "Everything we build is documented and handed off. You own it completely, even if you stop working with us.",
  "We pilot, prove it works, then expand. You see results before you commit further.",
];

const faqs = [
  ["Do I have to switch software or tools?", "No. We automate on top of what you already use."],
  ["What's the difference between deterministic and agentic automation?", "Deterministic follows fixed rules reliably. Agentic handles tasks needing judgment and reasoning. We'll recommend the right fit for each workflow."],
  ["Do you only build, or can you just advise?", "Both. Our consulting track is purely advisory if you want a roadmap without a build."],
  ["What happens if an automation breaks?", "Everything is documented and handed off, and we offer support so nothing leaves you stranded."],
  ["How quickly can we see something working?", "Most first automations are live in days, not months, often a working demo within the first session."],
  ["How do we get started?", "Book a free AI Audit. We map your workflows and show you what's worth automating first."],
];

export default function Services() {
  const { openBooking } = useBooking();

  return (
    <div data-testid="services-page" className="overflow-x-hidden">
      <Seo
        title="Services - Deterministic automation, Agentic AI & AI Transformation Consulting"
        description="WeHA helps you work smarter three ways: deterministic tool-to-tool automation, autonomous AI agents, and advisory AI transformation consulting. Built on the tools you already use."
        path="/services"
      />
      <PageHero
        kicker="Services"
        title="Three ways we help you"
        italicWord="work smarter."
        subtitle="From simple tool-to-tool automation, to autonomous AI agents, to hands-on transformation strategy. We meet you wherever you are on the journey."
        showForm={false}
        rightSlot={
          <LeadCalculator
            title="Automation ROI Calculator"
            subtitle="See roughly how much time and value your team could reclaim by automating repetitive admin work."
            inputs={roiInputs}
            compute={computeRoi}
            source="calculator:services"
            testid="services-roi-calculator"
          />
        }
      />

      <IntegrationStrip heading="Plays nice with your whole toolbox" />

      {/* SECTION 1 - THE THREE PILLARS */}
      <ScrollSection direction="left">
      <section className="section-glass relative section-solid py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-weha-teal">What we do</span>
            <h2 className="weha-display text-3xl md:text-5xl mt-3 text-weha-text">Three pillars, one outcome.</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-3 items-stretch">
            {pillars.map((s, i) => (
              <Reveal key={s.n} delay={(i % 3) * 0.08}>
                <article className="weha-card h-full p-8 flex flex-col" data-testid={`pillar-card-${i + 1}`}>
                  <span className="text-xs font-semibold tracking-widest uppercase text-weha-teal">{s.n}</span>
                  <h2 className="weha-display text-2xl md:text-3xl mt-3 text-weha-text leading-tight">{s.title}</h2>
                  <p className="mt-2 text-xs uppercase tracking-wider text-weha-faint">{s.name}</p>
                  <p className="mt-5 text-weha-muted leading-relaxed">{s.desc}</p>

                  <div className="mt-6 border-t border-weha-border pt-6">
                    <p className="weha-label">What this looks like</p>
                    <ul className="space-y-2.5">
                      {s.looks.map((g) => (
                        <li key={g} className="flex gap-3 text-weha-text">
                          <span className="text-weha-teal mt-1.5 h-1.5 w-1.5 rounded-full bg-weha-teal shrink-0" />
                          {g}
                        </li>
                      ))}
                    </ul>
                    {s.built ? (
                      <>
                        <p className="weha-label mt-6">Built with</p>
                        <p className="text-weha-muted leading-relaxed text-sm">{s.built}</p>
                      </>
                    ) : (
                      <>
                        <p className="weha-label mt-6">Outcome</p>
                        <p className="text-weha-muted leading-relaxed text-sm">{s.outcome}</p>
                      </>
                    )}
                  </div>

                  <div className="mt-auto pt-8">
                    <Magnetic strength={0.3} className="w-full">
                      <button
                        type="button"
                        onClick={openBooking}
                        data-testid={`pillar-cta-${i + 1}`}
                        data-cursor="hover"
                        className="btn-teal w-full justify-center"
                      >
                        {s.cta} <ArrowRight size={16} />
                      </button>
                    </Magnetic>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      </ScrollSection>

      {/* SECTION 2 - WHICH ONE FITS YOU? */}
      <ScrollSection direction="right">
      <section className="section-glass py-20 md:py-28 bg-weha-surface border-y border-weha-border" data-testid="services-fit">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-weha-teal">Find your fit</span>
            <h2 className="weha-display text-4xl md:text-5xl mt-3 text-weha-text">Which one fits you?</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {fits.map((f, i) => (
              <Reveal key={f.pillar} delay={(i % 3) * 0.08}>
                <div className="weha-card h-full p-7 flex flex-col" data-testid={`fit-card-${i + 1}`}>
                  <p className="text-lg text-weha-text leading-relaxed">{f.problem}</p>
                  <div className="mt-auto pt-6">
                    <p className="weha-label">Start with</p>
                    <p className="weha-display text-2xl text-weha-teal leading-tight">{f.pillar}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
              <p className="text-lg text-weha-muted">{"Still unsure? That's what the free audit is for."}</p>
              <Magnetic strength={0.3}>
                <button
                  type="button"
                  onClick={openBooking}
                  data-testid="services-fit-cta"
                  data-cursor="hover"
                  className="btn-teal"
                >
                  Book a Free Audit <ArrowRight size={16} />
                </button>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </section>
      </ScrollSection>

      {/* SECTION 3 - HOW WE WORK */}
      <ScrollSection direction="left">
      <section className="section-glass py-20 md:py-28" data-testid="services-how">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal>
            <h2 className="weha-display text-4xl md:text-5xl text-weha-text">How we work.</h2>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {howWeWork.map((s, i) => (
              <Reveal key={i} delay={(i % 2) * 0.08}>
                <div className="flex gap-5">
                  <span className="weha-display text-3xl text-weha-teal/40">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-lg text-weha-text leading-relaxed">{s}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      </ScrollSection>

      {/* SECTION 4 - FAQ */}
      <ScrollSection direction="right">
      <section className="section-glass py-20 md:py-28 bg-weha-surface border-y border-weha-border" data-testid="services-faq">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <Reveal>
            <h2 className="weha-display text-4xl md:text-5xl text-weha-text">Questions, answered.</h2>
          </Reveal>
          <Reveal delay={0.05}>
            <Accordion type="single" collapsible className="mt-8" data-testid="services-faq-accordion">
              {faqs.map(([q, a], i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-weha-border">
                  <AccordionTrigger
                    className="text-left text-lg text-weha-text hover:text-weha-teal hover:no-underline"
                    data-testid={`services-faq-trigger-${i}`}
                  >
                    {q}
                  </AccordionTrigger>
                  <AccordionContent className="text-weha-muted text-base leading-relaxed">
                    {a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>
      </ScrollSection>

      {/* SECTION 5 - CTA BANNER */}
      <ScrollSection direction="left">
      <CTABanner
        heading="Not sure where to start? Let's map it out together."
        sub="Book a free AI Audit. We map how you work, then show you what's worth automating first."
        cta="Book a Free Audit"
        testid="services-cta"
      />
      </ScrollSection>
    </div>
  );
}
