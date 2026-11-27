import type { EnglishLesson } from "../english";
import type { LESSON_SALUTATIONS } from "./salutations";

export const SALUTATIONS_EN: EnglishLesson<typeof LESSON_SALUTATIONS> = {
  subtitle: "Greetings and good manners.",
  category: "Greetings",
  items: {
    "salutations-bonjour": {
      meaning: "hello",
      note: "‘bonjour’ also means ‘good morning’ or ‘good day’.",
      example: "Hello, my name is Léa.",
    },
    "salutations-bonsoir": {
      meaning: "good evening",
      note: "You use it in the evening.",
      example: "Good evening, how are you?",
    },
    "salutations-salut": {
      meaning: "hi",
      note: "Informal, for friends.",
      example: "Hi, how's it going?",
    },
    "salutations-au-revoir": {
      meaning: "goodbye",
      note: "The usual way to say goodbye.",
      example: "I say goodbye to my friends.",
    },
    "salutations-merci": {
      meaning: "thank you",
      note: "‘Merci beaucoup’ means ‘thank you very much’.",
      example: "Thank you for the present.",
    },
    "salutations-sil-te-plait": {
      meaning: "please",
      note: "Informal; to a grown-up you say ‘s’il vous plaît’.",
      example: "Can you help me, please?",
    },
    "salutations-pardon": {
      meaning: "sorry",
      note: "You also say ‘pardon’ after a little accident.",
      example: "Sorry, I'm late.",
    },
    "salutations-oui": {
      meaning: "yes",
      note: "‘Oui’ sounds like ‘we’.",
      example: "Yes, I'm coming.",
    },
    "salutations-non": {
      meaning: "no",
      note: "‘Non’ is said through your nose, with a short o.",
      example: "No, I don't want to.",
    },
    "salutations-de-rien": {
      meaning: "you're welcome",
      note: "The answer to ‘merci’.",
      example: "You're welcome, it was a pleasure.",
    },
    "salutations-comment-ca-va": {
      meaning: "How are you?",
      note: "‘Ça va’ is a short way to ask the same thing.",
      distractors: ["How old are you?", "Where do you live?", "What's your name?"],
    },
    "salutations-je-mappelle": {
      meaning: "My name is Léa.",
      note: "Léa is just an example; use your own name.",
      distractors: ["I know Léa.", "Léa is my sister.", "I'm looking for Léa."],
    },
    "salutations-enchante": {
      meaning: "Nice to meet you!",
      note: "A girl writes ‘Enchantée’.",
      distractors: ["Goodbye!", "Good morning!", "Thank you very much!"],
    },
    "salutations-a-bientot": {
      meaning: "See you soon!",
      note: "You will see each other again soon.",
      distractors: ["See you tomorrow!", "See you tonight!", "Good night!"],
    },
    "salutations-ou-est-la-gare": {
      meaning: "Excuse me, where is the station?",
      note: "‘Excusez-moi’ is polite; ‘la gare’ is the station.",
      distractors: [
        "Excuse me, where is the school?",
        "Excuse me, what time is it?",
        "Excuse me, where is the shop?",
      ],
    },
  },
};
