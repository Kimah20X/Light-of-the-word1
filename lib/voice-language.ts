export const VOICE_LANGUAGES = ["English", "Hausa", "Yoruba", "Igbo"] as const;
export type VoiceLanguage = (typeof VOICE_LANGUAGES)[number];

const LOCALES: Record<VoiceLanguage, string> = {
  English: "en-US",
  Hausa: "ha-NG",
  Yoruba: "yo-NG",
  Igbo: "ig-NG",
};

export function getVoiceLocale(language: VoiceLanguage) {
  return LOCALES[language];
}

export function parseVoiceLanguage(input: string): VoiceLanguage | null {
  const normalized = input.trim().toLowerCase();
  return VOICE_LANGUAGES.find((language) => language.toLowerCase() === normalized) ?? null;
}

function localeMatches(locale: string, requested: string) {
  const normalizedLocale = locale.toLowerCase().replace(/_/g, "-");
  const normalizedRequested = requested.toLowerCase().replace(/_/g, "-");
  return normalizedLocale === normalizedRequested || normalizedLocale.startsWith(`${normalizedRequested.split("-")[0]}-`);
}

export function chooseRecognitionLocale(language: VoiceLanguage, supportedLocales: string[]) {
  const requested = getVoiceLocale(language);
  if (!supportedLocales.length) return { locale: requested, usedEnglishFallback: false, supportKnown: false };
  const regional = supportedLocales.find((locale) => locale.toLowerCase().replace(/_/g, "-") === requested.toLowerCase())
    ?? supportedLocales.find((locale) => localeMatches(locale, requested));
  if (regional) return { locale: regional, usedEnglishFallback: false, supportKnown: true };
  if (language !== "English") {
    const english = supportedLocales.find((locale) => localeMatches(locale, "en-US"));
    if (english) return { locale: english, usedEnglishFallback: true, supportKnown: true };
  }
  return { locale: requested, usedEnglishFallback: false, supportKnown: true };
}

export function languageChangeAnnouncement(language: VoiceLanguage, recognitionInEnglish = false) {
  if (recognitionInEnglish && language !== "English") {
    return `Voice commands are set to ${language}, but this device did not list that speech model. I will listen in English. The Bible text remains English KJV.`;
  }
  const messages: Record<VoiceLanguage, string> = {
    English: "Voice commands are set to English. The Bible text is English KJV.",
    Hausa: "An saita umarnin murya zuwa Hausa. Littafi Mai Tsarki yana nan da Turanci KJV.",
    Yoruba: "A ti ṣètò àṣẹ ohùn sí Yorùbá. Ọ̀rọ̀ Bíbélì ṣì wà ní Gẹ̀ẹ́sì KJV.",
    Igbo: "Edobela iwu olu n'asusu Igbo. Ihe odide Baibul ka bu English KJV.",
  };
  return messages[language];
}

export function getVoiceHelp(language: VoiceLanguage) {
  const help: Record<VoiceLanguage, string> = {
    English: "You can say: Open Bible. Open John chapter 3 verse 16. Next verse or previous verse. Next chapter or previous chapter. Read continuously, then say Stop. Repeat this verse. Save this verse. Where am I? Open bookmarks, settings, or profile. Faster or slower. Change language to Hausa, Yoruba, Igbo, or English. Say Help to hear this again.",
    Hausa: "Ka ce: bude Bible. Karanta. Aya ta gaba. Babi na gaba. Tsaya don dakatar da karatu. Maimaita ayar. Ajiye wannan aya. Taimako. Canza harshe zuwa Turanci, Hausa, Yoruba, ko Igbo.",
    Yoruba: "Sọ pé: ṣi Bibeli. Ka. Ẹsẹ ti o tẹle. Ori ti o tẹle. Dúró láti dá kíkà dúró. Tun ẹsẹ yii ka. Fi ẹsẹ yii pamọ. Iranlọwọ. Yi ede pada si English, Hausa, Yoruba, tabi Igbo.",
    Igbo: "Kwuo: mepee Bible. Guo. Amaokwu ozo. Isiakwukwo ozo. Kwusi iji kwusi igu. Guo amaokwu a ozo. Chekwaa amaokwu a. Enyemaka. Gbanwee asusu gaa na English, Hausa, Yoruba, ma obu Igbo.",
  };
  return help[language];
}

/** The configured KJV content is English; do not select a non-English TTS locale to read it. */
export function getScriptureSpeechLocale() {
  return "en-US";
}

export function normalizeSpeechTranscript(input: string) {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
}
