export interface Lesson {
  id: string;
  title: string;
  emoji: string;
  color: string;
  description: string;
  pages: LessonPage[];
}

export interface LessonPage {
  narration: string;
  content: string;
  interactive?: {
    type: "drag-sort" | "tap-choice" | "fill-blank";
    question: string;
    options: string[];
    answer: string | string[];
  };
}

export const lessons: Lesson[] = [
  {
    id: "what-is-ai",
    title: "What is A.I.?",
    emoji: "🤖",
    color: "gummy-blue",
    description: "Meet your robot friend and learn what A.I. means!",
    pages: [
      {
        narration:
          "Hi there! I'm Gummy, your learning buddy! Today we're going to learn about something super cool called A.I. That stands for Artificial Intelligence!",
        content:
          "**A.I.** stands for **Artificial Intelligence**.\n\nIt means making computers and machines smart enough to do things that usually need a human brain — like seeing pictures, understanding words, or playing games!",
      },
      {
        narration:
          "Think about it this way: when you learn to ride a bike, your brain figures out how to balance. A.I. is when we teach a computer to figure things out too!",
        content:
          "Just like **you** learn new things every day, A.I. helps computers **learn** too!\n\n🧠 Your brain learns → from practice\n💻 A.I. learns → from lots of examples",
        interactive: {
          type: "tap-choice",
          question: "What does A.I. stand for?",
          options: [
            "Awesome Inventions",
            "Artificial Intelligence",
            "Animal Ideas",
            "Amazing Internet",
          ],
          answer: "Artificial Intelligence",
        },
      },
      {
        narration:
          "Great job! A.I. is all around us. It helps your parents' phone recognize faces in photos, and it helps cars know when to stop!",
        content:
          "A.I. is everywhere! Here are some places you might find it:\n\n📱 Voice assistants like Siri or Alexa\n📷 Photo apps that find faces\n🎮 Video game characters that play against you\n🚗 Cars that can help with driving",
        interactive: {
          type: "tap-choice",
          question: "Which of these uses A.I.?",
          options: ["A pencil", "A voice assistant", "A paper book", "A wooden chair"],
          answer: "A voice assistant",
        },
      },
    ],
  },
  {
    id: "how-ai-learns",
    title: "How A.I. Learns",
    emoji: "📚",
    color: "gummy-green",
    description: "Discover how computers learn from examples!",
    pages: [
      {
        narration:
          "Did you know that A.I. learns a lot like you do? When you see lots of cats, you learn what a cat looks like. A.I. works the same way!",
        content:
          "**How does A.I. learn?**\n\nJust like you learn by seeing many examples, A.I. learns by looking at **thousands** of examples!\n\nIf you show A.I. 1000 pictures of cats 🐱 and 1000 pictures of dogs 🐶, it can learn to tell them apart!",
      },
      {
        narration:
          "This is called training! We train A.I. by giving it lots and lots of data. Data is just a fancy word for information.",
        content:
          "**Training** is how we teach A.I.\n\n1️⃣ Give A.I. lots of examples (called **data**)\n2️⃣ A.I. looks for **patterns**\n3️⃣ A.I. gets better and better!\n\nIt's like practicing your spelling words — the more you practice, the better you get!",
        interactive: {
          type: "tap-choice",
          question: "How does A.I. learn?",
          options: [
            "By magic",
            "By looking at many examples",
            "By reading one book",
            "By sleeping",
          ],
          answer: "By looking at many examples",
        },
      },
      {
        narration:
          "And here's the cool part: the more examples you give A.I., the smarter it gets! Just like how you get better at reading the more books you read!",
        content:
          "**More data = smarter A.I.!**\n\n📖 You read more books → you read better\n💻 A.I. sees more examples → it learns better\n\nBut A.I. can only learn what we teach it. If we only show it pictures of cats, it won't know what a dog is!",
        interactive: {
          type: "tap-choice",
          question: "What happens when A.I. gets more examples?",
          options: [
            "It gets confused",
            "It breaks",
            "It gets smarter",
            "Nothing happens",
          ],
          answer: "It gets smarter",
        },
      },
    ],
  },
  {
    id: "ai-helpers",
    title: "A.I. Helpers",
    emoji: "🦾",
    color: "gummy-purple",
    description: "See how A.I. helps people every day!",
    pages: [
      {
        narration:
          "A.I. is like a super helpful friend! It helps doctors, teachers, scientists, and even you! Let's see how!",
        content:
          "**A.I. Helpers are everywhere!**\n\n🏥 **Doctors** use A.I. to look at X-rays and find problems\n🌦️ **Weather** apps use A.I. to predict if it will rain\n🎵 **Music** apps use A.I. to suggest songs you might like\n📝 **Spell checkers** use A.I. to fix your writing",
      },
      {
        narration:
          "A.I. can even help animals! Scientists use A.I. to track endangered animals and protect them.",
        content:
          "**A.I. helps animals too!** 🐾\n\nScientists put cameras in forests. A.I. watches the videos and counts animals!\n\n🐼 It can spot pandas in bamboo forests\n🐋 It can listen to whale songs in the ocean\n🦅 It can track birds flying across the sky",
        interactive: {
          type: "tap-choice",
          question: "How does A.I. help doctors?",
          options: [
            "By cooking food",
            "By looking at X-rays",
            "By driving cars",
            "By painting pictures",
          ],
          answer: "By looking at X-rays",
        },
      },
      {
        narration:
          "But remember, A.I. is a tool that people create. It needs humans to build it, teach it, and make sure it's doing the right thing!",
        content:
          "**A.I. needs humans!** 🤝\n\nA.I. is powerful, but it still needs people to:\n\n👩‍💻 **Build** it — programmers write the code\n👨‍🏫 **Teach** it — we give it the right examples\n👀 **Check** it — we make sure it's fair and correct\n\nYou could be an A.I. builder someday! 🌟",
        interactive: {
          type: "tap-choice",
          question: "Does A.I. need humans?",
          options: [
            "No, A.I. does everything alone",
            "Yes, humans build and teach A.I.",
            "A.I. teaches itself everything",
            "Only robots can make A.I.",
          ],
          answer: "Yes, humans build and teach A.I.",
        },
      },
    ],
  },
];
