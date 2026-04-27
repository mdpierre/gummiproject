import type { ModuleContent } from '../../types';
import passages from './passages';

const module: ModuleContent = {
  id: 'what-is-a-chatbot',
  title: 'What Is a Chatbot?',
  passages,
  bigQuestion:
    'If you asked Gummy and your teacher the same question and they said different things, who would you believe? How would you find out who was right?',
  questions: [
    {
      id: 'wiac-q1',
      text: 'What is a chatbot?',
      tier: 'all',
      hint: 'Think about what you can DO with a chatbot — can you talk to it?',
    },
    {
      id: 'wiac-q2',
      text: 'Can a chatbot ever be wrong?',
      tier: 'all',
      hint: 'Remember what Gummy said about patterns and mistakes.',
    },
    {
      id: 'wiac-q3',
      text: 'If a chatbot gives you a wrong answer, what should you do?',
      tier: 'all',
      hint: 'Think about who else you could ask, or where else you could look.',
    },
    {
      id: 'wiac-q4',
      text: 'How does a chatbot decide what to say?',
      tier: 'developmental',
      hint: "Gummy said it looks for patterns — what does that mean?",
    },
    {
      id: 'wiac-q5',
      text: 'Why might a chatbot sound confident even when it is wrong?',
      tier: 'fluent',
      hint: 'Think about how the chatbot learned — from patterns, not from checking facts.',
    },
  ],
};

export default module;
