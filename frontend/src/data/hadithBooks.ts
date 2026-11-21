export interface HadithBook {
  slug: string; // matches the API edition name: eng-<slug> / ara-<slug>
  title: string;
  arabic: string;
  author: string;
  lifespan: string;
  description: string;
}

export const hadithBooks: HadithBook[] = [
  {
    slug: "bukhari",
    title: "Sahih al-Bukhari",
    arabic: "صحيح البخاري",
    author: "Imam Muhammad ibn Isma'il al-Bukhari",
    lifespan: "194–256 AH",
    description: "Regarded by scholars as the most authentic collection, compiled under very strict conditions of acceptance.",
  },
  {
    slug: "muslim",
    title: "Sahih Muslim",
    arabic: "صحيح مسلم",
    author: "Imam Muslim ibn al-Hajjaj",
    lifespan: "204–261 AH",
    description: "The second of the two Sahihs, admired for its precise arrangement and careful handling of chains.",
  },
  {
    slug: "abudawud",
    title: "Sunan Abi Dawud",
    arabic: "سنن أبي داود",
    author: "Imam Abu Dawud al-Sijistani",
    lifespan: "202–275 AH",
    description: "Focused on hadith used for legal rulings, widely relied upon by the jurists. Check the grade of each narration.",
  },
  {
    slug: "tirmidhi",
    title: "Jami' at-Tirmidhi",
    arabic: "جامع الترمذي",
    author: "Imam Muhammad ibn 'Isa at-Tirmidhi",
    lifespan: "209–279 AH",
    description: "Notable for commenting on the grade of its narrations and for mentioning the views of the jurists.",
  },
  {
    slug: "nasai",
    title: "Sunan an-Nasa'i",
    arabic: "سنن النسائي",
    author: "Imam Ahmad ibn Shu'ayb an-Nasa'i",
    lifespan: "215–303 AH",
    description: "Noted for its rigorous selection among the Sunan and its attention to narrator criticism.",
  },
  {
    slug: "ibnmajah",
    title: "Sunan Ibn Majah",
    arabic: "سنن ابن ماجه",
    author: "Imam Muhammad ibn Yazid Ibn Majah",
    lifespan: "209–273 AH",
    description: "The sixth of the major books, rich in chapters on fiqh and virtues. Contains some weak narrations, so check the grade.",
  },
  {
    slug: "muwatta",
    title: "Muwatta Imam Malik",
    arabic: "موطأ الإمام مالك",
    author: "Imam Malik ibn Anas",
    lifespan: "93–179 AH",
    description: "One of the earliest hadith collections, forming the foundation of the Maliki school and widely used across schools of fiqh.",
  },
  {
    slug: "musnad-ahmad",
    title: "Musnad Ahmad",
    arabic: "مسند الإمام أحمد",
    author: "Imam Ahmad ibn Hanbal",
    lifespan: "164–241 AH",
    description: "A massive collection of hadith arranged by companion narrator, forming the basis of the Hanbali school.",
  },
  {
    slug: "darimi",
    title: "Sunan al-Darimi",
    arabic: "سنن الدارمي",
    author: "Imam Abdullah ibn Abdul Rahman al-Darimi",
    lifespan: "181–255 AH",
    description: "An early Sunan collection focusing on hadith used in legal rulings and practice.",
  },
  {
    slug: "bayhaqi",
    title: "Sunan al-Kubra al-Bayhaqi",
    arabic: "السنن الكبرى للبيهقي",
    author: "Imam Ahmad al-Bayhaqi",
    lifespan: "384–458 AH",
    description: "A comprehensive hadith collection with chapters on beliefs, practice, and fiqh, including graded narrations.",
  },
];
