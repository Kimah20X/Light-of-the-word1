import { BIBLE_BOOKS, getBook, parseBibleReference } from "./bible-catalog";
import type { BibleReference } from "./app-state";

export type VoiceCommandIntent =
  | { type: "open"; reference: BibleReference }
  | { type: "nextVerse" | "previousVerse" | "nextChapter" | "previousChapter" | "nextBook" | "previousBook" }
  | { type: "firstVerse" | "lastVerse" | "read" | "pause" | "repeat" | "bookmark" }
  | { type: "home" | "navigate" | "settings" | "bookmarks" | "profile" | "help" }
  | { type: "goToChapter"; chapter: number }
  | { type: "goToVerse"; verse: number }
  | { type: "speed"; value: number }
  | { type: "faster" | "slower" };

const NUMBER_WORDS: Record<string, string> = {
  one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
  eleven: "11", twelve: "12", thirteen: "13", fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17", eighteen: "18", nineteen: "19", twenty: "20",
};

function normalizeNumberWords(input: string) {
  return input.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/gi, (word) => NUMBER_WORDS[word.toLowerCase()]);
}

/** Parses typed voice-style commands locally; it never records or sends speech. */
export function parseVoiceCommand(input: string): VoiceCommandIntent | null {
  const phrase = normalizeNumberWords(input
    .trim()
    .replace(/[.!?,;]+$/, "")
    .replace(/^(please\s+|can you\s+|could you\s+|would you\s+)/i, "")
    .trim());
  if (!phrase) return null;

  const referenceCandidate = phrase.replace(/^(?:open|go to|turn to|take me to)\s+/i, "");
  const reference = parseBibleReference(referenceCandidate);
  if (reference && (/^(?:open|go to|turn to|take me to)\s+/i.test(phrase) || referenceCandidate !== phrase || /^\S+\s+\d/.test(phrase))) {
    return { type: "open", reference };
  }
  const bareBook = getBook(referenceCandidate);
  if (bareBook && /^(?:open|go to|turn to|take me to)\s+/i.test(phrase)) {
    return { type: "open", reference: { book: bareBook.name, chapter: 1, verse: 1 } };
  }

  if (/^(?:(?:go\s+)?next|forward|skip)\s+(?:(?:one|1)\s+)?verse$|^next verse$/i.test(phrase)) return { type: "nextVerse" };
  if (/^(?:(?:go\s+)?previous|prev|(?:go\s+)?back)\s+(?:(?:one|1)\s+)?verse$|^go back$/i.test(phrase)) return { type: "previousVerse" };
  if (/^(?:(?:go\s+)?next|forward)\s+(?:one\s+)?chapter$/i.test(phrase)) return { type: "nextChapter" };
  if (/^(?:(?:go\s+)?previous|prev|(?:go\s+)?back)\s+(?:(?:one|1)\s+)?chapter$/i.test(phrase)) return { type: "previousChapter" };
  if (/^(?:(?:go\s+)?next|forward)\s+book$/i.test(phrase)) return { type: "nextBook" };
  if (/^(?:(?:go\s+)?previous|prev|back)\s+book$/i.test(phrase)) return { type: "previousBook" };

  const chapter = phrase.match(/^(?:(?:go\s+to|open)\s+)?chapter\s+(\d+)$|^go\s+to\s+chapter\s+(\d+)$/i);
  if (chapter) return { type: "goToChapter", chapter: Number(chapter[1] ?? chapter[2]) };
  const verse = phrase.match(/^(?:(?:go\s+to|open)\s+)?verse\s+(\d+)$/i);
  if (verse) return { type: "goToVerse", verse: Number(verse[1]) };
  if (/^(?:first verse|go to first verse|start of (?:this )?chapter)$/i.test(phrase)) return { type: "firstVerse" };
  if (/^(?:last verse|go to last verse|end of (?:this )?chapter)$/i.test(phrase)) return { type: "lastVerse" };

  if (/^(read|resume|play|start reading|read aloud|read this verse|play this verse)$/i.test(phrase)) return { type: "read" };
  if (/^(pause|stop|stop reading|pause reading|stop playback)$/i.test(phrase)) return { type: "pause" };
  if (/^(help|voice help|what can i say|what commands can i say|list commands)$/i.test(phrase)) return { type: "help" };
  if (/^repeat( this verse| verse| reading)?$/i.test(phrase)) return { type: "repeat" };
  if (/^(?:bookmark|save|remember)(?: (?:this|current|the))?(?: verse)?$|^(?:bookmark|save) verse$|^add bookmark$/i.test(phrase)) return { type: "bookmark" };
  if (/^(go\s+)?home$|^back to reader$/i.test(phrase)) return { type: "home" };
  if (/^(go\s+to\s+)?navigate$|^(open )?bible navigation$/i.test(phrase)) return { type: "navigate" };
  if (/^(go\s+to\s+)?settings$|^open settings$/i.test(phrase)) return { type: "settings" };
  if (/^(go\s+to\s+)?bookmarks$|^open bookmarks$/i.test(phrase)) return { type: "bookmarks" };
  if (/^(go\s+to\s+)?profile$|^open profile$/i.test(phrase)) return { type: "profile" };
  if (/^(faster|increase speed|speed up|read faster)$/i.test(phrase)) return { type: "faster" };
  if (/^(slower|decrease speed|slow down|read slower)$/i.test(phrase)) return { type: "slower" };

  const speed = phrase.match(/^(?:change\s+(?:the\s+)?(?:reading\s+)?speed(?:\s+to)?|(?:reading\s+)?speed\s*(?:to)?)[\s:=]*(0?\.\d+|\d+(?:\.\d+)?)\s*(?:x|×|times)?$/i);
  if (speed) {
    const value = Number(speed[1]);
    if ([0.75, 1, 1.25, 1.5].includes(value)) return { type: "speed", value };
  }
  return null;
}

export const READING_SPEEDS = [0.75, 1, 1.25, 1.5] as const;

export const VOICE_LISTENING_WINDOW_MS = 60_000;

export function getAdjacentBookReference(reference: BibleReference, direction: -1 | 1): BibleReference | null {
  const index = BIBLE_BOOKS.findIndex((book) => book.name === reference.book);
  const nextBook = BIBLE_BOOKS[index + direction];
  if (!nextBook) return null;
  return {
    book: nextBook.name,
    chapter: direction > 0 ? 1 : nextBook.chapters,
    verse: 1,
  };
}

export function shouldResumeAfterPause(deadline: number, now: number, hasFinalResult: boolean) {
  return !hasFinalResult && deadline > 0 && now < deadline;
}
