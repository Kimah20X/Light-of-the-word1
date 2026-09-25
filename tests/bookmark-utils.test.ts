import { describe, expect, it } from "vitest";
import { saveBookmarkIfMissing } from "../lib/bookmark-utils";

describe("save current verse bookmark", () => {
  it("adds the displayed reference once and preserves its identity on repeated saves", () => {
    const verse = { book: "John", chapter: 3, verse: 16 };
    const first = saveBookmarkIfMissing([], verse);

    expect(first.added).toBe(true);
    expect(first.bookmarks).toEqual([{ ...verse, id: "John-3-16" }]);

    const second = saveBookmarkIfMissing(first.bookmarks, verse);
    expect(second.added).toBe(false);
    expect(second.bookmarks).toBe(first.bookmarks);
    expect(second.bookmarks).toHaveLength(1);
  });

  it("preserves saved verses when adding a different reference", () => {
    const firstVerse = { book: "John", chapter: 3, verse: 16 };
    const secondVerse = { book: "Romans", chapter: 6, verse: 2 };
    const first = saveBookmarkIfMissing([], firstVerse);
    const second = saveBookmarkIfMissing(first.bookmarks, secondVerse);

    expect(second.added).toBe(true);
    expect(second.bookmarks.map(({ id }) => id)).toEqual(["John-3-16", "Romans-6-2"]);
  });
});
