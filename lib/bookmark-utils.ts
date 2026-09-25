export type BookmarkReference = { book: string; chapter: number; verse: number };
export type BookmarkRecord = BookmarkReference & { id: string };

export function saveBookmarkIfMissing<T extends BookmarkReference>(
  bookmarks: Array<T & { id: string }>,
  reference: T,
): { bookmarks: Array<T & { id: string }>; added: boolean } {
  const id = `${reference.book}-${reference.chapter}-${reference.verse}`;
  if (bookmarks.some((bookmark) => bookmark.id === id)) return { bookmarks, added: false };
  return { bookmarks: [...bookmarks, { ...reference, id }], added: true };
}

export function bookmarkId(reference: BookmarkReference) {
  return `${reference.book}-${reference.chapter}-${reference.verse}`;
}
