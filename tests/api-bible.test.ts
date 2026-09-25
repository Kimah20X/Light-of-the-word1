import { describe, expect, it } from "vitest";
import {
  API_BIBLE_BOOK_IDS,
  isKjvBibleMetadata,
  parseApiBibleChapterHtml,
  validateApiBibleReference,
} from "../backend/api-bible";
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

  it("parses numbered markers nested inside real provider verse-span wrappers", () => {
    const verses = parseApiBibleChapterHtml(
      '<p class="p"><span class="verse-span" data-verse-id="ROM.6.1"><span data-number="1" data-sid="ROM 6:1" class="v">1</span></span>' +
      '<span class="verse-span" data-verse-id="ROM.6.1">What shall we say then? Shall we continue in sin, that grace may abound? </span>' +
      '<span class="verse-span" data-verse-id="ROM.6.2"><span data-number="2" data-sid="ROM 6:2" class="v">2</span></span>' +
      '<span class="verse-span" data-verse-id="ROM.6.2">God forbid. How shall we, that are dead to sin, live any longer therein?</span></p>',
    );
    expect(verses).toEqual([
      { number: 1, text: "What shall we say then? Shall we continue in sin, that grace may abound?" },
      { number: 2, text: "God forbid. How shall we, that are dead to sin, live any longer therein?" },
    ]);
  });

  it("preserves all verse fragments inside additional formatting wrappers", () => {
    const verses = parseApiBibleChapterHtml(
      '<span class="verse-span"><span class="v" data-number="5">5</span></span>' +
      '<span class="verse-span">For if we have been planted together in the likeness of his death, we shall be also </span>' +
      '<span class="add"><span class="verse-span">in the likeness</span></span>' +
      '<span class="verse-span"> of </span><span class="add"><span class="verse-span">his</span></span>' +
      '<span class="verse-span"> resurrection:</span>',
    );
    expect(verses).toEqual([{ number: 5, text: "For if we have been planted together in the likeness of his death, we shall be also in the likeness of his resurrection:" }]);
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
