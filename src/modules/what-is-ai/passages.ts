import type { ReadingTier } from '../../types';

const passages: Record<ReadingTier, string> = {
  early: `What is AI?
AI is a tool.
It is not a pet.
It is not a friend.
It learned from books.
So many books!
It reads, and reads, and reads.
Then it can help you.
But it is just a tool.
Like a big, smart book.`,

  developmental: `What Is AI? Let Me Say...
AI is a tool that helps you each day.
It learned from books — in a big, special way.
Not a person, not a pet — it has no heart.
But reading all those books made it really smart!
It doesn't have feelings, it doesn't have a name —
But ask it a question, and it'll try to explain.
So what IS AI? Here's what I say:
A thinking tool that helps you learn and play!`,

  fluent: `What Is Artificial Intelligence?
Artificial intelligence — or AI for short — is a type of computer program that can think and learn.
But it doesn't think like you do.
AI learned by reading millions of books, websites, and other writing that people created.
It found patterns in all that information, and now it can answer questions and help solve problems.
AI doesn't have feelings. It doesn't get hungry, tired, or lonely.
It's a tool — a very powerful one — built to help humans do things faster and smarter.
And just like any tool, it works best when the person using it understands how it works.
That's what you're doing right now!`,
};

export default passages;
