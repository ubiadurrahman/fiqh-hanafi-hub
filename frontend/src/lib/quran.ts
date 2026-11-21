export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number; // global ayah number (used for audio)
  numberInSurah: number;
  arabic: string;
  translation: string;
}

export interface Reciter {
  id: string;
  name: string;
}

/*
 * Verified reciters. Audio is served by cdn.islamic.network.
 * NOTE: "ar.abdurrahmaansudais" (Abdurrahmaan / Abdul-Rahman As-Sudais) was
 * REMOVED because its CDN URL returns HTTP 403 Forbidden (audio will not play).
 * No working "abdurrahman" reciter id was found on this CDN. To add a reciter,
 * first verify its URL: https://cdn.islamic.network/quran/audio/128/<id>/1.mp3
 * returns HTTP 200 audio/mpeg, then add it here.
 */
export const reciters: Reciter[] = [
  { id: "ar.alafasy", name: "Mishary Alafasy" },
  { id: "ar.hudhaify", name: "Hudhaify" },
  { id: "ar.husary", name: "Mahmoud Khalil Al-Husary" },
  { id: "ar.minshawi", name: "Mohamed Siddiq Al-Minshawi" },
];

export const validReciterIds: string[] = reciters.map((r) => r.id);

export function isValidReciter(id: string): boolean {
  return validReciterIds.includes(id);
}

const API = "https://api.alquran.cloud/v1";
export const ayahAudioUrl = (reciter: string, globalNumber: number) => {
  if (!isValidReciter(reciter)) {
    throw new Error(`Unknown reciter id: ${reciter}`);
  }
  if (!Number.isInteger(globalNumber) || globalNumber < 1 || globalNumber > 6236) {
    throw new Error(`Invalid global ayah number: ${globalNumber}`);
  }
  return `https://cdn.islamic.network/quran/audio/128/${reciter}/${globalNumber}.mp3`;
};

export async function fetchSurahs(): Promise<Surah[]> {
  const cached = sessionStorage.getItem("fh_surahs");
  if (cached) {
    try {
      return JSON.parse(cached) as Surah[];
    } catch {
      /* fall through */
    }
  }
  const res = await fetch(`${API}/surah`);
  if (!res.ok) throw new Error("Could not load the list of surahs.");
  const json = await res.json();
  const data = json.data as Surah[];
  try {
    sessionStorage.setItem("fh_surahs", JSON.stringify(data));
  } catch {
    /* ignore */
  }
  return data;
}

interface RawAyah {
  number: number;
  numberInSurah: number;
  text: string;
}

const BISMILLAH_WORDS = 4;

export async function fetchSurah(n: number): Promise<{ surah: Surah; ayahs: Ayah[] }> {
  const res = await fetch(`${API}/surah/${n}/editions/quran-uthmani,en.sahih`);
  if (!res.ok) throw new Error("Could not load this surah.");
  const json = await res.json();
  const [ar, en] = json.data as Array<Surah & { ayahs: RawAyah[] }>;
  const ayahs: Ayah[] = ar.ayahs.map((a, i) => {
    let arabic = a.text;
    // The API prepends the Bismillah to ayah 1; we show it as a separate header instead.
    if (i === 0 && n !== 1 && n !== 9) {
      arabic = arabic.split(" ").slice(BISMILLAH_WORDS).join(" ");
    }
    return { number: a.number, numberInSurah: a.numberInSurah, arabic, translation: en.ayahs[i]?.text ?? "" };
  });
  const { ayahs: _a, ...surah } = ar;
  void _a;
  return { surah, ayahs };
}

export interface LastRead {
  surah: number;
  name: string;
  ayah: number;
}
const LR = "fh_last_read";
export const lastRead = {
  get(): LastRead | null {
    try {
      const raw = localStorage.getItem(LR);
      return raw ? (JSON.parse(raw) as LastRead) : null;
    } catch {
      return null;
    }
  },
  set(v: LastRead) {
    try {
      localStorage.setItem(LR, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  },
};
