import type { ReadingTier } from '../../types';

const passages: Record<ReadingTier, string> = {
  early: `How does AI learn?
It reads books.
So many books!
It reads websites.
It reads stories.
That is called training.
It learned long ago.
Not today.
Not this week.
So it might not know new things.
You might know more!`,

  developmental: `How Does AI Get Its Info?
AI learned from books and things people wrote.
It read and read — like a big research boat!
But here's something funny — it stopped at a date.
It doesn't browse the web — it can't update!
So if something happened just yesterday,
AI might not know — it has nothing to say.
That's called a training cutoff — a stopping point in time.
Things after that date? They're outside its climb!
So when you ask AI about something brand new,
It might not know it — but YOU might! It's true!`,

  fluent: `How Does AI Get Its Information?
AI doesn't look things up when you ask a question.
Instead, it was trained — which means it studied an enormous collection of books, articles, and websites before it was released.
During training, AI found patterns in all that writing. It learned facts, ideas, and how language works.
But training has an end date. After that date, AI stopped learning new information.
This is called a training cutoff.
If something happened after that date — a news story, a new discovery, something that happened at your school — AI won't know about it.
It might even get confused and give you outdated information as if it were current.
That's why it's important to know where AI got its information, and when.
For things happening right now, you'll want a different source — a news website, a teacher, or someone who was there.
AI is powerful, but it's not all-knowing. Knowing its limits makes you a smarter user.`,
};

export default passages;
