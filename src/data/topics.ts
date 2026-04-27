import { LessonPage } from "./lessons";

export interface Topic {
  id: string;
  title: string;
  emoji: string;
  color: string;
  description: string;
  pages: LessonPage[];
}

export const topics: Topic[] = [
  {
    id: "trust",
    title: "Trust",
    emoji: "🤝",
    color: "gummy-pink",
    description: "Can we trust A.I.? Let's find out!",
    pages: [
      {
        narration: "Trust is really important! When you trust a friend, you believe they'll do the right thing. But can we trust A.I.? Let's explore!",
        content: "**Trust** means believing something will do what it's supposed to.\n\n🤝 You trust your teacher to help you learn\n🤝 You trust a calculator to give the right answer\n\nBut A.I. is trickier — we need to **check** if it's doing a good job!",
      },
      {
        narration: "A.I. can make mistakes! That's why we always need humans to double-check what A.I. says.",
        content: "**A.I. isn't always right!**\n\nSometimes A.I. makes mistakes, just like people do.\n\n✅ A.I. can help — like spell-checking your writing\n⚠️ But always have a grown-up check important things\n\nTrust A.I. as a **helper**, not the **boss**!",
        interactive: {
          type: "tap-choice",
          question: "Should we always trust A.I. without checking?",
          options: ["Yes, A.I. is always right", "No, we should check A.I.'s work", "Only on weekends", "A.I. doesn't make mistakes"],
          answer: "No, we should check A.I.'s work",
        },
      },
    ],
  },
  {
    id: "compliance",
    title: "Following Rules",
    emoji: "📏",
    color: "gummy-green",
    description: "A.I. has to follow rules too!",
    pages: [
      {
        narration: "Did you know that A.I. has rules it has to follow? Just like you have rules at school, A.I. has rules too!",
        content: "**Compliance** means following the rules!\n\n🏫 At school, you follow rules to be safe and fair\n💻 A.I. also has rules it must follow\n\nPeople called **engineers** write these rules into the A.I. so it behaves properly!",
      },
      {
        narration: "Rules for A.I. help keep everyone safe. For example, A.I. shouldn't share your private information!",
        content: "**Why does A.I. need rules?**\n\nWithout rules, A.I. might:\n\n❌ Share secrets it shouldn't\n❌ Be unfair to some people\n❌ Make unsafe choices\n\nRules help A.I. be a **good helper** for everyone! 🌟",
        interactive: {
          type: "tap-choice",
          question: "Why does A.I. need rules?",
          options: ["To be boring", "To keep everyone safe and fair", "It doesn't need rules", "Just for fun"],
          answer: "To keep everyone safe and fair",
        },
      },
    ],
  },
  {
    id: "transparency",
    title: "Transparency",
    emoji: "🔍",
    color: "gummy-yellow",
    description: "See how A.I. shows its work!",
    pages: [
      {
        narration: "Transparency means being open and honest. When A.I. is transparent, it shows us HOW it made a decision!",
        content: "**Transparency** means you can see how something works!\n\n🔍 Like a glass window — you can see through it!\n\nWhen A.I. is transparent, it tells us:\n\n💡 What information it used\n💡 How it made its choice\n💡 Why it thinks something",
      },
      {
        narration: "Imagine if your teacher gave you a grade but wouldn't tell you why. That wouldn't be fair! A.I. should explain its answers too!",
        content: "**Why is transparency important?**\n\nIf A.I. picks a winner in a contest, we should know **why**!\n\n📝 Did it pick the best drawing?\n📝 Or did it just pick randomly?\n\nTransparent A.I. = A.I. that **shows its work**! ✨",
        interactive: {
          type: "tap-choice",
          question: "What does transparency in A.I. mean?",
          options: ["A.I. is invisible", "A.I. shows how it makes decisions", "A.I. is made of glass", "A.I. hides everything"],
          answer: "A.I. shows how it makes decisions",
        },
      },
    ],
  },
  {
    id: "model-context",
    title: "Model Context",
    emoji: "🧩",
    color: "gummy-blue",
    description: "How A.I. understands the world around it!",
    pages: [
      {
        narration: "Context means the information around something that helps you understand it. A.I. needs context too!",
        content: "**Context** is the information that helps us understand things!\n\n🧩 If someone says \"It's cold\" — context tells us if they mean the weather or their ice cream!\n\nA.I. uses context to understand what you're asking.",
      },
      {
        narration: "A.I. models are trained on specific kinds of information. That's their context! An A.I. trained on animals knows about animals, not about cooking!",
        content: "**A.I. models** know about what they were taught!\n\n🐶 An A.I. trained on pets → knows about dogs and cats\n🍕 An A.I. trained on food → knows about recipes\n\nThe **context** is what the A.I. has learned about!\n\nThat's why different A.I.s are good at different things! 🎯",
        interactive: {
          type: "tap-choice",
          question: "An A.I. trained on animal pictures would be best at recognizing...",
          options: ["Cars", "Animals", "Buildings", "Music"],
          answer: "Animals",
        },
      },
    ],
  },
  {
    id: "ai-terms",
    title: "A.I. Terms",
    emoji: "📖",
    color: "gummy-purple",
    description: "Learn cool A.I. words!",
    pages: [
      {
        narration: "Let's learn some cool A.I. words! These are words that A.I. scientists use every day!",
        content: "**Fun A.I. Words to Know!**\n\n🤖 **Algorithm** — a set of steps, like a recipe!\n📊 **Data** — information, like pictures or numbers\n🧠 **Neural Network** — A.I. that works like a brain\n🎓 **Training** — teaching A.I. with lots of examples",
      },
      {
        narration: "Here are more A.I. words! An algorithm is like a recipe. It tells the computer exactly what steps to follow!",
        content: "**More A.I. Vocabulary!**\n\n🔮 **Prediction** — A.I.'s best guess about something\n🏷️ **Label** — a tag that tells A.I. what something is\n📥 **Input** — what you give to A.I. (like a photo)\n📤 **Output** — what A.I. gives back (like an answer)",
        interactive: {
          type: "tap-choice",
          question: "What is an algorithm?",
          options: ["A type of robot", "A set of steps like a recipe", "A computer game", "A kind of candy"],
          answer: "A set of steps like a recipe",
        },
      },
    ],
  },
  {
    id: "fairness",
    title: "Fairness",
    emoji: "⚖️",
    color: "gummy-orange",
    description: "Making sure A.I. treats everyone equally!",
    pages: [
      {
        narration: "Fairness is super important! Just like in a game, A.I. should treat everyone the same way!",
        content: "**Fairness** means treating everyone equally!\n\n⚖️ In a fair game, everyone follows the same rules\n⚖️ Fair A.I. should treat all people the same way\n\nBut sometimes A.I. can accidentally be unfair if it learned from bad examples!",
      },
      {
        narration: "If A.I. only learned from pictures of one kind of person, it might not recognize other people! That's why we need to teach A.I. about ALL kinds of people!",
        content: "**How can A.I. be unfair?**\n\nImagine an A.I. that picks team captains:\n\n❌ If it only saw tall captains → it might think only tall kids can lead\n✅ A fair A.I. looks at **skills**, not just height!\n\nWe make A.I. fair by teaching it with **diverse** examples! 🌈",
        interactive: {
          type: "tap-choice",
          question: "How do we make A.I. fair?",
          options: ["Only use it on Mondays", "Teach it with diverse examples", "Turn it off", "Let it decide on its own"],
          answer: "Teach it with diverse examples",
        },
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    emoji: "🔒",
    color: "gummy-red",
    description: "Keeping your information safe!",
    pages: [
      {
        narration: "Privacy means keeping your personal stuff private! Just like you wouldn't tell a stranger your address, A.I. should protect your information too!",
        content: "**Privacy** means keeping personal info safe! 🔒\n\nThings that should stay private:\n\n🏠 Your home address\n📱 Your phone number\n🎂 Your birthday\n📷 Your photos\n\nA.I. should **never** share these without permission!",
      },
      {
        narration: "When you use apps and websites, they sometimes collect information about you. Good A.I. keeps that information safe and private!",
        content: "**How to stay safe with A.I.:**\n\n🛡️ Don't share personal info with chatbots\n🛡️ Ask a grown-up before signing up for apps\n🛡️ It's OK to say \"no\" when apps ask for info\n\nYour information belongs to **YOU**! 💪",
        interactive: {
          type: "tap-choice",
          question: "What should you do before sharing info with an A.I. app?",
          options: ["Share everything quickly", "Ask a grown-up first", "Tell it your address", "Give it your password"],
          answer: "Ask a grown-up first",
        },
      },
    ],
  },
  {
    id: "accountability",
    title: "Accountability",
    emoji: "🎯",
    color: "gummy-pink",
    description: "Who's responsible when A.I. makes mistakes?",
    pages: [
      {
        narration: "Accountability means taking responsibility! If you accidentally break something, you say sorry and fix it. But what about when A.I. makes a mistake?",
        content: "**Accountability** means taking responsibility!\n\n🎯 If you break a vase → you help clean it up\n🎯 If A.I. makes a mistake → someone needs to fix it!\n\nBut A.I. can't say sorry... so **who** is responsible?",
      },
      {
        narration: "The people who BUILD the A.I. are responsible for making sure it works right! Just like a toy maker is responsible for making safe toys!",
        content: "**Humans are accountable for A.I.!**\n\n👩‍💻 **Programmers** who build A.I. must test it carefully\n🏢 **Companies** must fix A.I. when it goes wrong\n👨‍👩‍👧 **Everyone** can report A.I. problems\n\nA.I. is a tool — **people** are always responsible! 🌟",
        interactive: {
          type: "tap-choice",
          question: "Who is responsible when A.I. makes a mistake?",
          options: ["Nobody", "The A.I. itself", "The people who built it", "The computer"],
          answer: "The people who built it",
        },
      },
    ],
  },
  {
    id: "data-collection",
    title: "Data Collection",
    emoji: "📊",
    color: "gummy-green",
    description: "How A.I. gathers information!",
    pages: [
      {
        narration: "Data is information! A.I. needs LOTS of data to learn. Let's find out how it collects all that information!",
        content: "**Data** is just a fancy word for information! 📊\n\nA.I. collects data from many places:\n\n📷 Photos you upload\n🎤 Words you speak to voice assistants\n🔍 Things you search for online\n👆 Buttons you tap in apps",
      },
      {
        narration: "Not all data collection is bad! Doctors use data to help sick people, and weather apps use data to tell you if it'll rain!",
        content: "**Good data collection helps people!**\n\n🏥 Health data → helps doctors find cures\n🌦️ Weather data → predicts storms\n🚗 Traffic data → finds the fastest route\n\nBut data should be collected **fairly** and with **permission**! ✋",
        interactive: {
          type: "tap-choice",
          question: "What is data?",
          options: ["A type of food", "Information that A.I. learns from", "A video game", "A kind of robot"],
          answer: "Information that A.I. learns from",
        },
      },
    ],
  },
  {
    id: "decision-making",
    title: "Decision Making",
    emoji: "🧠",
    color: "gummy-blue",
    description: "How A.I. makes choices!",
    pages: [
      {
        narration: "Every day, you make decisions! What to eat, what to wear, what game to play. A.I. makes decisions too — but in a very different way!",
        content: "**How does A.I. make decisions?**\n\n🧠 Your brain thinks about choices using feelings AND facts\n💻 A.I. makes choices using only **patterns** in data\n\nA.I. looks at what happened before and makes its best guess about what to do!",
      },
      {
        narration: "A.I. is really good at making some decisions, like sorting photos. But for big important decisions, humans should always be in charge!",
        content: "**A.I. decisions: good and tricky!**\n\n✅ Good for: sorting photos, recommending songs, spell-checking\n⚠️ Tricky for: choosing who gets a prize, medical decisions\n\nFor big decisions, **humans + A.I. together** works best! 🤝\n\nA.I. suggests → Humans decide! 💪",
        interactive: {
          type: "tap-choice",
          question: "For important decisions, what works best?",
          options: ["Let A.I. decide everything", "Flip a coin", "Humans and A.I. working together", "Don't decide at all"],
          answer: "Humans and A.I. working together",
        },
      },
    ],
  },
];
