import AsyncStorage from "@react-native-async-storage/async-storage";

export type CachedBibleVerse = { number: number; text: string };
export type CachedBibleChapter = {
  bibleId: string;
  book: string;
  chapter: number;
  verses: CachedBibleVerse[];
  verseCount: number;
  copyright: string | null;
  fumsToken: string | null;
  fetchedAt: string;
  cachedAt: string;
};

const PREFIX = "light-of-the-word.bible-chapter.v1";
export const BIBLE_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function key(bibleId: string, book: string, chapter: number) {
  return `${PREFIX}:${encodeURIComponent(bibleId)}:${encodeURIComponent(book)}:${chapter}`;
}

export async function readCachedChapter(bibleId: string, book: string, chapter: number): Promise<CachedBibleChapter | null> {
  try {
    const raw = await AsyncStorage.getItem(key(bibleId, book, chapter));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedBibleChapter;
    if (parsed.bibleId !== bibleId || parsed.book !== book || parsed.chapter !== chapter || !Array.isArray(parsed.verses)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeCachedChapter(chapter: Omit<CachedBibleChapter, "cachedAt">): Promise<CachedBibleChapter> {
  const record: CachedBibleChapter = { ...chapter, cachedAt: new Date().toISOString() };
  await AsyncStorage.setItem(key(record.bibleId, record.book, record.chapter), JSON.stringify(record));
  return record;
}

export function isChapterCacheStale(chapter: CachedBibleChapter, now = Date.now()) {
  const timestamp = Date.parse(chapter.fetchedAt);
  return !Number.isFinite(timestamp) || now - timestamp >= BIBLE_CACHE_MAX_AGE_MS;
}

export async function removeCachedChapter(bibleId: string, book: string, chapter: number) {
  await AsyncStorage.removeItem(key(bibleId, book, chapter));
}
