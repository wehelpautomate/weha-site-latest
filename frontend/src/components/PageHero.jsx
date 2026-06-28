import Reveal from "@/components/Reveal";
import PlaybookLeadForm from "@/components/PlaybookLeadForm";
import NetworkScene from "@/three/NetworkScene";

export default function PageHero({
  kicker,
  title,
  subtitle,
  italicWord,
  showForm = true,
  formHeading,
  formSubheading,
  formTestid = "hero-lead-form",
  formSource = "page-hero",
  formDownloadUrl,
  rightSlot,
}) {
  const hasRight = showForm || !!rightSlot;
  return (
    <section className="relative pt-32 md:pt-40 pb-16 md:pb-24 min-h-[72vh] flex items-center overflow-hidden">
      {/* 3D network is confined to the hero on inner pages */}
      <NetworkScene contained />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, var(--weha-bg) 0%, var(--weha-bg) 26%, color-mix(in srgb, var(--weha-bg) 45%, transparent) 52%, transparent 82%)",
        }}
      />
      <div
        className={`relative max-w-7xl mx-auto px-5 sm:px-8 w-full grid gap-12 items-center ${
          hasRight ? "lg:grid-cols-[1.05fr_0.95fr] lg:gap-16" : ""
        }`}
      >
        <div className={hasRight ? "max-w-xl" : "max-w-4xl"}>
          {kicker && (
            <Reveal>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-weha-teal">{kicker}</span>
            </Reveal>
          )}
          <Reveal delay={0.06}>
            <h1 className="weha-display text-4xl sm:text-5xl lg:text-6xl mt-4 text-weha-text leading-[1.05]">
              {title}{" "}
              {italicWord && <span className="italic text-weha-teal">{italicWord}</span>}
            </h1>
          </Reveal>
          {subtitle && (
            <Reveal delay={0.14}>
              <p className="mt-6 text-lg md:text-xl text-weha-muted max-w-2xl leading-relaxed">{subtitle}</p>
            </Reveal>
          )}
        </div>

        {showForm ? (
          <Reveal delay={0.2}>
            <PlaybookLeadForm
              heading={formHeading || "Get the AI Transformation Playbook"}
              subheading={formSubheading}
              testid={formTestid}
              source={formSource}
              downloadUrl={formDownloadUrl}
            />
          </Reveal>
        ) : rightSlot ? (
          <Reveal delay={0.2}>{rightSlot}</Reveal>
        ) : null}
      </div>
    </section>
  );
}
