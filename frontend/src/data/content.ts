export interface HadithItem {
  id: number;
  arabic?: string;
  text: string;
  source: string;
  topic: string;
}

// Sample learning content. Have an approved scholar verify wording and references
// before public deployment.
export const hadith: HadithItem[] = [
  {
    id: 1,
    arabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ",
    text: "Actions are judged by intentions, and every person will have what they intended.",
    source: "Sahih al-Bukhari 1; Sahih Muslim 1907",
    topic: "Intention",
  },
  {
    id: 2,
    arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    text: "The best among you are those who learn the Quran and teach it.",
    source: "Sahih al-Bukhari 5027",
    topic: "Quran",
  },
  {
    id: 3,
    arabic: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    text: "None of you truly believes until he loves for his brother what he loves for himself.",
    source: "Sahih al-Bukhari 13; Sahih Muslim 45",
    topic: "Character",
  },
  {
    id: 4,
    text: "Whoever treads a path seeking knowledge, Allah will make easy for him a path to Paradise.",
    source: "Sahih Muslim 2699",
    topic: "Knowledge",
  },
  {
    id: 5,
    text: "The strong person is not the one who overcomes others by strength, but the one who controls himself in anger.",
    source: "Sahih al-Bukhari 6114; Sahih Muslim 2609",
    topic: "Character",
  },
  {
    id: 6,
    text: "Purification is half of faith.",
    source: "Sahih Muslim 223",
    topic: "Purification",
  },
];

export const knowledge = [
  {
    id: "five-pillars",
    title: "The Five Pillars of Islam",
    summary: "The foundation of a Muslim's practice.",
    body: "The testimony of faith (shahada), establishing the five daily prayers (salah), giving zakah, fasting in Ramadan (sawm), and performing Hajj for those who are able.",
  },
  {
    id: "sources",
    title: "Sources of Hanafi Fiqh",
    summary: "How rulings are derived in the Hanafi school.",
    body: "The Hanafi school derives rulings from the Quran, the Sunnah, the consensus (ijma) of the jurists and analogical reasoning (qiyas). It also uses juristic preference (istihsan) and well-established custom (urf) where they do not contradict the primary texts.",
  },
  {
    id: "abu-hanifa",
    title: "Imam Abu Hanifa (rahimahullah)",
    summary: "The founder of the Hanafi school.",
    body: "Imam Abu Hanifa, al-Nu'man ibn Thabit (80–150 AH / c. 699–767 CE), was born in Kufa. His methodology was carried forward and documented by his students, notably Imam Abu Yusuf and Imam Muhammad al-Shaybani.",
  },
  {
    id: "fard-wajib",
    title: "Fard and Wajib in the Hanafi school",
    summary: "A distinction particular to Hanafi terminology.",
    body: "The Hanafi school distinguishes fard, established by definitive evidence, from wajib, established by evidence that is probable in transmission. Leaving a fard invalidates the act, while leaving a wajib makes it deficient and requires making up for it (for example, sujud al-sahw in prayer).",
  },
  {
    id: "seeking-knowledge",
    title: "Etiquettes of Seeking Knowledge",
    summary: "Character that accompanies learning.",
    body: "Sincerity of intention, humility before teachers, putting knowledge into practice, patience and consulting qualified scholars rather than relying on unverified sources are the foundations of seeking knowledge.",
  },
];

export const articles = [
  {
    id: "a1",
    title: "Why Verified Scholars Matter Online",
    author: "Editorial Team",
    date: "2026-10-01",
    minutes: 4,
    excerpt:
      "Anyone can publish religious content online. Learn how to check a source's credentials and why platform-level verification protects learners.",
  },
  {
    id: "a2",
    title: "Building a Daily Quran Habit",
    author: "Editorial Team",
    date: "2026-10-08",
    minutes: 5,
    excerpt:
      "A small, consistent portion every day beats occasional long sessions. Practical ways to read, listen and reflect without burning out.",
  },
  {
    id: "a3",
    title: "Understanding Madhhab and Taqlid",
    author: "Editorial Team",
    date: "2026-10-15",
    minutes: 6,
    excerpt:
      "What a school of jurisprudence is, why most Muslims follow one, and how it relates to the Quran and Sunnah.",
  },
];

export const fatwas = [
  {
    id: "f1",
    category: "Purification",
    question: "What are the obligatory acts (fara'id) of wudu in the Hanafi school?",
    answer:
      "Four acts: washing the face, washing the arms including the elbows, wiping a quarter of the head, and washing the feet including the ankles. The remaining acts such as rinsing the mouth and nose are sunnah.",
  },
  {
    id: "f2",
    category: "Prayer",
    question: "What is the status of Witr prayer in the Hanafi school?",
    answer:
      "Witr is wajib according to the Hanafi school. It consists of three rak'ahs prayed after Isha, with the du'a of Qunut in the third rak'ah before ruku.",
  },
  {
    id: "f3",
    category: "Zakah",
    question: "What is the nisab for zakah according to the Hanafi school?",
    answer:
      "Zakah is due at 2.5% on wealth that reaches the nisab and is held for a lunar year. The nisab is 87.48 grams of gold or 612.36 grams of silver, or their equivalent value. Consult a scholar for your exact situation.",
  },
];

export const qna = [
  {
    id: "q1",
    category: "Prayer",
    question: "How many rak'ahs are in each of the five daily prayers?",
    answer: "Fajr 2 fard, Dhuhr 4, Asr 4, Maghrib 3 and Isha 4, in addition to the sunnah and witr prayers.",
  },
  {
    id: "q2",
    category: "Fasting",
    question: "What breaks the fast?",
    answer:
      "Knowingly eating, drinking or marital relations during fasting hours break it. Eating or drinking by genuine forgetfulness does not. For details and expiation, ask a qualified scholar.",
  },
  {
    id: "q3",
    category: "General",
    question: "Can I rely on search results for religious rulings?",
    answer:
      "Prefer content attributed to a named, qualified scholar. On this platform, only administrator-approved scholars appear in the public directory.",
  },
];
