export const DEMO_HERO = {
  kind: 'module',
  id: 'what-is-ai',
  title: 'What Is AI?',
  subtitle: 'AI is a tool, not a person.',
  description:
    "A single guided voice session that introduces Gummy's core learning loop, adaptive pacing, and parent-ready report.",
  path: '/modules/what-is-ai',
  completionKey: 'what-is-ai',
} as const;

type DemoContentKind = 'module' | 'lesson' | 'story' | 'topic';

export function isDemoContentEnabled(kind: DemoContentKind, id: string): boolean {
  return kind === DEMO_HERO.kind && id === DEMO_HERO.id;
}
