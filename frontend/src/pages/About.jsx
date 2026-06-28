import PageHero from "@/components/PageHero";
import CTABanner from "@/components/CTABanner";
import Reveal from "@/components/Reveal";
import ScrollSection from "@/components/ScrollSection";
import IntegrationStrip from "@/components/IntegrationStrip";
import Magnetic from "@/components/Magnetic";
import Seo from "@/components/Seo";
import { Linkedin } from "lucide-react";
import { PLAYBOOK_URL } from "@/lib/resourceLinks";

const ASSET = (p) => `${process.env.PUBLIC_URL || ""}${p}`;

const story = [
  "Look at almost any capable team and you'll find the same thing: smart people losing hours every week to work software should be doing for them. Copying data between tools. Chasing the same follow-ups. Rebuilding the same report by hand, every single week.",
  "Most businesses already sense that AI could help. What they don't have is a clear place to start. And too many AI agencies make it worse, overcomplicating simple problems or locking clients into tools they can never leave.",
  "WeHA was started by two operators who had spent years building marketing and automation systems for other people. They decided to build the agency they wished existed: one that builds practical systems on the tools you already use, proves they work, then hands them over.",
];

const belief = "Automation should give you ownership and time back, not another subscription you're trapped in.";

const mission =
  "To make practical AI automation accessible to any business: built fast, built on the tools you already use, and built to be owned by you.";

const vision =
  "A world where small and mid-sized teams compete on ideas and service, not on how many hours they can grind, because the repetitive work runs itself.";

const founders = [
  {
    name: "Imran Shaikh",
    role: "Co-Founder",
    photo: ASSET("/founders/imran.jpeg"),
    alt: "Portrait of Imran Shaikh, Co-Founder of WeHA",
    bio: "Imran is a full-stack marketer and AI systems builder with 8+ years across SEO, paid media, content, analytics and RevOps. He builds AI agents and automated workflows on a modern stack including OpenClaw, n8n, Claude Code and Zapier, and believes marketing and operations should run on systems, not manual effort. An IIM Kozhikode alum (Digital Marketing for Performance & Growth), he leads what WeHA builds: the automation systems and AI agents behind every engagement.",
  },
  {
    name: "Selena Thomas",
    role: "Co-Founder & COO",
    photo: ASSET("/founders/selena.jpeg"),
    alt: "Portrait of Selena Thomas, Co-Founder and COO of WeHA",
    bio: "Selena is a digital marketing leader with experience across Mastercard, Merkle Sokrati and Cybage. She leads operations, client relationships and go-to-market at WeHA, making sure every engagement starts with the right questions and that clients get a clear, human experience from the first call to handoff.",
    linkedin: "https://www.linkedin.com/in/selena-thomas-9839472b8/",
  },
];

const values = [
  ["You own what we build", "Every system is documented and handed over. No lock-in, ever."],
  ["Specific over vague", "We build named systems that solve real workflows, not fuzzy 'AI transformation.'"],
  ["Your tools stay", "We automate on top of what you already use. No forced migrations."],
  ["Prove it first", "Every engagement starts with one workflow and proven results before you expand."],
  ["Plain English, always", "No jargon in calls, proposals, or docs. You always understand what's running."],
];

export default function About() {
  return (
    <div data-testid="about-page" className="overflow-x-hidden">
      <Seo
        title="About WeHA - the people behind your automation"
        description="WeHA is an AI automation studio built by two operators who'd rather you spend time on what matters. We build practical systems on the tools you already use, and hand them over."
        path="/about"
      />
      <PageHero
        kicker="About"
        title="We help businesses do more"
        italicWord="with less manual work."
        subtitle="WeHA exists because too many capable teams spend their days on work software should be doing for them. We build the systems that give that time back."
        formHeading="Get the free AI Transformation Playbook"
        formSubheading="A practical 10-chapter framework for figuring out where AI fits, what to automate first, and how to roll it out. No jargon, no obligation."
        formTestid="about-lead-form"
        formSource="playbook:about-hero"
        formDownloadUrl={PLAYBOOK_URL}
      />

      <IntegrationStrip heading="The tools we build with" />

      {/* SECTION 1 - OUR STORY */}
      <ScrollSection direction="left">
      <section className="section-glass relative section-solid py-12 md:py-20" data-testid="about-story">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <Reveal>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-weha-teal">Why WeHA exists</span>
            <h2 className="weha-display text-4xl md:text-5xl mt-3 text-weha-text leading-tight">
              The work nobody should be doing by hand.
            </h2>
          </Reveal>
          <div className="mt-8 space-y-6 text-lg text-weha-muted leading-relaxed">
            {story.map((p, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <p className={i === 0 ? "text-weha-text" : ""}>{p}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <p className="mt-10 weha-display text-2xl md:text-3xl text-weha-text italic leading-snug border-l-[3px] border-weha-teal pl-5">
              {belief}
            </p>
          </Reveal>
        </div>
      </section>
      </ScrollSection>

      {/* SECTION 2 - MISSION & VISION */}
      <ScrollSection direction="right">
      <section className="section-glass py-20 md:py-28 bg-weha-surface border-y border-weha-border" data-testid="about-mission-vision">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid gap-12 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-weha-teal">Our mission</span>
              <p className="weha-display text-3xl md:text-4xl mt-4 text-weha-text leading-snug">{mission}</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-weha-teal">Our vision</span>
              <p className="weha-display text-3xl md:text-4xl mt-4 text-weha-text leading-snug">{vision}</p>
            </div>
          </Reveal>
        </div>
      </section>
      </ScrollSection>

      {/* SECTION 3 - MEET THE FOUNDERS */}
      <ScrollSection direction="left">
      <section className="section-glass relative section-solid py-20 md:py-28" data-testid="about-founders">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-weha-teal">The team</span>
            <h2 className="weha-display text-4xl md:text-5xl mt-3 text-weha-text">Meet the founders.</h2>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {founders.map((f, i) => (
              <Reveal key={f.name} delay={(i % 2) * 0.1}>
                <article className="weha-card h-full p-7 md:p-8" data-testid={`founder-card-${i + 1}`}>
                  <div className="overflow-hidden rounded-2xl border border-weha-border bg-weha-surface aspect-square w-32 md:w-40">
                    <img
                      src={f.photo}
                      alt={f.alt}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      data-testid={`founder-photo-${i + 1}`}
                    />
                  </div>
                  <div className="mt-6 flex items-center gap-3 flex-wrap">
                    <h3 className="weha-display text-3xl text-weha-text">{f.name}</h3>
                    {f.linkedin && (
                      <Magnetic strength={0.3}>
                        <a
                          href={f.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${f.name} on LinkedIn`}
                          data-cursor="hover"
                          data-testid={`founder-linkedin-${i + 1}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-weha-border text-weha-muted transition-colors hover:border-weha-teal hover:text-weha-teal"
                        >
                          <Linkedin size={16} />
                        </a>
                      </Magnetic>
                    )}
                  </div>
                  <p className="mt-1 text-sm uppercase tracking-wider text-weha-teal">{f.role}</p>
                  <p className="mt-4 text-weha-muted leading-relaxed">{f.bio}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      </ScrollSection>

      {/* SECTION 4 - VALUES */}
      <ScrollSection direction="right">
      <section className="section-glass py-20 md:py-28 bg-weha-surface border-y border-weha-border" data-testid="about-values">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal>
            <h2 className="weha-display text-4xl md:text-5xl text-weha-text">What we believe.</h2>
          </Reveal>
          <div className="mt-12 divide-y divide-weha-border border-t border-weha-border">
            {values.map(([title, body], i) => (
              <Reveal key={title} delay={(i % 3) * 0.06}>
                <div className="py-7 grid gap-2 md:grid-cols-[auto_1fr] md:gap-10 items-baseline">
                  <span className="weha-display text-2xl text-weha-teal/40 w-12">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="weha-display text-2xl md:text-3xl text-weha-text">{title}</h3>
                    <p className="mt-1.5 text-weha-muted text-lg">{body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      </ScrollSection>

      {/* SECTION 5 - CTA BANNER */}
      <ScrollSection direction="left">
      <CTABanner
        heading="Let's give your team its time back."
        sub="Start with a free AI Audit. We map how you work, then show you what's worth automating first."
        cta="Book a Free Audit"
        testid="about-cta"
      />
      </ScrollSection>
    </div>
  );
}
