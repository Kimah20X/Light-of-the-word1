import { describe, expect, it } from "vitest";
import { parseVoiceCommand, shouldResumeAfterPause, VOICE_LISTENING_WINDOW_MS } from "../lib/voice-command";

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
  });

  it("supports previous/next verse and chapter", () => {
    expect(parseVoiceCommand("Next verse")).toEqual({ type: "nextVerse" });
    expect(parseVoiceCommand("Previous verse")).toEqual({ type: "previousVerse" });
    expect(parseVoiceCommand("Next chapter")).toEqual({ type: "nextChapter" });
    expect(parseVoiceCommand("Previous chapter")).toEqual({ type: "previousChapter" });
  });

  it("supports reading, repeat, and bookmark commands", () => {
    expect(parseVoiceCommand("Read")).toEqual({ type: "read" });
    expect(parseVoiceCommand("Resume")).toEqual({ type: "read" });
    expect(parseVoiceCommand("Pause")).toEqual({ type: "pause" });
    expect(parseVoiceCommand("Repeat this verse")).toEqual({ type: "repeat" });
    expect(parseVoiceCommand("Bookmark this verse")).toEqual({ type: "bookmark" });
  });

  it("supports spoken help requests", () => {
    expect(parseVoiceCommand("Help")).toEqual({ type: "help" });
    expect(parseVoiceCommand("What commands can I say?")).toEqual({ type: "help" });
  });

  it("keeps pause retries inside the one-minute listening window", () => {
    const deadline = 120_000 + VOICE_LISTENING_WINDOW_MS;
    expect(VOICE_LISTENING_WINDOW_MS).toBe(60_000);
    expect(shouldResumeAfterPause(deadline, 120_001, false)).toBe(true);
    expect(shouldResumeAfterPause(deadline, deadline, false)).toBe(false);
    expect(shouldResumeAfterPause(deadline, 120_001, true)).toBe(false);
  });

  it("supports app destinations and common speed adjustments", () => {
    expect(parseVoiceCommand("Go home")).toEqual({ type: "home" });
    expect(parseVoiceCommand("Go to settings")).toEqual({ type: "settings" });
    expect(parseVoiceCommand("Bookmarks")).toEqual({ type: "bookmarks" });
    expect(parseVoiceCommand("Profile")).toEqual({ type: "profile" });
    expect(parseVoiceCommand("Change reading speed to 1.25×")).toEqual({ type: "speed", value: 1.25 });
    expect(parseVoiceCommand("Faster")).toEqual({ type: "faster" });
    expect(parseVoiceCommand("Slower")).toEqual({ type: "slower" });
  });

  it("rejects unknown references, unsupported speeds, and empty commands", () => {
    expect(parseVoiceCommand("Open Romans 99")).toBeNull();
    expect(parseVoiceCommand("Change speed to 1.1")).toBeNull();
    expect(parseVoiceCommand(" ")).toBeNull();
  });
});
