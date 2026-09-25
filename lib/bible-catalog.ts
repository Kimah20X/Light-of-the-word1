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

export function getBook(name: string) {
  return BIBLE_BOOKS.find((book) => book.name.toLowerCase() === name.toLowerCase());
}

export function parseBibleReference(input: string) {
  const normalized = input.trim()
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
