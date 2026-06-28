import { useState } from "react";
import PageHero from "@/components/PageHero";
import CTABanner from "@/components/CTABanner";
import Reveal from "@/components/Reveal";
import ScrollSection from "@/components/ScrollSection";
import IntegrationStrip from "@/components/IntegrationStrip";
import LeadCalculator from "@/components/LeadCalculator";
import Seo from "@/components/Seo";
import { Sparkles, Check } from "lucide-react";

/* ------------------------------------------------------------------ *
 * Time Saved Calculator (Work hero).
 * Simple multiplication only. Each task type maps to the share of that
 * task automation typically handles.
 * ------------------------------------------------------------------ */
const timeInputs = [
  {
    label: "Which task eats the most time?",
    key: "task",
    options: [
      { label: "Data entry between tools", value: 0.85 },
      { label: "Chasing follow-ups", value: 0.7 },
      { label: "Building reports", value: 0.8 },
      { label: "Scheduling and reminders", value: 0.9 },
    ],
  },
  {
    label: "How often does it happen?",
    key: "frequency",
    options: [
      { label: "Several times a day", value: 10 },
      { label: "Daily", value: 5 },
      { label: "A few times a week", value: 3 },
      { label: "Weekly", value: 1 },
    ],
  },
  {
    label: "Roughly how long each time?",
    key: "minutes",
    options: [
      { label: "5 minutes", value: 5 },
      { label: "15 minutes", value: 15 },
      { label: "30 minutes", value: 30 },
      { label: "1 hour", value: 60 },
    ],
  },
];

const round1 = (n) => Math.round(n * 10) / 10;

const computeTime = (v) => {
  const weeklyMinutesNow = v.frequency * v.minutes;
  const weeklyMinutesSaved = weeklyMinutesNow * v.task;
  const weeklyHoursSaved = weeklyMinutesSaved / 60;
  return {
    headline: `You could reclaim about ${round1(weeklyHoursSaved)} hours a week on this one task.`,
    lines: [
      `That is roughly ${round1(weeklyHoursSaved * 4.3)} hours a month, freed up automatically.`,
      "Most teams reinvest that time into work that actually grows the business, not the busywork.",
    ],
    note: "This estimate is for a single task. Most businesses have several like it. The percentages reflect how much of each task type automation typically handles. A free AI Audit maps your real tasks precisely.",
  };
};

/* ------------------------------------------------------------------ *
 * Tech-stack logo treatment.
 * Real product logos are sourced two ways: Simple Icons CDN (brand-colored
 * glyphs) for tools it carries, and the Google favicon service for real
 * products it does not (Apify, Apollo, Instantly, Clay). Generic build
 * concepts that have no brand (Custom SEO agent, Custom UI, LLM models, AI
 * screening agents, Document automation, Workflow orchestration) render as
 * clean text pills. If any image fails to load, onError swaps to the text
 * pill so a broken image is never shown.
 * ------------------------------------------------------------------ */
const TOOL_LOGOS = {
  "Claude Code": "https://cdn.simpleicons.org/claude",
  "Claude Projects": "https://cdn.simpleicons.org/claude",
  "n8n": "https://cdn.simpleicons.org/n8n",
  "Apify": "https://www.google.com/s2/favicons?domain=apify.com&sz=128",
  "Apollo": "https://www.google.com/s2/favicons?domain=apollo.io&sz=128",
  "Instantly": "https://www.google.com/s2/favicons?domain=instantly.ai&sz=128",
  "Clay": "https://www.google.com/s2/favicons?domain=clay.com&sz=128",
};

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function StackChip({ name }) {
  const src = TOOL_LOGOS[name];
  const [failed, setFailed] = useState(false);
  const showLogo = src && !failed;

  return (
    <span
      className="inline-flex items-center gap-2.5 rounded-full border border-weha-border bg-weha-bg px-4 py-2.5 text-sm font-medium text-weha-text transition-transform duration-300 hover:-translate-y-0.5"
      title={name}
      data-testid={`stack-chip-${slugify(name)}`}
    >
      {showLogo ? (
        <img
          src={src}
          alt={`${name} logo`}
          loading="lazy"
          className="h-5 w-5 object-contain rounded-[4px]"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-weha-teal shrink-0" />
      )}
      <span className="whitespace-nowrap">{name}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Case studies. Anonymized, industry-agnostic, light content by design.
 * ------------------------------------------------------------------ */
const caseStudies = [
  {
    descriptor: "Multi-vertical group of seven companies",
    title: "Automated SEO and Content Engine",
    problem:
      "Seven companies under one group needed to stay visible and publish consistently across every brand, without a large in-house team.",
    built:
      "We deployed a custom forked Claude Code SEO agent with its own UI for all-round SEO, plus a content generation system in Claude Projects that produces, distributes, and repurposes content across platforms from a few simple inputs.",
    stack: ["Claude Code", "Custom SEO agent", "Claude Projects", "Custom UI"],
    outcome: "SEO and multi-platform content for seven brands, run by a small team.",
  },
  {
    descriptor: "B2B services company",
    title: "Inbound and Outbound Lead Engine",
    problem:
      "Lead generation was manual and inconsistent across both website inbound and cold email outbound.",
    built:
      "An automated inbound capture flow from landing pages, paired with an automated outbound cold email engine, with a human kept in the loop where judgment was needed.",
    stack: ["Apify", "Apollo", "Instantly", "n8n"],
    outcome: "A self-running lead and outreach system that fills the funnel without daily manual work.",
  },
  {
    descriptor: "Professional services firm",
    title: "Lead Enrichment and Proposal Automation",
    problem:
      "Leads were researched by hand, proposals written manually, and follow-ups were inconsistent.",
    built:
      "Incoming leads are enriched automatically, a tailored proposal is generated from that data and sent to the prospect, and follow-ups are scheduled at day three and day seven.",
    stack: ["Clay", "Apify", "LLM models", "Instantly"],
    outcome: "From raw lead to sent proposal to timed follow-up, with no manual drafting between.",
  },
  {
    descriptor: "High-volume hiring team",
    title: "AI Recruitment Pipeline",
    problem:
      "Inbound resumes needed screening, document collection, and candidate prep, all manual and slow.",
    built:
      "A pipeline that reaches out to inbound candidates, screens them with AI, collects required documents, prepares each candidate for the role with a tailored PDF brief, and keeps the hiring manager informed.",
    stack: ["AI screening agents", "Document automation", "Workflow orchestration"],
    outcome: "Screening and candidate prep run automatically, with the recruiter always in the loop.",
  },
];

function CaseStudyCard({ study, index }) {
  const num = String(index + 1).padStart(2, "0");
  return (
    <article
      className="weha-card relative overflow-hidden p-8 md:p-14"
      data-testid={`work-case-${index + 1}`}
    >
      {/* thin teal top accent */}
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--weha-teal), transparent)",
        }}
      />

      {/* oversized faint number backdrop */}
      <span
        aria-hidden="true"
        className="weha-display pointer-events-none absolute -top-6 right-2 md:-top-10 md:right-6 select-none leading-none"
        style={{
          fontSize: "clamp(7rem, 16vw, 13rem)",
          color: "var(--weha-teal)",
          opacity: 0.07,
        }}
      >
        {num}
      </span>

      <div className="relative">
        {/* descriptor + glyph */}
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-weha-teal shrink-0" />
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-weha-teal">
            {study.descriptor}
          </span>
        </div>

        {/* title */}
        <h2 className="weha-display text-3xl md:text-5xl mt-4 text-weha-text max-w-3xl">
          {study.title}
        </h2>

        {/* problem + built */}
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <span className="weha-label uppercase tracking-widest text-xs">The problem</span>
            <p className="text-weha-muted leading-relaxed">{study.problem}</p>
          </div>
          <div>
            <span className="weha-label uppercase tracking-widest text-xs">What we built</span>
            <p className="text-weha-text leading-relaxed">{study.built}</p>
          </div>
        </div>

        {/* stack: the visual centerpiece */}
        <div
          className="mt-10 rounded-2xl border border-weha-border p-6 md:p-7"
          style={{
            background:
              "linear-gradient(135deg, var(--weha-teal-soft), color-mix(in srgb, var(--weha-surface) 70%, transparent))",
          }}
        >
          <span className="weha-label uppercase tracking-widest text-xs">Stack</span>
          <div className="mt-1 flex flex-wrap gap-2.5 md:gap-3">
            {study.stack.map((tool) => (
              <StackChip key={tool} name={tool} />
            ))}
          </div>
        </div>

        {/* outcome */}
        <div className="mt-8 flex items-start gap-3 border-l-2 border-weha-teal pl-5">
          <Check size={18} className="text-weha-teal mt-1 shrink-0" />
          <div>
            <span className="weha-label uppercase tracking-widest text-xs">Outcome</span>
            <p className="weha-display text-xl md:text-2xl text-weha-text leading-snug">
              {study.outcome}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Work() {
  return (
    <div data-testid="work-page" className="overflow-x-hidden">
      <Seo
        title="Work, anonymized automation builds"
        description="A look at automation systems we have designed and shipped: automated SEO and content engines, inbound and outbound lead generation, proposal automation, and AI recruitment pipelines. Built on the tools you already use, with a human in the loop where it matters. Client names stay private."
        path="/work"
      />

      <PageHero
        kicker="Our Work"
        title="Real systems, built for real"
        italicWord="teams."
        subtitle="A look at automation systems we have designed and shipped. Client names stay private. The work speaks for itself."
        showForm={false}
        rightSlot={
          <LeadCalculator
            title="Time Saved Calculator"
            subtitle="Pick the task that eats your week and see roughly how many hours automation could hand back."
            inputs={timeInputs}
            compute={computeTime}
            source="calculator:work"
            testid="work-time-calculator"
          />
        }
      />

      <IntegrationStrip heading="The tools behind the builds" />

      {/* TOP FILLER: proof, not promises */}
      <ScrollSection direction="right">
        <section className="section-glass py-16 md:py-20 bg-weha-surface border-y border-weha-border">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 text-center">
            <Reveal>
              <span className="text-xs font-semibold tracking-[0.22em] uppercase text-weha-teal">
                Proof, not promises
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="weha-display text-3xl md:text-4xl mt-5 text-weha-text leading-[1.1]">
                Different businesses, the same method.
              </h2>
            </Reveal>
            <Reveal delay={0.14}>
              <p className="mt-5 text-lg text-weha-muted leading-relaxed max-w-2xl mx-auto">
                We build on the tools you already use, keep a human in the loop where it matters,
                and hand over a system you own.
              </p>
            </Reveal>
          </div>
        </section>
      </ScrollSection>

      {/* CASE STUDIES: core, design-forward */}
      <section className="section-glass relative section-solid py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 space-y-12 md:space-y-16">
          {caseStudies.map((study, i) => (
            <ScrollSection key={study.title} direction={i % 2 === 0 ? "left" : "right"}>
              <CaseStudyCard study={study} index={i} />
            </ScrollSection>
          ))}
        </div>
      </section>

      {/* BOTTOM FILLER: tie together, bridge to Services */}
      <ScrollSection direction="left">
        <section className="section-glass py-16 md:py-24 bg-weha-surface border-y border-weha-border">
          <div className="max-w-4xl mx-auto px-5 sm:px-8">
            <Reveal>
              <span className="text-xs font-semibold tracking-[0.22em] uppercase text-weha-teal">
                One method, any business
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="weha-display text-3xl md:text-5xl mt-5 text-weha-text leading-[1.08]">
                Across very different teams, the approach stays the same.
              </h2>
            </Reveal>
            <Reveal delay={0.14}>
              <div className="mt-7 space-y-3">
                {[
                  "We build on the tools you already use.",
                  "We keep humans in the loop where judgment matters.",
                  "We hand over a system you own, not a black box.",
                ].map((line) => (
                  <div key={line} className="flex items-start gap-3">
                    <Check size={18} className="text-weha-teal mt-1 shrink-0" />
                    <span className="text-lg text-weha-text leading-relaxed">{line}</span>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-8 text-lg text-weha-muted leading-relaxed">
                The fastest way to see it is on your own workflow. Bring us the manual process eating
                your week, and we will map the automated version with you.
              </p>
            </Reveal>
          </div>
        </section>
      </ScrollSection>

      <CTABanner
        heading="Your workflow could be next."
        sub="Tell us the manual process eating your week, and we will show you the automated version."
        cta="Book a Free Audit"
        testid="work-cta"
      />
    </div>
  );
}
