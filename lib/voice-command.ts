import { parseBibleReference } from "./bible-catalog";
import { BIBLE_BOOKS } from "./bible-catalog";
import type { BibleReference } from "./app-state";

export type VoiceCommandIntent =
  | { type: "open"; reference: BibleReference }
  | { type: "openReader" }
  | { type: "nextVerse" | "previousVerse" | "nextChapter" | "previousChapter" }
  | { type: "read" | "pause" | "repeat" | "bookmark" }
  | { type: "home" | "settings" | "bookmarks" | "profile" | "help" }
  | { type: "speed"; value: number }
  | { type: "faster" | "slower" };

/** Parses typed voice-style commands locally; it never records or sends speech. */
export function parseVoiceCommand(input: string): VoiceCommandIntent | null {
  const phrase = input
    .trim()
    .replace(/[.!?]+$/, "")
    .replace(/^(please\s+|can you\s+|could you\s+)/i, "")
    .trim();
  if (!phrase) return null;

  if (/^(?:open|start|read)(?:\s+the)?\s+bible(?:\s+reader)?$/i.test(phrase)) return { type: "openReader" };

  const openPhrase = phrase.replace(/^(?:open|read|show me|go to|navigate to|turn to|take me to|jump to)\s+/i, "");
  const reference = parseBibleReference(openPhrase);
  if (reference && (openPhrase !== phrase || /^\S+\s+\d/.test(phrase))) {
    return { type: "open", reference };
  }

  if (/^(next|forward|move to the next)\s+verse$/i.test(phrase)) return { type: "nextVerse" };
  if (/^(previous|prev|back|go to the previous)\s+verse$/i.test(phrase)) return { type: "previousVerse" };
  if (/^(next|forward|move to the next)\s+chapter$/i.test(phrase)) return { type: "nextChapter" };
  if (/^(previous|prev|back|go to the previous)\s+chapter$/i.test(phrase)) return { type: "previousChapter" };
  if (/^(read|resume|play|start reading|read this verse|read this passage|read aloud)$/i.test(phrase)) return { type: "read" };
  if (/^(pause|stop|stop reading|pause reading)$/i.test(phrase)) return { type: "pause" };
  if (/^(help|voice help|command help|what can i say|what commands can i say|show commands|list commands)$/i.test(phrase)) return { type: "help" };
  if (/^(repeat( this)? (verse|passage)|repeat|say that again)$/i.test(phrase)) return { type: "repeat" };
  if (/^(?:bookmark|save|(?:bookmark|save|remember|mark) (?:this|current) verse|bookmark verse|save verse|add bookmark|add to bookmarks|save my place|save this passage)$/i.test(phrase)) return { type: "bookmark" };
  if (/^(?:go(?:\s+to)? |take me to |return to )?(?:home|home page)$/i.test(phrase)) return { type: "home" };
  if (/^(?:(?:go|navigate|open|show|take me)(?: to)? )?(?:my )?settings$/i.test(phrase)) return { type: "settings" };
  if (/^(?:(?:go|navigate|open|show|take me)(?: to)? )?(?:my )?bookmarks$/i.test(phrase)) return { type: "bookmarks" };
  if (/^(?:(?:go|navigate|open|show|take me)(?: to)? )?(?:my )?profile$/i.test(phrase)) return { type: "profile" };
  if (/^(faster|increase speed|speed up|read faster)$/i.test(phrase)) return { type: "faster" };
  if (/^(slower|decrease speed|slow down|read slower)$/i.test(phrase)) return { type: "slower" };

  const speed = phrase.match(/^(?:change\s+(?:the\s+)?(?:reading\s+)?speed(?:\s+to)?|(?:reading\s+)?speed\s*(?:to)?|set\s+(?:reading\s+)?speed\s+to)[\s:=]*(0?\.\d+|\d+(?:\.\d+)?)\s*(?:x|×|times)?$/i);
  if (speed) {
    const value = Number(speed[1]);
    if ([0.75, 1, 1.25, 1.5].includes(value)) return { type: "speed", value };
  }
  return null;
}

export const READING_SPEEDS = [0.75, 1, 1.25, 1.5] as const;

export const VOICE_LISTENING_WINDOW_MS = 60_000;

export function shouldResumeAfterPause(deadline: number, now: number, hasFinalResult: boolean) {
  return !hasFinalResult && deadline > 0 && now < deadline;
}

export function moveChapterReference(reference: BibleReference, delta: -1 | 1) {
  const bookIndex = BIBLE_BOOKS.findIndex((book) => book.name === reference.book);
  if (bookIndex < 0) return { reference, moved: false };

  const currentBook = BIBLE_BOOKS[bookIndex]!;
  let nextBookIndex = bookIndex;
  let chapter = reference.chapter + delta;
  if (chapter > currentBook.chapters) {
    nextBookIndex += 1;
    chapter = 1;
  } else if (chapter < 1) {
    nextBookIndex -= 1;
    chapter = BIBLE_BOOKS[nextBookIndex]?.chapters ?? 0;
  }

  const nextBook = BIBLE_BOOKS[nextBookIndex];
  if (!nextBook || chapter < 1) return { reference, moved: false };
  return { reference: { book: nextBook.name, chapter, verse: 1 }, moved: true };
}

export function nextVerseReference(reference: BibleReference, verseCount: number) {
  if (!Number.isInteger(verseCount) || verseCount < 1) {
    return { reference, moved: false, reachedEnd: false };
  }
  if (reference.verse < verseCount) {
    return { reference: { ...reference, verse: reference.verse + 1 }, moved: true, reachedEnd: false };
  }
  const nextChapter = moveChapterReference(reference, 1);
  return nextChapter.moved
    ? { reference: nextChapter.reference, moved: true, reachedEnd: false }
    : { reference, moved: false, reachedEnd: true };
}
