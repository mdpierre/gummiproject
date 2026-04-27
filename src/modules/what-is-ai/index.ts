import type { ModuleContent } from '../../types';
import passages from './passages';

const module: ModuleContent = {
  id: 'what-is-ai',
  title: 'What Is AI?',
  passages,
  bigQuestion:
    'If someone told you AI is a real person who knows everything, what would you say to them?',
  questions: [
    {
      id: 'wai-q1',
      text: 'Is AI a person or a tool?',
      tier: 'all',
      hint: 'Think about what Gummy said — does AI have feelings?',
    },
    {
      id: 'wai-q2',
      text: 'How did AI learn so many things?',
      tier: 'all',
      hint: 'Remember what Gummy said about books...',
    },
    {
      id: 'wai-q3',
      text: 'Can AI feel happy or sad?',
      tier: 'all',
      hint: 'Think about whether AI is a person or something different.',
    },
    {
      id: 'wai-q4',
      text: 'What is one thing AI is good at?',
      tier: 'developmental',
      hint: "Gummy said AI can help you — what kind of help did it mention?",
    },
    {
      id: 'wai-q5',
      text: 'What is one thing AI cannot do that you can do?',
      tier: 'fluent',
      hint: 'Think about feelings, experiences, and being a real person.',
    },
  ],
};

export default module;
