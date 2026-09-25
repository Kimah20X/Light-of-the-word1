import { describe, expect, it } from "vitest";
import {
  API_BIBLE_BOOK_IDS,
  isKjvBibleMetadata,
  parseApiBibleChapterHtml,
  validateApiBibleReference,
} from "../server/api-bible";
import { BIBLE_BOOKS } from "../lib/bible-catalog";

describe("API.Bible chapter adapter", () => {
  it("has provider IDs for every canonical Bible book", () => {
    expect(Object.keys(API_BIBLE_BOOK_IDS)).toHaveLength(66);
    expect(Object.keys(API_BIBLE_BOOK_IDS)).toEqual(BIBLE_BOOKS.map((book) => book.name));
  });

  it("parses numbered verse spans and decodes HTML entities", () => {
    const verses = parseApiBibleChapterHtml(
      '<p class="p"><span data-number="1" class="v">1</span>In the beginning &amp; the earth.</p>' +
      '<p class="p"><span data-number="2" class="v">2</span>And the earth was without form.</p>',
    );
    expect(verses).toEqual([
      { number: 1, text: "In the beginning & the earth." },
      { number: 2, text: "And the earth was without form." },
    ]);
  });

  it("ignores headings and unrelated spans", () => {
    const verses = parseApiBibleChapterHtml(
      '<p class="s1">A heading</p><p class="p"><span class="x">x</span><span class="v" data-number="7">7</span>Verse seven.</p>',
    );
    expect(verses).toEqual([{ number: 7, text: "Verse seven." }]);
  });

  it("validates canonical book and chapter boundaries", () => {
    expect(validateApiBibleReference("Romans", 16)).toBe(true);
    expect(validateApiBibleReference("Romans", 17)).toBe(false);
    expect(validateApiBibleReference("No Such Book", 1)).toBe(false);
    expect(validateApiBibleReference("Jude", 0)).toBe(false);
  });

  it("recognizes English KJV metadata and rejects other translations", () => {
    expect(isKjvBibleMetadata({ abbreviation: "KJV", name: "King James Version", language: { id: "eng", name: "English" } })).toBe(true);
    expect(isKjvBibleMetadata({ abbreviation: "WEB", name: "World English Bible", language: { id: "eng", name: "English" } })).toBe(false);
    expect(isKjvBibleMetadata({ abbreviation: "KJV", name: "King James Version", language: { id: "hau", name: "Hausa" } })).toBe(false);
  });
});
