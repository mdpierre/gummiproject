import { getModule } from '../../modules';
import type { ModuleId } from '../../types';
import { lessons } from '../../data/lessons';
import { topics } from '../../data/topics';
import { stories } from '../../data/stories';
import type { ContentItem } from './types';
import {
  lessonToContentItem,
  moduleToContentItem,
  storyToContentItem,
  topicToContentItem,
} from './adapters';

export function getContentByModuleId(id: string): ContentItem | null {
  const known: ModuleId[] = ['what-is-ai', 'what-is-a-chatbot', 'how-ai-gets-information'];
  if (!known.includes(id as ModuleId)) return null;
  return moduleToContentItem(getModule(id as ModuleId));
}

export function getContentByLessonId(id: string): ContentItem | null {
  const lesson = lessons.find(l => l.id === id);
  return lesson ? lessonToContentItem(lesson) : null;
}

export function getContentByStoryId(id: string): ContentItem | null {
  const story = stories.find(s => s.id === id);
  return story ? storyToContentItem(story) : null;
}

export function getContentByTopicId(id: string): ContentItem | null {
  const topic = topics.find(t => t.id === id);
  return topic ? topicToContentItem(topic) : null;
}

/**
 * Try topic → lesson → story → module (legacy).
 */
export function getContentByAnyId(id: string): ContentItem | null {
  return (
    getContentByTopicId(id) ??
    getContentByLessonId(id) ??
    getContentByStoryId(id) ??
    getContentByModuleId(id)
  );
}
