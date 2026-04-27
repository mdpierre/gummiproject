import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mic, Sparkles } from 'lucide-react';
import { lessons } from '../data/lessons';
import { stories } from '../data/stories';
import { topics } from '../data/topics';
import { MODULES } from '../modules';
import { GummyMascot } from '../components/GummyMascot';
import { useVoice } from '../hooks/useVoice';
import { useProfile } from '../context/ProfileContext';
import { DEMO_HERO } from '../lib/demoMvp';

const previewItems = [
  {
    title: MODULES['what-is-a-chatbot'].title,
    label: 'Module Preview',
    emoji: '💬',
  },
  {
    title: MODULES['how-ai-gets-information'].title,
    label: 'Module Preview',
    emoji: '🧠',
  },
  {
    title: stories[0].title,
    label: 'Story Preview',
    emoji: stories[0].emoji,
  },
  {
    title: stories[1].title,
    label: 'Story Preview',
    emoji: stories[1].emoji,
  },
  {
    title: lessons[1].title,
    label: 'Lesson Preview',
    emoji: lessons[1].emoji,
  },
  {
    title: topics[0].title,
    label: 'Topic Preview',
    emoji: topics[0].emoji,
  },
] as const;

export default function Home() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { speak, stopSpeaking, isSpeaking } = useVoice();

  useEffect(() => {
    if (!profile?.calibrated) {
      navigate('/onboarding', { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      speak(
        "Hi! I'm Gummy! Today we'll learn what A.I. is, why it's a tool, and how to think about it carefully!",
      );
    }, 800);

    return () => clearTimeout(timer);
  }, [profile, navigate, speak]);

  if (!profile?.calibrated) return null;

  const heroCompleted = profile.completedContent.includes(DEMO_HERO.completionKey);

  return (
    <div className="min-h-screen overflow-hidden px-4 py-6">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-[-5rem] h-72 w-72 rounded-full bg-gummy-pink/10 blur-3xl" />
        <div className="absolute top-[15%] right-[-4rem] h-80 w-80 rounded-full bg-gummy-blue/10 blur-3xl" />
        <div className="absolute bottom-[-4rem] left-[10%] h-72 w-72 rounded-full bg-gummy-yellow/10 blur-3xl" />
        <div className="absolute bottom-[8%] right-[12%] h-64 w-64 rounded-full bg-gummy-green/10 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="text-center animate-pop-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Demo Mode
          </div>
          <h1 className="mt-4 text-4xl font-display font-bold tracking-tight text-primary md:text-6xl">
            Gummy
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            One polished voice-first lesson for a clean, confidence-building demo.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="gummy-card relative overflow-hidden">
            <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-gummy-blue/10 blur-3xl" />
            <div className="relative flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
                  Hero Path
                </span>
                <span className="rounded-full bg-white px-3 py-1 font-semibold text-muted-foreground shadow-sm">
                  Ages 6-8
                </span>
                {heroCompleted && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
                    Completed once
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Guided Voice Session
                </p>
                <h2 className="text-3xl font-display font-bold text-foreground md:text-4xl">
                  {DEMO_HERO.title}
                </h2>
                <p className="text-lg font-semibold text-primary">{DEMO_HERO.subtitle}</p>
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                  {DEMO_HERO.description}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Includes
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    Onboarding + calibration
                  </p>
                </div>
                <div className="rounded-2xl bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Core Loop
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    Story, questions, hints, follow-up
                  </p>
                </div>
                <div className="rounded-2xl bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Finish
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    Parent-ready report
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to={DEMO_HERO.path}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold text-white shadow-lg transition-transform active:scale-95"
                  style={{ backgroundColor: 'var(--gummy-color)' }}
                >
                  Start The Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    else {
                      speak(
                        "Today we're doing one special Gummy lesson: What is A.I.? Tap start when you're ready!",
                      );
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-white px-5 py-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Mic className="h-4 w-4" />
                  {isSpeaking ? 'Stop Voice Intro' : 'Hear The Intro'}
                </button>
              </div>
            </div>
          </section>

          <aside className="flex flex-col items-center justify-center gap-4 rounded-[2rem] bg-white/70 p-6 shadow-sm ring-1 ring-white/80">
            <GummyMascot size="lg" speaking={isSpeaking} />
            <div className="max-w-sm text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Why one path?
              </p>
              <p className="mt-3 text-base leading-relaxed text-foreground">
                This demo stays focused on one polished learning journey so the product story is
                easy to understand in one glance.
              </p>
            </div>
          </aside>
        </div>

        <section className="gummy-card animate-pop-in" style={{ animationDelay: '120ms' }}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Preview Shelf
              </p>
              <h3 className="text-2xl font-display font-bold text-foreground">
                More Gummy content is visible, but locked for the demo
              </h3>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Keeping one clickable path makes the MVP feel curated instead of unfinished.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {previewItems.map((item, index) => (
              <div
                key={`${item.label}-${item.title}`}
                className="rounded-[1.5rem] border border-dashed border-border bg-white/80 p-4 opacity-80"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-2xl">
                      {item.emoji}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 text-base font-semibold leading-snug text-foreground">
                        {item.title}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Preview
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
