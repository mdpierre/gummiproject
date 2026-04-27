// Hardcoded fallbacks used when the LLM is unavailable or during Phase 0 stub mode.

export const FALLBACK_CALIBRATION_QUESTIONS = [
  "What did you eat for breakfast today?",
  "What is your favorite animal and why?",
  "Tell me about something fun you did this week.",
  "What is your favorite color?",
  "Do you have a pet? What is it like?",
];

export const FALLBACK_HINTS: Record<string, string> = {
  default: "Here's a little clue — think about what Gummy told you in the story!",
};

export const FALLBACK_GUMMY_NOTE =
  "Great job today! You worked hard and thought carefully about some big ideas.";

export const FALLBACK_MODULE_RESPONSE =
  "Hmm, that's a great thought! Let's think about it together. What did you hear in our story?";
