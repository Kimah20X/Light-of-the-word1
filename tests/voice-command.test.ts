import { describe, expect, it } from "vitest";
import { moveChapterReference, nextVerseReference, parseVoiceCommand, shouldResumeAfterPause, VOICE_LISTENING_WINDOW_MS } from "../lib/voice-command";

describe("voice command parser", () => {
  it("opens a book, chapter, or verse reference", () => {
    expect(parseVoiceCommand("Open Bible")).toEqual({ type: "openReader" });
    expect(parseVoiceCommand("Read the Bible")).toEqual({ type: "openReader" });
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
    expect(parseVoiceCommand("Show me John three sixteen")).toEqual({
      type: "open",
      reference: { book: "John", chapter: 3, verse: 16 },
    });
    expect(parseVoiceCommand("Turn to First Corinthians thirteen four")).toEqual({
      type: "open",
      reference: { book: "1 Corinthians", chapter: 13, verse: 4 },
    });
  });

  it("supports previous/next verse and chapter", () => {
    expect(parseVoiceCommand("Next verse")).toEqual({ type: "nextVerse" });
    expect(parseVoiceCommand("Previous verse")).toEqual({ type: "previousVerse" });
    expect(parseVoiceCommand("Next chapter")).toEqual({ type: "nextChapter" });
    expect(parseVoiceCommand("Previous chapter")).toEqual({ type: "previousChapter" });
    expect(parseVoiceCommand("Move to the next verse")).toEqual({ type: "nextVerse" });
    expect(parseVoiceCommand("Go to the previous chapter")).toEqual({ type: "previousChapter" });
  });

  it("supports reading, repeat, and bookmark commands", () => {
    expect(parseVoiceCommand("Read")).toEqual({ type: "read" });
    expect(parseVoiceCommand("Resume")).toEqual({ type: "read" });
    expect(parseVoiceCommand("Pause")).toEqual({ type: "pause" });
    expect(parseVoiceCommand("Stop")).toEqual({ type: "pause" });
    expect(parseVoiceCommand("Stop reading")).toEqual({ type: "pause" });
    expect(parseVoiceCommand("Repeat this verse")).toEqual({ type: "repeat" });
    expect(parseVoiceCommand("Bookmark")).toEqual({ type: "bookmark" });
    expect(parseVoiceCommand("Bookmark this verse")).toEqual({ type: "bookmark" });
    expect(parseVoiceCommand("Save this verse")).toEqual({ type: "bookmark" });
    expect(parseVoiceCommand("Save current verse")).toEqual({ type: "bookmark" });
    expect(parseVoiceCommand("Bookmark current verse")).toEqual({ type: "bookmark" });
    expect(parseVoiceCommand("Add bookmark")).toEqual({ type: "bookmark" });
    expect(parseVoiceCommand("Mark this verse")).toEqual({ type: "bookmark" });
    expect(parseVoiceCommand("Save my place")).toEqual({ type: "bookmark" });
    expect(parseVoiceCommand("Read this passage")).toEqual({ type: "read" });
    expect(parseVoiceCommand("Say that again")).toEqual({ type: "repeat" });
  });

  it("supports spoken help requests", () => {
    expect(parseVoiceCommand("Help")).toEqual({ type: "help" });
    expect(parseVoiceCommand("What commands can I say?")).toEqual({ type: "help" });
    expect(parseVoiceCommand("Show commands")).toEqual({ type: "help" });
  });

  it("keeps pause retries inside the one-minute listening window", () => {
    const deadline = 120_000 + VOICE_LISTENING_WINDOW_MS;
    expect(VOICE_LISTENING_WINDOW_MS).toBe(60_000);
    expect(shouldResumeAfterPause(deadline, 120_001, false)).toBe(true);
    expect(shouldResumeAfterPause(deadline, deadline, false)).toBe(false);
    expect(shouldResumeAfterPause(deadline, 120_001, true)).toBe(false);
  });

  it("moves chapters across book boundaries and stops at the Bible's ends", () => {
    expect(moveChapterReference({ book: "Genesis", chapter: 1, verse: 9 }, -1)).toEqual({
      reference: { book: "Genesis", chapter: 1, verse: 9 }, moved: false,
    });
    expect(moveChapterReference({ book: "Genesis", chapter: 1, verse: 9 }, 1)).toEqual({
      reference: { book: "Genesis", chapter: 2, verse: 1 }, moved: true,
    });
    expect(moveChapterReference({ book: "Genesis", chapter: 50, verse: 12 }, 1)).toEqual({
      reference: { book: "Exodus", chapter: 1, verse: 1 }, moved: true,
    });
    expect(moveChapterReference({ book: "Exodus", chapter: 1, verse: 1 }, -1)).toEqual({
      reference: { book: "Genesis", chapter: 50, verse: 1 }, moved: true,
    });
    expect(moveChapterReference({ book: "Revelation", chapter: 22, verse: 21 }, 1)).toEqual({
      reference: { book: "Revelation", chapter: 22, verse: 21 }, moved: false,
    });
  });

  it("advances continuous reading across verses, chapters, books, and the end of the Bible", () => {
    expect(nextVerseReference({ book: "John", chapter: 3, verse: 15 }, 36)).toEqual({
      reference: { book: "John", chapter: 3, verse: 16 }, moved: true, reachedEnd: false,
    });
    expect(nextVerseReference({ book: "Genesis", chapter: 1, verse: 31 }, 31)).toEqual({
      reference: { book: "Genesis", chapter: 2, verse: 1 }, moved: true, reachedEnd: false,
    });
    expect(nextVerseReference({ book: "Genesis", chapter: 50, verse: 26 }, 26)).toEqual({
      reference: { book: "Exodus", chapter: 1, verse: 1 }, moved: true, reachedEnd: false,
    });
    expect(nextVerseReference({ book: "Revelation", chapter: 22, verse: 21 }, 21)).toEqual({
      reference: { book: "Revelation", chapter: 22, verse: 21 }, moved: false, reachedEnd: true,
    });
    expect(nextVerseReference({ book: "John", chapter: 3, verse: 1 }, 0)).toEqual({
      reference: { book: "John", chapter: 3, verse: 1 }, moved: false, reachedEnd: false,
    });
  });

  it("supports app destinations and common speed adjustments", () => {
    expect(parseVoiceCommand("Go home")).toEqual({ type: "home" });
    expect(parseVoiceCommand("Go to settings")).toEqual({ type: "settings" });
    expect(parseVoiceCommand("Bookmarks")).toEqual({ type: "bookmarks" });
    expect(parseVoiceCommand("Open my bookmarks")).toEqual({ type: "bookmarks" });
    expect(parseVoiceCommand("Show settings")).toEqual({ type: "settings" });
    expect(parseVoiceCommand("Profile")).toEqual({ type: "profile" });
    expect(parseVoiceCommand("Change reading speed to 1.25×")).toEqual({ type: "speed", value: 1.25 });
    expect(parseVoiceCommand("Set speed to 1.25 times")).toEqual({ type: "speed", value: 1.25 });
    expect(parseVoiceCommand("Faster")).toEqual({ type: "faster" });
    expect(parseVoiceCommand("Speed up")).toEqual({ type: "faster" });
    expect(parseVoiceCommand("Slower")).toEqual({ type: "slower" });
    expect(parseVoiceCommand("Slow down")).toEqual({ type: "slower" });
  });

  it("rejects unknown references, unsupported speeds, and empty commands", () => {
    expect(parseVoiceCommand("Open Romans 99")).toBeNull();
    expect(parseVoiceCommand("Change speed to 1.1")).toBeNull();
    expect(parseVoiceCommand(" ")).toBeNull();
  });
});
