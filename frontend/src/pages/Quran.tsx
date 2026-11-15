import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpenCheck, Search } from "lucide-react";
import { PageHeader, Skeleton, ErrorState, EmptyState, stagger, rise } from "../components/ui";
import { fetchSurahs, lastRead, Surah } from "../lib/quran";

export default function Quran() {
  const [surahs, setSurahs] = useState<Surah[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const last = useMemo(() => lastRead.get(), []);

  const load = useCallback(() => {
    setError("");
    fetchSurahs()
      .then(setSurahs)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const filtered = useMemo(() => {
    if (!surahs) return [];
    const s = q.trim().toLowerCase();
    if (!s) return surahs;
    return surahs.filter(
      (x) =>
        String(x.number) === s ||
        x.englishName.toLowerCase().includes(s) ||
        x.englishNameTranslation.toLowerCase().includes(s) ||
        x.name.includes(q.trim()),
    );
  }, [surahs, q]);

  return (
    <>
      <PageHeader title="The Holy Quran" subtitle="Read the Arabic text with translation, and listen verse by verse.">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" aria-hidden />
          <input
            className="input !pl-12"
            type="search"
            placeholder="Search by name or number…"
            aria-label="Search surahs"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </PageHeader>

      <div className="container-page py-8">
        {last && (
          <Link
            to={`/quran/${last.surah}`}
            className="card card-hover mb-6 flex items-center gap-4 p-4"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              <BookOpenCheck className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm text-stone-500 dark:text-stone-400">Continue where you left off</span>
              <span className="font-semibold">
                {last.name} · Ayah {last.ayah}
              </span>
            </span>
          </Link>
        )}

        {error && <ErrorState message={error} onRetry={load} />}
        {!error && !surahs && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        )}
        {surahs && filtered.length === 0 && <EmptyState title="No surah matches your search" text="Try a different name or number." />}
        {surahs && filtered.length > 0 && (
          <motion.ul
            key={q}
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((s) => (
              <motion.li key={s.number} variants={rise}>
                <Link to={`/quran/${s.number}`} className="card card-hover flex items-center gap-4 p-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-700 text-sm font-semibold text-white">
                    {s.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{s.englishName}</span>
                    <span className="block truncate text-sm text-stone-500 dark:text-stone-400">
                      {s.englishNameTranslation} · {s.numberOfAyahs} ayahs · {s.revelationType}
                    </span>
                  </span>
                  <span className="arabic !leading-normal text-2xl text-emerald-800 dark:text-gold-300" lang="ar">
                    {s.name.replace("سورة", "").trim()}
                  </span>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </>
  );
}
