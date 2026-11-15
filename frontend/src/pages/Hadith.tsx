import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader, EmptyState, stagger, rise } from "../components/ui";
import HadithBooks from "../components/HadithBooks";
import { hadith } from "../data/content";

type Tab = "books" | "selected";

export default function Hadith() {
  const [tab, setTab] = useState<Tab>("books");

  return (
    <>
      <PageHeader title="Hadith" subtitle="Read the six major books of Hadith, chapter by chapter, with the Arabic text and references." />
      <div className="container-page max-w-4xl py-8">
        <div role="tablist" aria-label="Hadith sections" className="mb-6 flex flex-wrap gap-2">
          {(
            [
              ["books", "Six Books of Hadith"],
              ["selected", "Selected Hadith"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`btn ${tab === key ? "btn-primary" : "btn-outline"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "books" ? <HadithBooks /> : <Selected />}

        <p className="mt-10 text-center text-xs text-stone-500 dark:text-stone-400">
          Texts and grades come from the Free Hadith API (fawazahmed0/hadith-api). Grades are those given by the source
          edition. Please verify rulings with a qualified scholar.
        </p>
      </div>
    </>
  );
}

function Selected() {
  const topics = useMemo(() => ["All", ...Array.from(new Set(hadith.map((h) => h.topic)))], []);
  const [topic, setTopic] = useState("All");
  const list = hadith.filter((h) => topic === "All" || h.topic === topic);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => setTopic(t)}
            aria-pressed={topic === t}
            className={`btn !min-h-[40px] !px-4 text-sm ${topic === t ? "btn-primary" : "btn-outline"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState title="No hadith in this topic yet" />
      ) : (
        <motion.ul key={topic} variants={stagger} initial="hidden" animate="show" className="space-y-4">
          {list.map((h) => (
            <motion.li key={h.id} variants={rise} className="card p-5 sm:p-6">
              <span className="badge bg-gold-300/40 text-gold-600 dark:bg-gold-400/15 dark:text-gold-300">{h.topic}</span>
              {h.arabic && (
                <p className="arabic mt-3 text-right text-2xl sm:text-3xl" lang="ar">
                  {h.arabic}
                </p>
              )}
              <p className="mt-3 text-lg leading-relaxed">{h.text}</p>
              <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">Source: {h.source}</p>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
