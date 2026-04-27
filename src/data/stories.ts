export interface Story {
  id: string;
  title: string;
  emoji: string;
  difficulty: "easy" | "medium" | "hard";
  text: string;
  questions: Question[];
}

export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const stories: Story[] = [
  {
    id: "robot-garden",
    title: "The Robot's Garden",
    emoji: "🌻",
    difficulty: "easy",
    text: `Rosie was a small robot who lived in a big lab. She had bright blue eyes and shiny silver arms. One day, her creator, Dr. Patel, gave her a new job.

"Rosie, I want you to grow a garden!" said Dr. Patel.

Rosie didn't know anything about gardens. But she was an A.I. robot, which meant she could learn! Dr. Patel showed Rosie one hundred pictures of healthy plants and one hundred pictures of sick plants.

After looking at all the pictures, Rosie could tell the difference! She learned that healthy plants are green and stand up tall. Sick plants turn yellow and droop down.

Rosie planted seeds in the lab's garden. Every day, she used her camera eyes to check each plant. When she spotted a yellow leaf, she gave that plant extra water and moved it to a sunnier spot.

By summer, Rosie's garden was the most beautiful one on the whole street! Dr. Patel was so proud. "You learned that all by yourself, Rosie!"

Rosie beeped happily. She had learned just like an A.I. does — by studying many examples and getting better every day.`,
    questions: [
      {
        question: "What job did Dr. Patel give Rosie?",
        options: ["To cook dinner", "To grow a garden", "To build a house", "To paint a picture"],
        correctIndex: 1,
        explanation: "Dr. Patel told Rosie, 'I want you to grow a garden!'",
      },
      {
        question: "How did Rosie learn about plants?",
        options: [
          "She read one book",
          "She asked other robots",
          "She looked at many pictures",
          "She guessed",
        ],
        correctIndex: 2,
        explanation:
          "Dr. Patel showed Rosie one hundred pictures of healthy plants and one hundred pictures of sick plants.",
      },
      {
        question: "What did Rosie do when she saw a yellow leaf?",
        options: [
          "She pulled the plant out",
          "She gave it extra water and sunlight",
          "She painted it green",
          "She ignored it",
        ],
        correctIndex: 1,
        explanation:
          "When she spotted a yellow leaf, she gave that plant extra water and moved it to a sunnier spot.",
      },
      {
        question: "How does A.I. learn, according to the story?",
        options: [
          "By magic",
          "By studying many examples",
          "By talking to humans",
          "By sleeping",
        ],
        correctIndex: 1,
        explanation:
          "Rosie learned just like an A.I. does — by studying many examples and getting better every day.",
      },
    ],
  },
  {
    id: "talking-backpack",
    title: "The Talking Backpack",
    emoji: "🎒",
    difficulty: "medium",
    text: `Maya got a brand-new backpack for her birthday. But this wasn't any ordinary backpack — it had A.I. inside!

"Hello, Maya! My name is Packy!" said the backpack when she first opened it.

Maya jumped in surprise. "You can talk?!"

"Yes! I'm powered by artificial intelligence," Packy explained. "I can help you stay organized for school."

Every morning, Packy would remind Maya what she needed. "Don't forget your math homework! It's on the kitchen table." Packy had learned Maya's schedule by listening to her talk about her classes.

One rainy Tuesday, Maya was about to leave without her umbrella. "Wait!" said Packy. "I checked the weather data, and there's a ninety percent chance of rain today. You should bring your umbrella!"

Maya grabbed her umbrella and said, "Thanks, Packy! How did you know?"

"I looked at weather information from the internet. A.I. can process lots of information very quickly to help make predictions," Packy replied.

At school, Maya's friend Jake asked, "Does your backpack know everything?"

Maya thought for a moment. "No, Packy only knows what it's been taught. It's really good at organizing and weather, but it can't tell me how I'm feeling or who my best friend is. Only I know that!"

Packy beeped in agreement. "Maya is right! A.I. is good at specific tasks, but humans are special because they understand feelings and friendships."`,
    questions: [
      {
        question: "What made Packy different from a regular backpack?",
        options: [
          "It was very big",
          "It had A.I. inside",
          "It was made of gold",
          "It could fly",
        ],
        correctIndex: 1,
        explanation:
          "This wasn't any ordinary backpack — it had A.I. inside!",
      },
      {
        question: "How did Packy know about the rain?",
        options: [
          "It looked outside the window",
          "Maya told it",
          "It checked weather data from the internet",
          "It guessed",
        ],
        correctIndex: 2,
        explanation:
          "Packy said, 'I looked at weather information from the internet.'",
      },
      {
        question: "What can't A.I. do well, according to the story?",
        options: [
          "Check the weather",
          "Remind you about homework",
          "Understand feelings and friendships",
          "Process information quickly",
        ],
        correctIndex: 2,
        explanation:
          "Maya said Packy can't tell her how she's feeling or who her best friend is. A.I. is good at specific tasks but humans understand feelings.",
      },
      {
        question: "What does 'process information' mean in this story?",
        options: [
          "Throw information away",
          "Look at and use lots of information quickly",
          "Write information on paper",
          "Forget information",
        ],
        correctIndex: 1,
        explanation:
          "A.I. can process (look at and use) lots of information very quickly to help make predictions.",
      },
    ],
  },
  {
    id: "ai-art-show",
    title: "The A.I. Art Show",
    emoji: "🎨",
    difficulty: "hard",
    text: `The Sunshine Elementary art show was next week, and everyone was excited. But this year was special — the students were going to create art together with an A.I. program!

Ms. Chen, the art teacher, introduced the class to "ArtBot," a program on the classroom computer. "ArtBot was trained by looking at millions of paintings, drawings, and photographs," she explained. "It learned the patterns in art — like how colors blend and how shapes create pictures."

"Can it make a painting of a dragon?" asked Sam eagerly.

"Let's try!" Ms. Chen typed "a friendly purple dragon in a flower garden" into ArtBot. In seconds, a beautiful picture appeared on the screen!

The class cheered, but then Lily raised her hand. "If ArtBot can make art so fast, why do we need human artists?"

Ms. Chen smiled. "Great question, Lily! ArtBot is amazing at creating images, but it doesn't truly understand what it's making. When you paint a picture of your dog, you're putting your love for your dog into the painting. ArtBot doesn't have feelings — it just follows patterns it learned."

For the art show, each student worked with ArtBot. They would describe an idea, ArtBot would create a starting image, and then the students would add their own creative touches with real paint and markers.

"I told ArtBot to make an ocean scene," said Marcus, "but I added my family surfing because that's my favorite memory. ArtBot could never have known that about me."

The art show was a huge success. Parents loved seeing how kids and A.I. worked together. The principal said, "This shows us that A.I. is a wonderful tool, but human creativity and feelings make art truly special."`,
    questions: [
      {
        question: "How was ArtBot trained to make art?",
        options: [
          "A person drew every picture for it",
          "It looked at millions of paintings and photos",
          "It was born knowing how to draw",
          "It copied one famous painting",
        ],
        correctIndex: 1,
        explanation:
          "ArtBot was trained by looking at millions of paintings, drawings, and photographs. It learned the patterns in art.",
      },
      {
        question: "Why did Lily ask if human artists are still needed?",
        options: [
          "She didn't like art",
          "ArtBot could make art very fast",
          "She wanted to be a scientist instead",
          "ArtBot's art was ugly",
        ],
        correctIndex: 1,
        explanation:
          "Lily asked because ArtBot could create images so quickly, she wondered why human artists were still needed.",
      },
      {
        question: "What makes human art different from A.I. art?",
        options: [
          "Human art uses more colors",
          "A.I. art is always better",
          "Humans put feelings and personal meaning into art",
          "There is no difference",
        ],
        correctIndex: 2,
        explanation:
          "Ms. Chen explained that when you paint your dog, you put your love into it. ArtBot doesn't have feelings — it just follows patterns.",
      },
      {
        question: "What did Marcus add to his ArtBot picture?",
        options: [
          "More fish",
          "His family surfing from a personal memory",
          "A bigger ocean",
          "A robot",
        ],
        correctIndex: 1,
        explanation:
          "Marcus added his family surfing because that's his favorite memory — something ArtBot could never have known.",
      },
      {
        question: "What is the main lesson of this story?",
        options: [
          "A.I. will replace all artists",
          "Art is not important",
          "A.I. is a helpful tool but human creativity makes art special",
          "Only computers should make art",
        ],
        correctIndex: 2,
        explanation:
          "The principal said A.I. is a wonderful tool, but human creativity and feelings make art truly special.",
      },
    ],
  },
];
