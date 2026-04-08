import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Mic, Zap, MessageSquare, Heart, Brain, Activity, Volume2 } from "lucide-react";

function useFadeIn() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

const fadeStyle: React.CSSProperties = {
  opacity: 0,
  transform: "translateY(28px)",
  transition: "opacity 0.65s ease, transform 0.65s ease",
};

const STATS = [
  { number: "97M", label: "people worldwide live with speech-limiting conditions" },
  { number: "95%", label: "of ALS patients lose the ability to speak" },
  { number: "5 min", label: "is all it takes to preserve your voice forever" },
];

const STEPS = [
  {
    icon: <Mic className="w-7 h-7" />,
    title: "Record Naturally",
    description:
      "No reading 1,600 robotic sentences. Our 7 guided prompts are designed as natural conversation — tell us about your favorite meal, share good news, comfort a friend. You'll sound like yourself because you ARE being yourself.",
  },
  {
    icon: <Zap className="w-7 h-7" />,
    title: "Clone Instantly",
    description:
      "One tap sends your recordings to ElevenLabs' voice cloning AI. In under 30 seconds, you'll have a digital copy of your voice that captures your tone, warmth, and personality.",
  },
  {
    icon: <MessageSquare className="w-7 h-7" />,
    title: "Speak Forever",
    description:
      "Type anything and hear it in your own voice. Use quick phrases for daily needs, send voice messages to loved ones, or just hear yourself again whenever you need to.",
  },
];

const AUDIENCES = [
  {
    icon: <Activity className="w-5 h-5" />,
    title: "ALS / MND",
    description: "Progressive loss of speech affects up to 95% of patients",
  },
  {
    icon: <Brain className="w-5 h-5" />,
    title: "Parkinson's",
    description: "Voice changes are often one of the earliest symptoms",
  },
  {
    icon: <Heart className="w-5 h-5" />,
    title: "Stroke Recovery",
    description: "Speech difficulties affect 1 in 3 stroke survivors",
  },
  {
    icon: <Volume2 className="w-5 h-5" />,
    title: "Aging & Cancer",
    description: "Laryngectomy, vocal cord damage, and age-related voice loss",
  },
];

function FadeSection({ children, className = "", as: Tag = "section", delay = 0, ...rest }: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  delay?: number;
  [k: string]: unknown;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
          }, delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ ...fadeStyle, transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default function Landing() {
  const heroRef = useFadeIn();

  return (
    <div className="w-full flex flex-col bg-background text-foreground overflow-x-hidden">

      {/* ── HERO ── */}
      <section
        ref={heroRef as React.RefObject<HTMLElement>}
        style={fadeStyle}
        className="min-h-[100dvh] flex flex-col items-center justify-center text-center px-6 py-20 max-w-3xl mx-auto w-full"
        aria-labelledby="hero-heading"
      >
        <h1
          id="hero-heading"
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6"
        >
          Your Voice Is Who You Are.{" "}
          <span style={{ color: "#e07a5f" }}>Don't Lose It.</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mb-10">
          Every year, millions of people lose their ability to speak — to ALS, Parkinson's, stroke,
          cancer, and aging. VoiceVault lets you preserve your voice in just 5 minutes, so you can
          keep speaking as yourself, even when your body can't.
        </p>
        <Button
          asChild
          size="lg"
          className="min-h-[68px] min-w-[300px] text-xl rounded-2xl shadow-lg"
          style={{ background: "#e07a5f", color: "#fafaf9" }}
        >
          <Link href="/record" aria-label="Start preserving your voice now">
            Preserve My Voice Now
          </Link>
        </Button>
        <p className="mt-4 text-base text-muted-foreground">Free. No account needed. Takes 5 minutes.</p>
      </section>

      {/* ── IMPACT STATS ── */}
      <FadeSection
        className="w-full max-w-5xl mx-auto px-6 py-16"
        aria-label="Impact statistics"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {STATS.map((stat, i) => (
            <FadeSection
              key={stat.number}
              as="div"
              delay={i * 120}
              className="rounded-2xl p-8 text-center border border-border"
              style={{ ...fadeStyle, background: "#232342", transitionDelay: `${i * 120}ms` }}
              aria-label={`${stat.number}: ${stat.label}`}
            >
              <div
                className="text-5xl font-bold mb-3"
                style={{ color: "#e07a5f" }}
              >
                {stat.number}
              </div>
              <p className="text-lg text-foreground leading-snug">{stat.label}</p>
            </FadeSection>
          ))}
        </div>
      </FadeSection>

      {/* ── THE PROBLEM ── */}
      <FadeSection
        className="w-full max-w-3xl mx-auto px-6 py-16"
        aria-label="The Problem"
      >
        <h2 className="text-3xl font-bold mb-6">The Problem</h2>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Traditional voice banking requires reading 350 to 1,600 sentences in a clinical setting.
          It's exhausting, robotic, and most people give up or never start. By the time they're
          ready, their voice may have already changed. The tools that exist are either too expensive,
          too complex, or sound nothing like the real person.
        </p>
      </FadeSection>

      {/* ── HOW IT WORKS ── */}
      <FadeSection
        className="w-full max-w-3xl mx-auto px-6 py-16"
        aria-label="How VoiceVault Works"
      >
        <h2 className="text-3xl font-bold mb-10">How VoiceVault Works</h2>
        <div className="flex flex-col gap-8">
          {STEPS.map((step, i) => (
            <FadeSection
              key={step.title}
              as="div"
              delay={i * 130}
              className="flex gap-5 rounded-2xl border border-border p-6"
              style={{ ...fadeStyle, background: "#232342", transitionDelay: `${i * 130}ms` }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "rgba(224,122,95,0.15)", color: "#e07a5f" }}
                aria-hidden="true"
              >
                {step.icon}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center shrink-0"
                    style={{ background: "#e07a5f", color: "#fafaf9" }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </FadeSection>
          ))}
        </div>
      </FadeSection>

      {/* ── TESTIMONIAL ── */}
      <FadeSection
        className="w-full max-w-3xl mx-auto px-6 py-16"
        aria-label="Testimonial"
      >
        <blockquote
          className="rounded-2xl border border-border p-8 relative overflow-hidden"
          style={{ background: "#232342" }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
            style={{ background: "#e07a5f" }}
            aria-hidden="true"
          />
          <p className="text-2xl italic leading-relaxed text-foreground mb-6 pl-4">
            "I didn't want to communicate as a generic machine when technology was already capable of better."
          </p>
          <footer className="text-muted-foreground text-lg pl-4">
            — David Betts, ALS patient &amp; creator of Talk to Me, Goose!
          </footer>
        </blockquote>
      </FadeSection>

      {/* ── WHO IS THIS FOR ── */}
      <FadeSection
        className="w-full max-w-5xl mx-auto px-6 py-16"
        aria-label="Who VoiceVault is for"
      >
        <h2 className="text-3xl font-bold mb-10">Built For Those Who Need It Most</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {AUDIENCES.map((item, i) => (
            <FadeSection
              key={item.title}
              as="div"
              delay={i * 100}
              className="flex gap-4 rounded-2xl border border-border p-6"
              style={{ ...fadeStyle, background: "#232342", transitionDelay: `${i * 100}ms` }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(224,122,95,0.15)", color: "#e07a5f" }}
                aria-hidden="true"
              >
                {item.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                <p className="text-base text-muted-foreground">{item.description}</p>
              </div>
            </FadeSection>
          ))}
        </div>
      </FadeSection>

      {/* ── FINAL CTA ── */}
      <FadeSection
        className="w-full px-6 py-24 text-center"
        style={{ ...fadeStyle, background: "#232342" }}
        aria-label="Final call to action"
      >
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Your Voice Matters.{" "}
            <span style={{ color: "#e07a5f" }}>Preserve It Today.</span>
          </h2>
          <Button
            asChild
            size="lg"
            className="min-h-[68px] min-w-[320px] text-xl rounded-2xl shadow-lg"
            style={{ background: "#e07a5f", color: "#fafaf9" }}
          >
            <Link href="/record" aria-label="Start voice banking — it's free">
              Start Voice Banking — It's Free
            </Link>
          </Button>
          <p className="text-base text-muted-foreground pt-2">
            Built with ElevenLabs Voice Cloning · Powered by Replit
          </p>
        </div>
      </FadeSection>

      {/* ── FOOTER ── */}
      <footer
        className="w-full border-t border-border px-6 py-8 text-center text-sm text-muted-foreground space-y-3"
        aria-label="Footer"
      >
        <p className="font-medium text-foreground">VoiceVault — Built for #ElevenHacks</p>
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <a
            href="https://elevenlabs.io/impact"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            style={{ color: "#e07a5f" }}
          >
            ElevenLabs Impact Program
          </a>
          <a
            href="https://replit.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            style={{ color: "#e07a5f" }}
          >
            Powered by Replit
          </a>
        </div>
      </footer>

    </div>
  );
}
