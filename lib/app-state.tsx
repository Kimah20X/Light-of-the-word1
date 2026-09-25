import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { saveBookmarkIfMissing } from "./bookmark-utils";

export type BibleReference = { book: string; chapter: number; verse: number };
export type Bookmark = BibleReference & { id: string };
export type AppPreferences = {
  language: "English" | "Hausa" | "Yoruba" | "Igbo";
  speed: number;
  fontSize: number;
  autoplay: boolean;
  darkMode: boolean;
};

type AppStateValue = {
  reference: BibleReference;
  setReference: (next: BibleReference) => void;
  bookmarks: Bookmark[];
  toggleBookmark: () => void;
  saveCurrentBookmark: () => boolean;
  removeBookmark: (id: string) => void;
  isBookmarked: boolean;
  preferences: AppPreferences;
  updatePreferences: (next: Partial<AppPreferences>) => void;
  hydrated: boolean;
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;
  voiceControllerActive: boolean;
  setVoiceControllerActive: (active: boolean) => void;
};

type PersistedState = {
  reference?: BibleReference;
  bookmarks?: Bookmark[];
  preferences?: Partial<AppPreferences>;
  onboardingComplete?: boolean;
};

const STORAGE_KEY = "light-of-the-word.frontend.v1";
const DEFAULT_REFERENCE: BibleReference = { book: "Romans", chapter: 6, verse: 2 };
const DEFAULT_PREFERENCES: AppPreferences = {
  language: "English",
  speed: 1,
  fontSize: 22,
  autoplay: false,
  darkMode: true,
};

const AppStateContext = createContext<AppStateValue | null>(null);

function referenceId(reference: BibleReference) {
  return `${reference.book}-${reference.chapter}-${reference.verse}`;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [reference, setReferenceState] = useState(DEFAULT_REFERENCE);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);
  const [voiceControllerActive, setVoiceControllerActive] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw || !alive) return;
        const saved = JSON.parse(raw) as PersistedState;
        if (saved.reference?.book && Number.isFinite(saved.reference.chapter) && Number.isFinite(saved.reference.verse)) {
          setReferenceState(saved.reference);
        }
        if (Array.isArray(saved.bookmarks)) setBookmarks(saved.bookmarks);
        if (saved.preferences) setPreferences((current) => ({ ...current, ...saved.preferences }));
        if (typeof saved.onboardingComplete === "boolean") setOnboardingCompleteState(saved.onboardingComplete);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setHydrated(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const value: PersistedState = { reference, bookmarks, preferences, onboardingComplete };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value)).catch(() => undefined);
  }, [reference, bookmarks, preferences, onboardingComplete, hydrated]);

  const setReference = useCallback((next: BibleReference) => setReferenceState(next), []);
  const toggleBookmark = useCallback(() => {
    const id = referenceId(reference);
    setBookmarks((current) => current.some((item) => item.id === id)
      ? current.filter((item) => item.id !== id)
      : [...current, { ...reference, id }]);
  }, [reference]);
  const saveCurrentBookmark = useCallback(() => {
    const result = saveBookmarkIfMissing(bookmarks, reference);
    setBookmarks((current) => saveBookmarkIfMissing(current, reference).bookmarks);
    return result.added;
  }, [bookmarks, reference]);
  const removeBookmark = useCallback((id: string) => {
    setBookmarks((current) => current.filter((item) => item.id !== id));
  }, []);
  const updatePreferences = useCallback((next: Partial<AppPreferences>) => {
    setPreferences((current) => ({ ...current, ...next }));
  }, []);
  const setOnboardingComplete = useCallback((complete: boolean) => {
    setOnboardingCompleteState(complete);
  }, []);
  const setVoiceControllerActiveState = useCallback((active: boolean) => {
    setVoiceControllerActive(active);
  }, []);

  const value = useMemo(() => ({
    reference,
    setReference,
    bookmarks,
    toggleBookmark,
    saveCurrentBookmark,
    removeBookmark,
    isBookmarked: bookmarks.some((item) => item.id === referenceId(reference)),
    preferences,
    updatePreferences,
    hydrated,
    onboardingComplete,
    setOnboardingComplete,
    voiceControllerActive,
    setVoiceControllerActive: setVoiceControllerActiveState,
  }), [reference, setReference, bookmarks, toggleBookmark, saveCurrentBookmark, removeBookmark, preferences, updatePreferences, hydrated, onboardingComplete, setOnboardingComplete, voiceControllerActive, setVoiceControllerActiveState]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used within AppStateProvider");
  return context;
}

export function formatReference(reference: BibleReference) {
  return `${reference.book} ${reference.chapter}:${reference.verse}`;
}

export { DEFAULT_PREFERENCES };
