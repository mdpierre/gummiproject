import type { ModuleContent } from '../../types';
import passages from './passages';

const module: ModuleContent = {
  id: 'how-ai-gets-information',
  title: 'How Does AI Get Its Information?',
  passages,
  bigQuestion:
    'If you wanted to know what happened at school today, could Gummy know? Why or why not?',
  questions: [
    {
      id: 'hagi-q1',
      text: 'How did AI learn the things it knows?',
      tier: 'all',
      hint: 'Think about all the reading Gummy talked about.',
    },
    {
      id: 'hagi-q2',
      text: 'Does AI browse the internet to answer your questions?',
      tier: 'all',
      hint: "Gummy said AI learned a long time ago — does it keep learning every day?",
    },
    {
      id: 'hagi-q3',
      text: 'What is a training cutoff?',
      tier: 'developmental',
      hint: 'Think about when AI stopped learning new things.',
    },
    {
      id: 'hagi-q4',
      text: 'If something happened yesterday, would AI know about it?',
      tier: 'all',
      hint: 'Remember the training cutoff — does AI get updates?',
    },
    {
      id: 'hagi-q5',
      text: 'If AI might have old information, what should you do before trusting its answer?',
      tier: 'fluent',
      hint: 'Think about checking other sources.',
    },
  ],
};

export default module;
