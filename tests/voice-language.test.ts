import { describe, expect, it } from "vitest";
import { chooseRecognitionLocale, getScriptureSpeechLocale, getVoiceHelp, getVoiceLocale, languageChangeAnnouncement, normalizeSpeechTranscript, parseVoiceLanguage } from "../lib/voice-language";

describe("voice language support", () => {
  it("maps all settings languages to BCP-47 speech locales", () => {
    expect(getVoiceLocale("English")).toBe("en-US");
    expect(getVoiceLocale("Hausa")).toBe("ha-NG");
    expect(getVoiceLocale("Yoruba")).toBe("yo-NG");
    expect(getVoiceLocale("Igbo")).toBe("ig-NG");
  });

  it("recognizes supported spoken language names case-insensitively", () => {
    expect(parseVoiceLanguage("hAuSa")).toBe("Hausa");
    expect(parseVoiceLanguage("Yoruba")).toBe("Yoruba");
    expect(parseVoiceLanguage("French")).toBeNull();
  });

  it("prefers the selected locale, accepts regional variants, and falls back to English", () => {
    expect(chooseRecognitionLocale("Hausa", ["en-US", "ha-NG"])).toEqual({ locale: "ha-NG", usedEnglishFallback: false, supportKnown: true });
    expect(chooseRecognitionLocale("Yoruba", ["en-GB", "fr-FR"])).toEqual({ locale: "en-GB", usedEnglishFallback: true, supportKnown: true });
    expect(chooseRecognitionLocale("English", [])).toEqual({ locale: "en-US", usedEnglishFallback: false, supportKnown: false });
  });

  it("tells users when their recognition model is not listed and normalizes recognized diacritics", () => {
    expect(languageChangeAnnouncement("Hausa", true)).toContain("listen in English");
    expect(languageChangeAnnouncement("Hausa", true)).toContain("Bible text remains English KJV");
    expect(languageChangeAnnouncement("Yoruba")).toContain("Yorùbá");
    expect(languageChangeAnnouncement("Hausa")).toContain("An saita umarnin murya zuwa Hausa");
    expect(normalizeSpeechTranscript("Dúró, jọ̀wọ́")).toBe("Duro, jowo");
    expect(getVoiceHelp("Hausa")).toContain("Aya ta gaba");
    expect(getVoiceHelp("Yoruba")).toContain("Iranlọwọ");
    expect(getVoiceHelp("Igbo")).toContain("Amaokwu ozo");
    expect(getScriptureSpeechLocale()).toBe("en-US");
  });
});
