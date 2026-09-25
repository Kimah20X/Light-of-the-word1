import { formatReference, type BibleReference } from "./app-state";

const PREVIEW_VERSES: Record<string, string> = {
  "Romans 6:2": "God forbid. How shall we, that are dead to sin, live any longer therein?",
  "John 3:16": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  "Psalms 23:1": "The LORD is my shepherd; I shall not want.",
};

export function getPreviewVerseText(reference: BibleReference) {
  return PREVIEW_VERSES[formatReference(reference)] ?? "";
}
