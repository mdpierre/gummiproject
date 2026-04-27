import type { ReadingTier } from '../../types';

const passages: Record<ReadingTier, string> = {
  early: `What is a chatbot?
It talks to you.
You ask it things.
It tries to help.
But it can be wrong.
That is okay!
You can check.
Ask a grown-up.
Or look it up.
You are the smart one!`,

  developmental: `What's a Chatbot? Let Me Explain!
A chatbot is an AI you can talk to each day.
You type or speak — and it finds words to say.
It looks at patterns from all that it has read,
And tries to give an answer back instead.
But here's the thing — it sometimes gets things wrong!
It might say something false and sound so strong.
So when a chatbot speaks, you should always think:
Is this for real? Or is there a missing link?
You are the thinker — the chatbot is just a tool.
Use it carefully, and you'll always be cool!`,

  fluent: `What Is a Chatbot?
A chatbot is a type of AI that you can have a conversation with.
You ask it questions, and it responds — sometimes in seconds.
But how does it know what to say?
A chatbot was trained on enormous amounts of text written by humans.
It learned to recognize patterns: what kinds of words come after other words, and how conversations usually go.
When you ask it something, it doesn't look it up — it predicts what a good answer would sound like, based on all those patterns.
That's powerful! But it also means chatbots can be wrong.
They can sound very confident even when they're making a mistake.
That's why smart chatbot users always think: does this answer make sense? Could I check it somewhere else?
You're not just using AI — you're thinking about it. That's what makes you smarter than the bot!`,
};

export default passages;
