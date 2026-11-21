import axios from "axios";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { franc } = require("franc");

// In-memory cache to avoid repeated API calls for the same text during a session.
const translationCache = new Map<string, string>();

// Common Roman Urdu words to help detect Latin-script Urdu.
const ROMAN_URDU_WORDS = [
  "hai", "hain", "kya", "nahi", "na", "aap", "tum", "main", "hum",
  "kyun", "kahan", "kab", "kaise", "kitna", "kuch", "jo", "to",
  "par", "lekin", "agar", "toh", "bhi", "abhi", "pehle", "baad",
  "iska", "uska", "mera", "tumhara", "yahaan", "wahan",
];

/**
 * Detects whether the given text is likely Roman Urdu (Latin script but Urdu words).
 */
function isRomanUrdu(text: string): boolean {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  let matchCount = 0;
  for (const word of words) {
    if (ROMAN_URDU_WORDS.includes(word)) {
      matchCount++;
    }
  }
  // If at least 20% of words match common Roman Urdu words, treat as Roman Urdu.
  return words.length > 0 && matchCount / words.length >= 0.2;
}

/**
 * Checks if the text contains Urdu/Arabic script characters.
 */
function containsUrduScript(text: string): boolean {
  const urduRegex = /[\u0600-\u06FF\u0750-\u077F]/;
  return urduRegex.test(text);
}

/**
 * Translates English text to Urdu using the MyMemory API.
 */
async function translateEnglishToUrdu(text: string): Promise<string> {
  try {
    const response = await axios.get(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ur`,
      { timeout: 10000 }
    );
    const translated = response.data?.responseData?.translatedText;
    if (translated && translated !== text) {
      return translated;
    }
    return text;
  } catch (error) {
    console.error("MyMemory translation API failed:", error);
    return text;
  }
}

/**
 * Transliterates Roman Urdu to Urdu script using Google Input Tools API.
 */
async function transliterateRomanUrdu(text: string): Promise<string> {
  try {
    const response = await axios.get(
      `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=ur-t-i0-und&num=1`,
      { timeout: 10000 }
    );
    const data = response.data;
    // Google Input Tools response format: [null, [[[null, ["urdu script"]]]]]
    if (data && data[1] && data[1][0] && data[1][0][0] && data[1][0][0][1] && data[1][0][0][1][0]) {
      return data[1][0][0][1][0];
    }
    return text;
  } catch (error) {
    console.error("Google Input Tools transliteration API failed:", error);
    return text;
  }
}

/**
 * Converts any input text to Urdu script.
 *
 * Logic:
 * 1. If already Urdu/Arabic script -> return as is.
 * 2. If detected as English or foreign non-Urdu -> translate via MyMemory API.
 * 3. If Roman Urdu (Latin script with Urdu words) -> transliterate via Google Input Tools.
 * 4. Fallback -> return original text.
 *
 * Uses an in-memory cache to avoid repeated API calls for the same text.
 */
export async function convertToUrdu(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  const trimmed = text.trim();

  // Return cached result if available.
  if (translationCache.has(trimmed)) {
    return translationCache.get(trimmed)!;
  }

  let result: string;

  // 1. Already Urdu script -> return as is.
  if (containsUrduScript(trimmed)) {
    result = trimmed;
  } else {
    // 2. Detect language using franc.
    const detected = franc(trimmed, { minLength: 3 });

    // franc returns 'eng' for English, 'urd' for Urdu script,
    // 'latn' or similar for Latin script (could be Roman Urdu or other).
    // For short text, franc may return unreliable codes (e.g. 'hau' for 'kya hal hai').
    if (detected === "eng") {
      // Detected as English -> translate via MyMemory.
      result = await translateEnglishToUrdu(trimmed);
    } else if (detected === "und" || detected.startsWith("latn") || isRomanUrdu(trimmed)) {
      // Undetermined, Latin script, or Roman Urdu word patterns -> try transliteration.
      if (isRomanUrdu(trimmed)) {
        result = await transliterateRomanUrdu(trimmed);
      } else {
        result = await translateEnglishToUrdu(trimmed);
      }
    } else {
      // Some other code but Roman Urdu word patterns detected -> transliterate.
      if (isRomanUrdu(trimmed)) {
        result = await transliterateRomanUrdu(trimmed);
      } else {
        // Treat as English and try translation.
        result = await translateEnglishToUrdu(trimmed);
      }
    }
  }

  // Cache the result.
  translationCache.set(trimmed, result);
  return result;
}

/**
 * Clears the translation cache. Useful for testing.
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}