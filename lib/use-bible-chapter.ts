import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { isChapterCacheStale, readCachedChapter, writeCachedChapter, type CachedBibleChapter } from "@/lib/bible-cache";
import { useAppState } from "@/lib/app-state";

const LAST_BIBLE_ID_KEY = "light-of-the-word.bible-last-id.v1";

export function useBibleChapter() {
  const { reference } = useAppState();
  const status = trpc.bible.status.useQuery(undefined, { retry: false, staleTime: 60_000 });
  const [lastBibleId, setLastBibleId] = useState<string | null>(null);
  const [cached, setCached] = useState<CachedBibleChapter | null>(null);
  const [cacheReady, setCacheReady] = useState(false);
  useEffect(() => {
    let active = true;
    import("@react-native-async-storage/async-storage").then(({ default: AsyncStorage }) =>
      AsyncStorage.getItem(LAST_BIBLE_ID_KEY).then((id) => {
        if (active) setLastBibleId(id);
      }),
    ).catch(() => undefined).finally(() => {
      if (active) setCacheReady(true);
    });
    return () => { active = false; };
  }, []);

  const bibleId = status.data?.bibleId ?? lastBibleId;

  useEffect(() => {
    if (!status.data?.bibleId) return;
    setLastBibleId(status.data.bibleId);
    import("@react-native-async-storage/async-storage").then(({ default: AsyncStorage }) =>
      AsyncStorage.setItem(LAST_BIBLE_ID_KEY, status.data!.bibleId!),
    ).catch(() => undefined);
  }, [status.data?.bibleId]);

  useEffect(() => {
    let active = true;
    setCached(null);
    if (!bibleId) {
      setCacheReady(true);
      return () => { active = false; };
    }
    setCacheReady(false);
    readCachedChapter(bibleId, reference.book, reference.chapter).then((value) => {
      if (!active) return;
      setCached(value);
      setCacheReady(true);
    });
    return () => { active = false; };
  }, [bibleId, reference.book, reference.chapter]);

  const needsFetch = Boolean(
    status.data?.configured && cacheReady && (!cached || isChapterCacheStale(cached)),
  );
  const chapterQuery = trpc.bible.chapter.useQuery(
    { book: reference.book, chapter: reference.chapter },
    {
      enabled: needsFetch,
      retry: false,
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
  );

  useEffect(() => {
    const incoming = chapterQuery.data;
    if (!incoming) return;
    writeCachedChapter(incoming).then((record) => setCached(record)).catch(() => undefined);
  }, [chapterQuery.data]);

  const cacheStale = Boolean(cached && isChapterCacheStale(cached));
  const freshCachedChapter = cached && !cacheStale ? cached : null;
  const queryMatchesReference = chapterQuery.data?.book === reference.book && chapterQuery.data.chapter === reference.chapter;
  const cacheMatchesReference = freshCachedChapter?.book === reference.book && freshCachedChapter.chapter === reference.chapter;
  const chapter = (queryMatchesReference ? chapterQuery.data : null) ?? (cacheMatchesReference ? freshCachedChapter : null);
  const verse = useMemo(
    () => chapter?.verses.find((item) => item.number === reference.verse) ?? null,
    [chapter?.verses, reference.verse],
  );

  return {
    verseText: verse?.text ?? "",
    chapter,
    providerConfigured: status.data?.configured ?? false,
    providerReady: status.isSuccess,
    providerError: status.error,
    isLoading: !cacheReady || chapterQuery.isFetching,
    isOfflineCached: Boolean(cacheMatchesReference),
    isCacheStale: cacheStale,
    hasProviderIdentity: Boolean(bibleId),
    fumsToken: chapter?.fumsToken ?? null,
    verseCount: chapter?.verseCount ?? 0,
    fetchError: chapterQuery.error,
    refresh: chapterQuery.refetch,
  };
}
