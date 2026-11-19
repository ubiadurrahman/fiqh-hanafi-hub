// Loads hadith one section (book chapter) at a time from the free Hadith API
// (github.com/fawazahmed0/hadith-api) served through the jsDelivr CDN.
const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

export interface HadithEntry {
  number: number;
  text: string;
  arabic?: string;
  grade?: string;
}
export interface SectionInfo {
  id: number;
  name: string;
}
export interface SectionData {
  sections: SectionInfo[];
  hadiths: HadithEntry[];
  hasArabic: boolean;
}

interface Raw {
  metadata?: { section?: Record<string, string> };
  hadiths?: { hadithnumber: number | string; text?: string; grades?: { name?: string; grade?: string }[] }[];
}

async function getJson(url: string): Promise<Raw> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Raw;
}

const cache = new Map<string, Promise<SectionData>>();

export function loadSection(slug: string, section: number): Promise<SectionData> {
  const key = `${slug}:${section}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const p = (async (): Promise<SectionData> => {
    const [en, ar] = await Promise.all([
      getJson(`${CDN}/eng-${slug}/sections/${section}.json`),
      // Arabic is optional: if it fails we still show the English text.
      getJson(`${CDN}/ara-${slug}/sections/${section}.json`).catch(() => null),
    ]);

    const arabic = new Map<number, string>();
    ar?.hadiths?.forEach((h) => {
      if (h.text?.trim()) arabic.set(Number(h.hadithnumber), h.text.trim());
    });

    const sections = Object.entries(en.metadata?.section ?? {})
      .filter(([, name]) => name && name.trim())
      .map(([id, name]) => ({ id: Number(id), name: name.trim() }))
      .sort((a, b) => a.id - b.id);

    const hadiths = (en.hadiths ?? [])
      .filter((h) => h.text && h.text.trim())
      .map((h) => ({
        number: Number(h.hadithnumber),
        text: h.text!.trim(),
        arabic: arabic.get(Number(h.hadithnumber)),
        grade: h.grades?.[0]?.grade || undefined,
      }));

    return { sections, hadiths, hasArabic: arabic.size > 0 };
  })();

  cache.set(key, p);
  p.catch(() => cache.delete(key)); // don't cache failures
  return p;
}
