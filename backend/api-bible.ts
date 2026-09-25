import { TRPCError } from "@trpc/server";
import { BIBLE_BOOKS } from "../lib/bible-catalog";
import { ENV } from "./_core/env";

export const API_BIBLE_BOOK_IDS: Record<string, string> = {
  Genesis: "GEN", Exodus: "EXO", Leviticus: "LEV", Numbers: "NUM", Deuteronomy: "DEU",
  Joshua: "JOS", Judges: "JDG", Ruth: "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA",
  "1 Kings": "1KI", "2 Kings": "2KI", "1 Chronicles": "1CH", "2 Chronicles": "2CH",
  Ezra: "EZR", Nehemiah: "NEH", Esther: "EST", Job: "JOB", Psalms: "PSA", Proverbs: "PRO",
  Ecclesiastes: "ECC", "Song of Solomon": "SNG", Isaiah: "ISA", Jeremiah: "JER", Lamentations: "LAM",
  Ezekiel: "EZK", Daniel: "DAN", Hosea: "HOS", Joel: "JOL", Amos: "AMO", Obadiah: "OBA",
  Jonah: "JON", Micah: "MIC", Nahum: "NAM", Habakkuk: "HAB", Zephaniah: "ZEP", Haggai: "HAG",
  Zechariah: "ZEC", Malachi: "MAL", Matthew: "MAT", Mark: "MRK", Luke: "LUK", John: "JHN",
  Acts: "ACT", Romans: "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO", Galatians: "GAL",
  Ephesians: "EPH", Philippians: "PHP", Colossians: "COL", "1 Thessalonians": "1TH",
  "2 Thessalonians": "2TH", "1 Timothy": "1TI", "2 Timothy": "2TI", Titus: "TIT", Philemon: "PHM",
  Hebrews: "HEB", James: "JAS", "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN",
  "2 John": "2JN", "3 John": "3JN", Jude: "JUD", Revelation: "REV",
};

export type ApiBibleVerse = { number: number; text: string };
export type ApiBibleChapter = {
  bibleId: string;
  book: string;
  chapter: number;
  verses: ApiBibleVerse[];
  verseCount: number;
  copyright: string | null;
  fumsToken: string | null;
  fetchedAt: string;
};

type ApiBibleResponse = {
  data?: { id?: string; bibleId?: string; content?: string; reference?: string; verseCount?: number; copyright?: string; abbreviation?: string; name?: string; nameLocal?: string; language?: { id?: string; name?: string } };
  meta?: { fumsToken?: string };
  message?: string;
};

type ApiBibleInfo = { abbreviation?: string; name?: string; nameLocal?: string; language?: { id?: string; name?: string } };
let verifiedEdition: { bibleId: string; verifiedAt: number; isKjv: boolean } | null = null;

export function isKjvBibleMetadata(metadata: ApiBibleInfo) {
  const abbreviation = metadata.abbreviation?.trim().toUpperCase() ?? "";
  const names = [metadata.name, metadata.nameLocal].filter(Boolean).join(" ").toLowerCase();
  const language = `${metadata.language?.id ?? ""} ${metadata.language?.name ?? ""}`.toLowerCase();
  const english = !language || /eng|english/.test(language);
  return english && (abbreviation === "KJV" || /king james|authorized version|authorised version/.test(names));
}

async function ensureKjvEdition(apiKey: string, bibleId: string) {
  if (verifiedEdition?.bibleId === bibleId && Date.now() - verifiedEdition.verifiedAt < 30 * 24 * 60 * 60 * 1000) {
    if (!verifiedEdition.isKjv) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The configured API.Bible edition is not identified as an English KJV." });
    return;
  }
  let response: Response;
  try {
    response = await fetch(`https://rest.api.bible/v1/bibles/${encodeURIComponent(bibleId)}`, {
      headers: { "api-key": apiKey, accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The Bible service could not verify the configured edition." });
  }
  if (!response.ok) {
    const code = response.status === 401 || response.status === 403 ? "PRECONDITION_FAILED" : "SERVICE_UNAVAILABLE";
    throw new TRPCError({ code, message: "The configured API.Bible edition is unavailable to this key. Check the Bible ID and translation license." });
  }
  const payload = await response.json() as { data?: ApiBibleInfo };
  const isKjv = Boolean(payload.data && isKjvBibleMetadata(payload.data));
  verifiedEdition = { bibleId, verifiedAt: Date.now(), isKjv };
  if (!isKjv) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The configured API.Bible edition is not identified as an English KJV." });
}

function decodeHtml(text: string) {
  return text
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function stripMarkup(html: string) {
  return decodeHtml(
    html
      .replace(/<(script|style|note|reference)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/[\t\r\n ]+/g, " ").trim();
}

/** Extract API.Bible's documented <span data-number="16" class="v"> verse boundaries. */
export function parseApiBibleChapterHtml(html: string): ApiBibleVerse[] {
  const spans: Array<{ number: number; start: number; end: number }> = [];
  // Match opening tags independently: an outer verse-span may wrap a numbered
  // marker. Matching complete spans consumes that marker with the outer span.
  const spanPattern = /<span\b([^>]*)>/gi;
  for (const match of html.matchAll(spanPattern)) {
    const attrs = match[1] ?? "";
    const classMatch = attrs.match(/\bclass\s*=\s*(["'])(.*?)\1/i);
    const numberMatch = attrs.match(/\bdata-number\s*=\s*(["'])(\d+)\1/i);
    if (!classMatch || !numberMatch || !classMatch[2].split(/\s+/).includes("v")) continue;
    const index = match.index ?? 0;
    const closingPattern = /<\/span\s*>/gi;
    closingPattern.lastIndex = index + match[0].length;
    const closing = closingPattern.exec(html);
    if (!closing) continue;
    spans.push({ number: Number(numberMatch[2]), start: index, end: closing.index + closing[0].length });
  }

  return spans.map((span, index) => {
    const end = spans[index + 1]?.start ?? html.length;
    let fragment = html.slice(span.end, end);
    // Keep verse wording, not paragraph/section headings that occur between verse markers.
    fragment = fragment.replace(/<p\b[^>]*class\s*=\s*["'][^"']*\b(?:s|s\d+|d|mt|mt\d+|ms|ms\d+|mr|qa|cl)\b[^"']*["'][^>]*>[\s\S]*?<\/p\s*>/gi, " ");
    const text = stripMarkup(fragment);
    return { number: span.number, text };
  }).filter((verse) => verse.text.length > 0);
}

export function isApiBibleConfigured() {
  return Boolean(ENV.apiBibleKey.trim() && ENV.apiBibleBibleId.trim());
}

export async function fetchApiBibleChapter(book: string, chapter: number): Promise<ApiBibleChapter> {
  const bookId = API_BIBLE_BOOK_IDS[book];
  if (!bookId || !Number.isInteger(chapter) || chapter < 1 || chapter > 150) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a valid Bible book and chapter." });
  }

  const apiKey = ENV.apiBibleKey.trim();
  const bibleId = ENV.apiBibleBibleId.trim();
  if (!apiKey || !bibleId) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Bible provider setup is incomplete. Add APIBIBLE_API_KEY and APIBIBLE_BIBLE_ID in project secrets." });
  }

  await ensureKjvEdition(apiKey, bibleId);

  const url = new URL(`https://rest.api.bible/v1/bibles/${encodeURIComponent(bibleId)}/chapters/${encodeURIComponent(`${bookId}.${chapter}`)}`);
  url.searchParams.set("content-type", "html");
  url.searchParams.set("include-verse-spans", "true");
  url.searchParams.set("include-verse-numbers", "true");
  url.searchParams.set("fums-version", "3");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "api-key": apiKey, accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Bible service could not be reached. Cached chapters remain available offline." });
  }

  if (!response.ok) {
    const code = response.status === 429 ? "TOO_MANY_REQUESTS" : response.status === 401 || response.status === 403 ? "PRECONDITION_FAILED" : "SERVICE_UNAVAILABLE";
    const message = response.status === 401 || response.status === 403
      ? "API.Bible rejected this key or Bible translation. Check the server configuration and account license."
      : response.status === 429
        ? "The Bible provider's request limit was reached. Try again later or check your account quota."
        : `Bible service returned status ${response.status}.`;
    throw new TRPCError({ code, message });
  }

  const payload = await response.json() as ApiBibleResponse;
  const content = payload.data?.content;
  if (typeof content !== "string") {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Bible service returned an unsupported chapter format." });
  }
  const verses = parseApiBibleChapterHtml(content);
  if (!verses.length) {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Bible service returned no parseable verses for this chapter." });
  }

  return {
    bibleId,
    book,
    chapter,
    verses,
    verseCount: payload.data?.verseCount ?? verses.length,
    copyright: payload.data?.copyright ?? null,
    fumsToken: payload.meta?.fumsToken ?? null,
    fetchedAt: new Date().toISOString(),
  };
}

export function extractApiBibleText(html: string) {
  return stripMarkup(html);
}

export function maxChapterForBook(book: string) {
  return BIBLE_BOOKS.find((entry) => entry.name === book)?.chapters ?? 0;
}

export function validateApiBibleReference(book: string, chapter: number) {
  return Boolean(API_BIBLE_BOOK_IDS[book] && Number.isInteger(chapter) && chapter >= 1 && chapter <= maxChapterForBook(book));
}
