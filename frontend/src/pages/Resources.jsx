import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Workflow, FileText } from "lucide-react";
import PageHero from "@/components/PageHero";
import CTABanner from "@/components/CTABanner";
import Reveal from "@/components/Reveal";
import ScrollSection from "@/components/ScrollSection";
import IntegrationStrip from "@/components/IntegrationStrip";
import Seo from "@/components/Seo";
import { PLAYBOOK_URL } from "@/lib/resourceLinks";

const resources = [
  {
    to: "/resources/workbooks",
    icon: BookOpen,
    title: "Free Workbooks",
    desc: "Step-by-step printable workbooks to map and prioritise the manual workflows worth automating first.",
    tag: "Workbooks",
  },
  {
    to: "/resources/workflow-automations",
    icon: Workflow,
    title: "Free Workflow Automations",
    desc: "Ready-to-import n8n / Make blueprints you can plug into your own stack in minutes.",
    tag: "Templates",
  },
  {
    to: "/resources/ebooks",
    icon: FileText,
    title: "Free eBooks",
    desc: "Practical guides on automating any business, built from real client work.",
    tag: "eBooks",
  },
];

export default function Resources() {
  return (
    <div data-testid="resources-page" className="overflow-x-hidden">
      <Seo
        title="Resources, free workbooks, automations and eBooks"
        description="Free WeHA resources: practical workbooks, ready-to-import workflow automations, and eBooks on automating any business, built from real client work."
        path="/resources"
      />
      <PageHero
        kicker="Resources"
        title="Free tools to start"
        italicWord="automating today."
        subtitle="A growing library of practical, no-cost resources. Workbooks, automation blueprints, and eBooks, built from real client work."
        formHeading="Get the free AI Transformation Playbook"
        formSubheading="A practical 10-chapter framework for figuring out where AI fits, what to automate first, and how to roll it out. No jargon, no obligation."
        formTestid="resources-lead-form"
        formSource="playbook:resources-hero"
        formDownloadUrl={PLAYBOOK_URL}
      />

      <IntegrationStrip heading="Built for the tools you already run" />

      <ScrollSection direction="left" settle depth={0} intensity={0.4}>
        <section className="section-glass relative section-solid py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <Reveal>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-weha-teal">The library</span>
              <h2 className="weha-display text-3xl md:text-5xl mt-3 text-weha-text">Pick where you want to start.</h2>
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {resources.map((r, i) => {
                const Icon = r.icon;
                return (
                  <Reveal key={r.to} delay={i * 0.08}>
                    <Link
                      to={r.to}
                      data-testid={`resource-card-${i}`}
                      data-cursor="hover"
                      className="weha-card group block h-full p-8 transition-transform hover:-translate-y-1"
                    >
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-weha-teal-soft text-weha-teal">
                        <Icon size={22} />
                      </span>
                      <span className="mt-6 block text-xs font-semibold tracking-widest uppercase text-weha-faint">{r.tag}</span>
                      <h3 className="weha-display text-2xl mt-2 text-weha-text">{r.title}</h3>
                      <p className="mt-3 text-weha-muted leading-relaxed">{r.desc}</p>
                      <span className="mt-6 inline-flex items-center gap-2 text-weha-teal font-medium">
                        Browse {r.tag} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      </ScrollSection>

      <ScrollSection direction="right" settle depth={0.35} intensity={0.45}>
        <CTABanner
          heading="Want something built for your exact workflow?"
          sub="Book a free AI Audit and we will map your top 3 automatable workflows, live."
          testid="resources-cta"
        />
      </ScrollSection>
    </div>
  );
}
