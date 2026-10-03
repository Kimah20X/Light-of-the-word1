import { BIBLE_BOOKS, parseBibleReference } from "./bible-catalog";
import type { BibleReference } from "./app-state";
import { normalizeSpeechTranscript, parseVoiceLanguage, type VoiceLanguage } from "./voice-language";

export type VoiceCommandIntent =
  | { type: "open"; reference: BibleReference }
  | { type: "openReader" }
  | { type: "nextVerse" | "previousVerse" | "nextChapter" | "previousChapter" }
  | { type: "read" | "readChapter" | "pause" | "repeat" | "bookmark" | "startChapter" | "currentReference" | "closeVoice" | "listen" }
  | { type: "language"; value: VoiceLanguage }
  | { type: "home" | "settings" | "bookmarks" | "profile" | "navigate" | "login" | "signup" | "help" }
  | { type: "fontSize"; value: "small" | "medium" | "large" }
  | { type: "autoplay"; value: boolean }
  | { type: "speed"; value: number }
  | { type: "faster" | "slower" };

/** Local-only command interpreter. Transcripts are never uploaded to the app backend. */
export function parseVoiceCommand(input: string): VoiceCommandIntent | null {
  const phrase = normalizeSpeechTranscript(input)
    .replace(/[.!?]+$/, "")
    .replace(/^(please\s+|can you\s+|could you\s+)/i, "")
    .trim();
  if (!phrase) return null;

  if (/^(?:open|start|read)(?:\s+the)?\s+bible(?:\s+reader)?$|^bude bible$|^si bibeli$|^mepee bible$/i.test(phrase)) return { type: "openReader" };

  const languagePhrase = phrase.match(/^(?:change(?:\s+the)?\s+language(?:\s+to)?|change\s+to|switch(?:\s+the)?\s+language(?:\s+to)?|switch\s+to|speak\s+in|use|set(?:\s+the)?\s+language(?:\s+to)?|canza\s+harshe\s+zuwa|yi\s+ede\s+pad[aa]\s+si|gbanwee\s+asusu\s+gaa\s+na)\s+(.+)$/i);
  const language = parseVoiceLanguage(languagePhrase?.[1] ?? phrase);
  if (language && (languagePhrase || phrase === language.toLowerCase())) return { type: "language", value: language };

  const openPhrase = phrase.replace(/^(?:open|read|show me|go to|navigate to|turn to|take me to|jump to|find)\s+/i, "");
  const reference = parseBibleReference(openPhrase);
  if (reference) return { type: "open", reference };

  if (/^(?:next|forward|advance|skip|another verse|move to the next|go forward one)\s*(?:the\s+)?verse(?:\s+please)?$|^(?:next|forward|another verse)$|^aya ta gaba$|^ese ti o tele$|^amaokwu ozo$/i.test(phrase)) return { type: "nextVerse" };
  if (/^(?:previous|prev|back|rewind|go back one|go to the previous|move to the previous)\s*(?:the\s+)?verse(?:\s+please)?$|^(?:back|previous|rewind)$|^aya ta baya$|^ese ti o ti koja$|^amaokwu gara aga$/i.test(phrase)) return { type: "previousVerse" };
  if (/^(?:next|forward|advance|move to the next|go forward one)\s+(?:the\s+)?chapter(?:\s+please)?$|^next chapter$|^babi na gaba$|^ori ti o tele$|^isiakwukwo ozo$/i.test(phrase)) return { type: "nextChapter" };
  if (/^(?:previous|prev|back|go back one|go to the previous|move to the previous)\s+(?:the\s+)?chapter(?:\s+please)?$|^previous chapter$|^babi na baya$|^ori ti o ti koja$|^isiakwukwo gara aga$/i.test(phrase)) return { type: "previousChapter" };
  if (/^(read|resume|play|start reading|keep reading|continue reading|read this verse|read this passage|read aloud|begin reading|karanta|ka|guo|ka bibeli|guo bible)$/i.test(phrase)) return { type: "read" };
  if (/^(read|play|start reading|read aloud)\s+(?:this\s+)?chapter$/i.test(phrase)) return { type: "readChapter" };
  if (/^(pause|stop|stop reading|pause reading|stop playback|stop the bible|daina|tsaya|duro|kwusi)$/i.test(phrase)) return { type: "pause" };
  if (/^(help|voice help|command help|what can i say|what commands can i say|what can i ask|show commands|list commands|taimako|iranlowo|enyemaka)$/i.test(phrase)) return { type: "help" };
  if (/^(repeat(?: (?:this|current))? (?:verse|passage|chapter)|repeat|say that again|read that again|again|maimaita ayar|tun ese yii ka|guo amaokwu a ozo)$/i.test(phrase)) return { type: "repeat" };
  if (/^(?:bookmark|save|remember|mark)(?:\s+(?:this|the|my|current))?(?:\s+(?:bible\s+)?(?:verse|passage|place))?$|^(?:add bookmark|add (?:this )?verse to bookmarks|save my place|fipamo ese yii|fi ese yii pamo|chekwaa amaokwu a|chekwaa ebe m|ajiye wannan aya)$/i.test(phrase)) return { type: "bookmark" };
  if (/^(?:go to the )?(?:beginning|start) of (?:this )?chapter|first verse of (?:this )?chapter$/i.test(phrase)) return { type: "startChapter" };
  if (/^(?:where am i|what (?:verse|passage|reference) am i on|read (?:the )?current reference|what is the current reference)$/i.test(phrase)) return { type: "currentReference" };
  if (/^(?:close|exit|dismiss) (?:the )?(?:voice controller|voice assistant|microphone)|^stop listening$/i.test(phrase)) return { type: "closeVoice" };
  if (/^(?:start|begin|resume) listening(?: for commands)?$|^listen(?: again| for commands)?$/i.test(phrase)) return { type: "listen" };
  if (/^(?:turn|switch|set) (?:chapter )?auto(?:matic)?[- ]?play (on|off)$|^(?:enable|disable) auto(?:matic)?[- ]?play$/i.test(phrase)) {
    return { type: "autoplay", value: /(?:on|enable)$/.test(phrase) };
  }

  const fontSize = phrase.match(/^(?:(?:set|change|make|increase|decrease)?\s*(?:the )?(?:reader )?(?:font|text) size(?: to)?\s+)?(small|medium|large|bigger|larger|smaller)(?:\s+(?:font|text|letters))?$|^(?:make|set) (?:the )?(?:font|text) (smaller|bigger|larger)$/i);
  if (fontSize) {
    const size = (fontSize[1] ?? fontSize[2])!.toLowerCase();
    return { type: "fontSize", value: size === "small" || size === "smaller" ? "small" : size === "medium" ? "medium" : "large" };
  }
  if (/^(?:go(?:\s+to)? |take me to |return to )?(?:home|home page)$/i.test(phrase)) return { type: "home" };
  if (/^(?:(?:go|navigate|open|show|take me)(?: to)? )?(?:my )?settings$/i.test(phrase)) return { type: "settings" };
  if (/^(?:(?:go|navigate|open|show|take me)(?: to)? )?(?:my )?bookmarks$/i.test(phrase)) return { type: "bookmarks" };
  if (/^(?:(?:go|navigate|open|show|take me)(?: to)? )?(?:my )?profile$/i.test(phrase)) return { type: "profile" };
  if (/^(?:(?:go|navigate|open|show|take me)(?: to)? )?(?:the )?navigate(?: screen)?$|^navigate screen$/i.test(phrase)) return { type: "navigate" };
  if (/^(?:sign in|log in|login|open login)$/i.test(phrase)) return { type: "login" };
  if (/^(?:sign up|signup|register|create account|open signup)$/i.test(phrase)) return { type: "signup" };
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
  if (!Number.isInteger(verseCount) || verseCount < 1) return { reference, moved: false, reachedEnd: false };
  if (reference.verse < verseCount) return { reference: { ...reference, verse: reference.verse + 1 }, moved: true, reachedEnd: false };
  const nextChapter = moveChapterReference(reference, 1);
  return nextChapter.moved
    ? { reference: nextChapter.reference, moved: true, reachedEnd: false }
    : { reference, moved: false, reachedEnd: true };
}
