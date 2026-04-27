import type { ModuleContent, ModuleId } from '../types';
import whatIsAi from './what-is-ai';
import whatIsAChatbot from './what-is-a-chatbot';
import howAiGetsInformation from './how-ai-gets-information';

export const MODULES: Record<ModuleId, ModuleContent> = {
  'what-is-ai': whatIsAi,
  'what-is-a-chatbot': whatIsAChatbot,
  'how-ai-gets-information': howAiGetsInformation,
};

export function getModule(id: ModuleId): ModuleContent {
  return MODULES[id];
}
