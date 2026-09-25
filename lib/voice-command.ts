import { parseBibleReference } from "./bible-catalog";
import type { BibleReference } from "./app-state";

export type VoiceCommandIntent =
  | { type: "open"; reference: BibleReference }
  | { type: "nextVerse" | "previousVerse" | "nextChapter" | "previousChapter" }
  | { type: "read" | "pause" | "repeat" | "bookmark" }
  | { type: "home" | "settings" | "bookmarks" | "profile" }
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

  const openPhrase = phrase.replace(/^open\s+/i, "");
  const reference = parseBibleReference(openPhrase);
  if (reference && (/^open\s+/i.test(phrase) || openPhrase !== phrase || /^\S+\s+\d/.test(phrase))) {
    return { type: "open", reference };
  }

  if (/^(next|forward)\s+verse$/i.test(phrase)) return { type: "nextVerse" };
  if (/^(previous|prev|back)\s+verse$/i.test(phrase)) return { type: "previousVerse" };
  if (/^(next|forward)\s+chapter$/i.test(phrase)) return { type: "nextChapter" };
  if (/^(previous|prev|back)\s+chapter$/i.test(phrase)) return { type: "previousChapter" };
  if (/^(read|resume|play|start reading)$/i.test(phrase)) return { type: "read" };
  if (/^(pause|stop|stop reading)$/i.test(phrase)) return { type: "pause" };
  if (/^repeat( this verse)?$/i.test(phrase)) return { type: "repeat" };
  if (/^(bookmark|bookmark this verse|save this verse)$/i.test(phrase)) return { type: "bookmark" };
  if (/^(go\s+)?home$/i.test(phrase)) return { type: "home" };
  if (/^(go\s+to\s+)?settings$/i.test(phrase)) return { type: "settings" };
  if (/^(go\s+to\s+)?bookmarks$/i.test(phrase)) return { type: "bookmarks" };
  if (/^(go\s+to\s+)?profile$/i.test(phrase)) return { type: "profile" };
  if (/^(faster|increase speed)$/i.test(phrase)) return { type: "faster" };
  if (/^(slower|decrease speed)$/i.test(phrase)) return { type: "slower" };

  const speed = phrase.match(/^(?:change\s+(?:the\s+)?(?:reading\s+)?speed(?:\s+to)?|(?:reading\s+)?speed\s*(?:to)?)[\s:=]*(0?\.\d+|\d+(?:\.\d+)?)\s*(?:x|×|times)?$/i);
  if (speed) {
    const value = Number(speed[1]);
    if ([0.75, 1, 1.25, 1.5].includes(value)) return { type: "speed", value };
  }
  return null;
}

export const READING_SPEEDS = [0.75, 1, 1.25, 1.5] as const;
