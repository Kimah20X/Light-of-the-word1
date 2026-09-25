import { describe, expect, it } from "vitest";
import { BIBLE_BOOKS, parseBibleReference } from "../lib/bible-catalog";

describe("KJV navigation catalog", () => {
  it("contains all 66 canonical books split between both Testaments", () => {
    expect(BIBLE_BOOKS).toHaveLength(66);
    expect(BIBLE_BOOKS.filter((book) => book.testament === "Old Testament")).toHaveLength(39);
    expect(BIBLE_BOOKS.filter((book) => book.testament === "New Testament")).toHaveLength(27);
    expect(BIBLE_BOOKS[0]?.name).toBe("Genesis");
    expect(BIBLE_BOOKS.at(-1)?.name).toBe("Revelation");
  });

  it("parses book and chapter references with a default first verse", () => {
    expect(parseBibleReference("Romans 6")).toEqual({ book: "Romans", chapter: 6, verse: 1 });
  });

  it("parses direct references case-insensitively", () => {
    expect(parseBibleReference("john 3:16")).toEqual({ book: "John", chapter: 3, verse: 16 });
  });

  it("rejects unknown books and out-of-range chapters", () => {
    expect(parseBibleReference("Not a Book 4:2")).toBeNull();
    expect(parseBibleReference("Romans 17:1")).toBeNull();
    expect(parseBibleReference("Romans 0:2")).toBeNull();
  });
});
