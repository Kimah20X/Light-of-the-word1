import { describe, expect, it } from "vitest";
import { getAdjacentBookReference, parseVoiceCommand, shouldResumeAfterPause, VOICE_LISTENING_WINDOW_MS } from "../lib/voice-command";

describe("voice command parser", () => {
  it("opens a book, chapter, or verse reference", () => {
    expect(parseVoiceCommand("Open Romans 6")).toEqual({
      type: "open",
      reference: { book: "Romans", chapter: 6, verse: 1 },
    });
    expect(parseVoiceCommand("Open John 3:16")).toEqual({
      type: "open",
      reference: { book: "John", chapter: 3, verse: 16 },
    });
    expect(parseVoiceCommand("Open John chapter 3 verse 16")).toEqual({
      type: "open",
      reference: { book: "John", chapter: 3, verse: 16 },
    });
    expect(parseVoiceCommand("Take me to John chapter three verse sixteen")).toEqual({
      type: "open",
      reference: { book: "John", chapter: 3, verse: 16 },
    });
    expect(parseVoiceCommand("Open Psalms")).toEqual({
      type: "open",
      reference: { book: "Psalms", chapter: 1, verse: 1 },
    });
  });

  it("supports common movement phrases", () => {
    expect(parseVoiceCommand("Next verse")).toEqual({ type: "nextVerse" });
    expect(parseVoiceCommand("Go back one verse")).toEqual({ type: "previousVerse" });
    expect(parseVoiceCommand("Forward chapter")).toEqual({ type: "nextChapter" });
    expect(parseVoiceCommand("Back chapter")).toEqual({ type: "previousChapter" });
    expect(parseVoiceCommand("Next book")).toEqual({ type: "nextBook" });
    expect(parseVoiceCommand("Previous book")).toEqual({ type: "previousBook" });
    expect(parseVoiceCommand("Go to chapter four")).toEqual({ type: "goToChapter", chapter: 4 });
    expect(parseVoiceCommand("Verse 8")).toEqual({ type: "goToVerse", verse: 8 });
    expect(parseVoiceCommand("Start of chapter")).toEqual({ type: "firstVerse" });
    expect(parseVoiceCommand("End of this chapter")).toEqual({ type: "lastVerse" });
  });

  it("supports reading, repeat, and bookmark aliases", () => {
    expect(parseVoiceCommand("Read aloud")).toEqual({ type: "read" });
    expect(parseVoiceCommand("Resume")).toEqual({ type: "read" });
    expect(parseVoiceCommand("Pause reading")).toEqual({ type: "pause" });
    expect(parseVoiceCommand("Repeat this verse")).toEqual({ type: "repeat" });
    expect(parseVoiceCommand("Bookmark")).toEqual({ type: "bookmark" });
    expect(parseVoiceCommand("Remember this verse")).toEqual({ type: "bookmark" });
    expect(parseVoiceCommand("Save current verse")).toEqual({ type: "bookmark" });
    expect(parseVoiceCommand("Add bookmark")).toEqual({ type: "bookmark" });
  });

  it("supports help and app destinations", () => {
    expect(parseVoiceCommand("Help")).toEqual({ type: "help" });
    expect(parseVoiceCommand("What commands can I say?")).toEqual({ type: "help" });
    expect(parseVoiceCommand("Go home")).toEqual({ type: "home" });
    expect(parseVoiceCommand("Go to settings")).toEqual({ type: "settings" });
    expect(parseVoiceCommand("Open bookmarks")).toEqual({ type: "bookmarks" });
    expect(parseVoiceCommand("Navigate")).toEqual({ type: "navigate" });
    expect(parseVoiceCommand("Profile")).toEqual({ type: "profile" });
  });

  it("supports common speed adjustments", () => {
    expect(parseVoiceCommand("Change reading speed to 1.25×")).toEqual({ type: "speed", value: 1.25 });
    expect(parseVoiceCommand("Faster")).toEqual({ type: "faster" });
    expect(parseVoiceCommand("Slow down")).toEqual({ type: "slower" });
  });

  it("moves between adjacent books without crossing the Bible boundaries", () => {
    expect(getAdjacentBookReference({ book: "Genesis", chapter: 1, verse: 9 }, -1)).toBeNull();
    expect(getAdjacentBookReference({ book: "Genesis", chapter: 1, verse: 9 }, 1)).toEqual({ book: "Exodus", chapter: 1, verse: 1 });
    expect(getAdjacentBookReference({ book: "Revelation", chapter: 22, verse: 9 }, 1)).toBeNull();
  });

  it("keeps pause retries inside the one-minute listening window", () => {
    const deadline = 120_000 + VOICE_LISTENING_WINDOW_MS;
    expect(VOICE_LISTENING_WINDOW_MS).toBe(60_000);
    expect(shouldResumeAfterPause(deadline, 120_001, false)).toBe(true);
    expect(shouldResumeAfterPause(deadline, deadline, false)).toBe(false);
    expect(shouldResumeAfterPause(deadline, 120_001, true)).toBe(false);
  });

  it("rejects unknown references, unsupported speeds, and empty commands", () => {
    expect(parseVoiceCommand("Open Romans 99")).toBeNull();
    expect(parseVoiceCommand("Change speed to 1.1")).toBeNull();
    expect(parseVoiceCommand(" ")).toBeNull();
    expect(parseVoiceCommand("Do something surprising")).toBeNull();
  });
});
