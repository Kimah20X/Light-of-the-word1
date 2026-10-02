export type Testament = "Old Testament" | "New Testament";
export type BibleBook = { name: string; chapters: number; testament: Testament };

export const BIBLE_BOOKS: BibleBook[] = [
  { name: "Genesis", chapters: 50, testament: "Old Testament" }, { name: "Exodus", chapters: 40, testament: "Old Testament" },
  { name: "Leviticus", chapters: 27, testament: "Old Testament" }, { name: "Numbers", chapters: 36, testament: "Old Testament" },
  { name: "Deuteronomy", chapters: 34, testament: "Old Testament" }, { name: "Joshua", chapters: 24, testament: "Old Testament" },
  { name: "Judges", chapters: 21, testament: "Old Testament" }, { name: "Ruth", chapters: 4, testament: "Old Testament" },
  { name: "1 Samuel", chapters: 31, testament: "Old Testament" }, { name: "2 Samuel", chapters: 24, testament: "Old Testament" },
  { name: "1 Kings", chapters: 22, testament: "Old Testament" }, { name: "2 Kings", chapters: 25, testament: "Old Testament" },
  { name: "1 Chronicles", chapters: 29, testament: "Old Testament" }, { name: "2 Chronicles", chapters: 36, testament: "Old Testament" },
  { name: "Ezra", chapters: 10, testament: "Old Testament" }, { name: "Nehemiah", chapters: 13, testament: "Old Testament" },
  { name: "Esther", chapters: 10, testament: "Old Testament" }, { name: "Job", chapters: 42, testament: "Old Testament" },
  { name: "Psalms", chapters: 150, testament: "Old Testament" }, { name: "Proverbs", chapters: 31, testament: "Old Testament" },
  { name: "Ecclesiastes", chapters: 12, testament: "Old Testament" }, { name: "Song of Solomon", chapters: 8, testament: "Old Testament" },
  { name: "Isaiah", chapters: 66, testament: "Old Testament" }, { name: "Jeremiah", chapters: 52, testament: "Old Testament" },
  { name: "Lamentations", chapters: 5, testament: "Old Testament" }, { name: "Ezekiel", chapters: 48, testament: "Old Testament" },
  { name: "Daniel", chapters: 12, testament: "Old Testament" }, { name: "Hosea", chapters: 14, testament: "Old Testament" },
  { name: "Joel", chapters: 3, testament: "Old Testament" }, { name: "Amos", chapters: 9, testament: "Old Testament" },
  { name: "Obadiah", chapters: 1, testament: "Old Testament" }, { name: "Jonah", chapters: 4, testament: "Old Testament" },
  { name: "Micah", chapters: 7, testament: "Old Testament" }, { name: "Nahum", chapters: 3, testament: "Old Testament" },
  { name: "Habakkuk", chapters: 3, testament: "Old Testament" }, { name: "Zephaniah", chapters: 3, testament: "Old Testament" },
  { name: "Haggai", chapters: 2, testament: "Old Testament" }, { name: "Zechariah", chapters: 14, testament: "Old Testament" },
  { name: "Malachi", chapters: 4, testament: "Old Testament" },
  { name: "Matthew", chapters: 28, testament: "New Testament" }, { name: "Mark", chapters: 16, testament: "New Testament" },
  { name: "Luke", chapters: 24, testament: "New Testament" }, { name: "John", chapters: 21, testament: "New Testament" },
  { name: "Acts", chapters: 28, testament: "New Testament" }, { name: "Romans", chapters: 16, testament: "New Testament" },
  { name: "1 Corinthians", chapters: 16, testament: "New Testament" }, { name: "2 Corinthians", chapters: 13, testament: "New Testament" },
  { name: "Galatians", chapters: 6, testament: "New Testament" }, { name: "Ephesians", chapters: 6, testament: "New Testament" },
  { name: "Philippians", chapters: 4, testament: "New Testament" }, { name: "Colossians", chapters: 4, testament: "New Testament" },
  { name: "1 Thessalonians", chapters: 5, testament: "New Testament" }, { name: "2 Thessalonians", chapters: 3, testament: "New Testament" },
  { name: "1 Timothy", chapters: 6, testament: "New Testament" }, { name: "2 Timothy", chapters: 4, testament: "New Testament" },
  { name: "Titus", chapters: 3, testament: "New Testament" }, { name: "Philemon", chapters: 1, testament: "New Testament" },
  { name: "Hebrews", chapters: 13, testament: "New Testament" }, { name: "James", chapters: 5, testament: "New Testament" },
  { name: "1 Peter", chapters: 5, testament: "New Testament" }, { name: "2 Peter", chapters: 3, testament: "New Testament" },
  { name: "1 John", chapters: 5, testament: "New Testament" }, { name: "2 John", chapters: 1, testament: "New Testament" },
  { name: "3 John", chapters: 1, testament: "New Testament" }, { name: "Jude", chapters: 1, testament: "New Testament" },
  { name: "Revelation", chapters: 22, testament: "New Testament" },
];

const BOOKS_BY_LONGEST_NAME = [...BIBLE_BOOKS].sort((a, b) => b.name.length - a.name.length);

export function getBook(name: string) {
  return BIBLE_BOOKS.find((book) => book.name.toLowerCase() === name.toLowerCase());
}

const SMALL_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

function parseNumberWords(phrase: string): number | null {
  const tokens = phrase.toLowerCase().trim().replace(/-/g, " ").split(/\s+/).filter(Boolean);
  if (tokens.at(-1) === "and" || tokens.includes("and") && tokens[1] !== "hundred") return null;
  if (tokens[1] === "hundred") {
    const hundreds = SMALL_NUMBERS[tokens[0]];
    if (hundreds === undefined || hundreds < 1 || hundreds > 9) return null;
    const remainder = tokens.slice(2);
    if (remainder[0] === "and") remainder.shift();
    if (!remainder.length) return hundreds * 100;
    const belowHundred = parseNumberWords(remainder.join(" "));
    return belowHundred !== null && belowHundred < 100 ? hundreds * 100 + belowHundred : null;
  }
  if (tokens.length === 1) return SMALL_NUMBERS[tokens[0]] ?? null;
  if (tokens.length === 2) {
    const tens = SMALL_NUMBERS[tokens[0]];
    const units = SMALL_NUMBERS[tokens[1]];
    return tens !== undefined && tens >= 20 && tens % 10 === 0 && units !== undefined && units >= 1 && units <= 9
      ? tens + units
      : null;
  }
  return null;
}

function asNumber(text: string) {
  const trimmed = text.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return parseNumberWords(trimmed);
}

function normalizeOrdinalBook(input: string) {
  const allowedBooks = "samuel|kings|chronicles|corinthians|thessalonians|timothy|peter|john";
  return input
    .replace(new RegExp(`^(?:first|1st)\\s+(${allowedBooks})\\b`, "i"), "1 $1")
    .replace(new RegExp(`^(?:second|2nd)\\s+(${allowedBooks})\\b`, "i"), "2 $1")
    .replace(/^(?:third|3rd)\s+john\b/i, "3 John");
}

function normalizeSpokenReference(input: string) {
  const ordinalized = normalizeOrdinalBook(input.trim().replace(/,/g, " "))
    .replace(/^psalm(?=\s)/i, "Psalms")
    .replace(/^song of songs(?=\s)/i, "Song of Solomon");
  const book = BOOKS_BY_LONGEST_NAME.find((item) =>
    ordinalized.toLowerCase().startsWith(`${item.name.toLowerCase()} `),
  );
  if (!book) return ordinalized;

  const suffix = ordinalized.slice(book.name.length).trim();
  if (!suffix) return ordinalized;
  if (!/\s/.test(suffix)) {
    const chapter = asNumber(suffix);
    if (chapter !== null && chapter >= 1 && chapter <= book.chapters) return `${book.name} ${chapter}`;
    return ordinalized;
  }

  const marked = suffix.match(/^chapter\s+(.+?)\s+verse\s+(.+)$/i);
  if (marked) {
    const chapter = asNumber(marked[1]);
    const verse = asNumber(marked[2]);
    if (chapter !== null && verse !== null) return `${book.name} ${chapter}:${verse}`;
    return ordinalized;
  }

  const chapterMarker = suffix.match(/^chapter\s+(.+)$/i);
  if (chapterMarker) {
    const chapter = asNumber(chapterMarker[1]);
    if (chapter !== null) return `${book.name} ${chapter}`;
    return ordinalized;
  }

  const tokens = suffix.toLowerCase().replace(/-/g, " ").split(/\s+/).filter(Boolean);
  if (!tokens.length || tokens.some((token) => token.includes(":"))) return ordinalized;
  const wholeNumber = asNumber(tokens.join(" "));
  if (wholeNumber !== null && wholeNumber >= 1 && wholeNumber <= book.chapters) return `${book.name} ${wholeNumber}`;
  if (tokens.length < 2) return ordinalized;
  for (let split = tokens.length - 1; split > 0; split--) {
    const chapter = asNumber(tokens.slice(0, split).join(" "));
    const verse = asNumber(tokens.slice(split).join(" "));
    if (chapter !== null && chapter >= 1 && chapter <= book.chapters && verse !== null && verse >= 1) {
      return `${book.name} ${chapter}:${verse}`;
    }
  }

  return ordinalized;
}

export function parseBibleReference(input: string) {
  const normalized = normalizeSpokenReference(input).trim()
    .replace(/\bchapter\s+/gi, " ")
    .replace(/\bverse\s+/gi, ":")
    .replace(/\bcolon\b/gi, ":")
    .replace(/[.]/g, ":")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s+/g, " ");
  const match = normalized.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
  if (!match) return null;
  const book = BIBLE_BOOKS.find((item) => item.name.toLowerCase() === match[1].trim().toLowerCase());
  if (!book) return null;
  const chapter = Number(match[2]);
  const verse = Number(match[3] ?? 1);
  if (chapter < 1 || chapter > book.chapters || verse < 1) return null;
  return { book: book.name, chapter, verse };
}
