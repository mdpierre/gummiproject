import type { ModuleContent, ModuleId } from '../../types';
import type { Lesson, LessonPage } from '../../data/lessons';
import type { Topic } from '../../data/topics';
import type { Story } from '../../data/stories';
import type { ContentItem, ContentQuestion } from './types';

export function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function uniformPassage(text: string): ContentItem['passages'] {
  const t = text.trim();
  return { early: t, developmental: t, fluent: t };
}

function clampForSession(text: string, maxChars = 900): string {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= maxChars) return cleaned;
  const slice = cleaned.slice(0, maxChars);
  const lastSentence = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('? '), slice.lastIndexOf('! '));
  if (lastSentence > maxChars * 0.5) {
    return `${slice.slice(0, lastSentence + 1).trim()} ...`;
  }
  return `${slice.trim()} ...`;
}

function pagesToReadingText(pages: LessonPage[]): string {
  const merged = pages
    .map(p => {
      const body = stripMarkdown(p.content);
      return `${p.narration.trim()}\n\n${body}`.trim();
    })
    .filter(Boolean)
    .join('\n\n');
  return clampForSession(merged);
}

function interactiveQuestionsFromPages(
  pages: LessonPage[],
  keyPrefix: string,
): ContentQuestion[] {
  const out: ContentQuestion[] = [];
  pages.forEach((page, pi) => {
    const inter = page.interactive;
    if (inter?.type === 'tap-choice') {
      const ans = Array.isArray(inter.answer) ? inter.answer[0] : inter.answer;
      out.push({
        id: `${keyPrefix}-p${pi}`,
        text: inter.question,
        tier: 'all',
        hint: `Think about what we learned — ${ans}`,
      });
    }
  });
  return out;
}

export function moduleToContentItem(module: ModuleContent): ContentItem {
  return {
    kind: 'module',
    metricsKey: module.id,
    title: module.title,
    passages: module.passages,
    questions: module.questions.map(q => ({
      id: q.id,
      text: q.text,
      tier: q.tier,
      hint: q.hint,
    })),
    bigQuestion: module.bigQuestion,
    moduleId: module.id,
  };
}

export function storyToContentItem(story: Story): ContentItem {
  const questions: ContentQuestion[] = story.questions.map((q, i) => ({
    id: `story-${story.id}-q${i}`,
    text: q.question,
    tier: 'all',
    hint: q.explanation,
  }));

  return {
    kind: 'story',
    metricsKey: `story:${story.id}`,
    title: story.title,
    passages: uniformPassage(clampForSession(story.text.trim(), 1200)),
    questions,
    bigQuestion:
      'What part of this story felt most important to you, and why? There is no wrong answer!',
  };
}

export function lessonToContentItem(lesson: Lesson): ContentItem {
  const passage = pagesToReadingText(lesson.pages);
  const questions = interactiveQuestionsFromPages(lesson.pages, `lesson-${lesson.id}`);

  return {
    kind: 'lesson',
    metricsKey: `lesson:${lesson.id}`,
    title: lesson.title,
    passages: uniformPassage(passage),
    questions,
    bigQuestion: `What's one thing you want to remember about ${lesson.title}? There's no wrong answer!`,
  };
}

export function topicToContentItem(topic: Topic): ContentItem {
  const passage = pagesToReadingText(topic.pages);
  const questions = interactiveQuestionsFromPages(topic.pages, `topic-${topic.id}`);

  return {
    kind: 'topic',
    metricsKey: `topic:${topic.id}`,
    title: topic.title,
    passages: uniformPassage(passage),
    questions,
    bigQuestion: `What's one idea about ${topic.title} that you want to remember? There's no wrong answer!`,
  };
}

/** Resolve metrics storage id to a ModuleId when the session was a built-in module */
export function metricsKeyToModuleId(metricsKey: string): ModuleId | undefined {
  const moduleIds: ModuleId[] = ['what-is-ai', 'what-is-a-chatbot', 'how-ai-gets-information'];
  if (moduleIds.includes(metricsKey as ModuleId)) return metricsKey as ModuleId;
  return undefined;
}
