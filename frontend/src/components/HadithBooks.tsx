import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Copy, Languages, Loader2, Search } from "lucide-react";
import { EmptyState, ErrorState, Skeleton, rise, stagger } from "./ui";
import { useToast } from "../context/ToastContext";
import { hadithBooks, HadithBook } from "../data/hadithBooks";
import { loadSection, SectionData, SectionInfo } from "../lib/hadithApi";

const PAGE = 20;

function gradeClass(g: string) {
  const s = g.toLowerCase();
  if (s.includes("sahih")) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300";
  if (s.includes("hasan")) return "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300";
  return "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300";
}

export default function HadithBooks() {
  const [book, setBook] = useState<HadithBook | null>(null);

  return (
    <AnimatePresence mode="wait">
      {book ? (
        <motion.div key={book.slug} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
          <Reader book={book} onBack={() => setBook(null)} />
        </motion.div>
      ) : (
        <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.ul variants={stagger} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hadithBooks.map((b, i) => (
              <motion.li key={b.slug} variants={rise}>
                <button onClick={() => setBook(b)} className="card card-hover flex h-full w-full flex-col p-5 text-left">
                  <span className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-700 text-sm font-semibold text-white">
                      {i + 1}
                    </span>
                    <span className="arabic !leading-normal text-2xl text-emerald-800 dark:text-gold-300" lang="ar">
                      {b.arabic}
                    </span>
                  </span>
                  <span className="mt-4 text-lg font-semibold">{b.title}</span>
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                    {b.author} · {b.lifespan}
                  </span>
                  <span className="mt-3 flex-1 text-sm text-stone-600 dark:text-stone-400">{b.description}</span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Read <ChevronRight className="h-4 w-4" aria-hidden />
                  </span>
                </button>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Reader({ book, onBack }: { book: HadithBook; onBack: () => void }) {
  const toast = useToast();
  const [sectionId, setSectionId] = useState(1);
  const [sections, setSections] = useState<SectionInfo[]>([]);
  const [data, setData] = useState<SectionData | null>(null);
  const [error, setError] = useState("");
  const [showArabic, setShowArabic] = useState(true);
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(PAGE);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let off = false;
    setData(null);
    setError("");
    setVisible(PAGE);
    setQ("");
    loadSection(book.slug, sectionId)
      .then((d) => {
        if (off) return;
        setData(d);
        if (d.sections.length) setSections(d.sections);
      })
      .catch(() => !off && setError("Could not load this chapter. Check your internet connection and try again."));
    return () => {
      off = true;
    };
  }, [book.slug, sectionId, reloadKey]);

  const idx = sections.findIndex((s) => s.id === sectionId);
  const prev = idx > 0 ? sections[idx - 1] : undefined;
  const next = idx >= 0 && idx < sections.length - 1 ? sections[idx + 1] : undefined;
  const go = (id: number) => {
    setSectionId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    if (!s) return data.hadiths;
    return data.hadiths.filter((h) => String(h.number) === s || h.text.toLowerCase().includes(s));
  }, [data, q]);

  const copy = async (n: number, text: string) => {
    try {
      await navigator.clipboard.writeText(`${text}\n— ${book.title} ${n}`);
      toast("success", `Copied with reference: ${book.title} ${n}`);
    } catch {
      toast("error", "Could not copy. Select the text and copy it manually.");
    }
  };

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline dark:text-emerald-400">
        <ChevronLeft className="h-4 w-4" aria-hidden /> All six books
      </button>

      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">{book.title}</h2>
        <span className="arabic !leading-normal text-2xl text-emerald-800 dark:text-gold-300" lang="ar">
          {book.arabic}
        </span>
      </div>

      <div className="card mb-5 space-y-3 p-3">
        <label className="block">
          <span className="label">Chapter</span>
          <select className="input" value={sectionId} onChange={(e) => go(Number(e.target.value))} disabled={!sections.length}>
            {sections.length === 0 && <option value={sectionId}>Loading chapters…</option>}
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}. {s.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
            <input
              type="search"
              className="input !pl-11"
              placeholder="Search in this chapter or enter a number…"
              aria-label="Search in this chapter"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setVisible(PAGE);
              }}
            />
          </div>
          <button
            className={`btn ${showArabic ? "btn-primary" : "btn-outline"}`}
            onClick={() => setShowArabic((v) => !v)}
            aria-pressed={showArabic}
          >
            <Languages className="h-4 w-4" aria-hidden /> Arabic
          </button>
        </div>
      </div>

      <div aria-live="polite" className="space-y-4">
        {error && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}
        {!error && !data && (
          <div aria-busy="true" className="space-y-4">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        )}
        {data && filtered.length === 0 && <EmptyState title={q ? "No hadith match your search" : "No hadith in this chapter"} />}
        {filtered.slice(0, visible).map((h) => (
          <article key={h.number} className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="badge bg-gold-300/40 text-gold-600 dark:bg-gold-400/15 dark:text-gold-300">
                {book.title} {h.number}
              </span>
              <span className="flex items-center gap-2">
                {h.grade && <span className={`badge ${gradeClass(h.grade)}`}>{h.grade}</span>}
                <button
                  className="btn btn-ghost !min-h-[40px] !px-3"
                  onClick={() => copy(h.number, h.text)}
                  aria-label={`Copy hadith ${h.number} with reference`}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </span>
            </div>
            {showArabic && h.arabic && (
              <p className="arabic mt-3 text-right text-2xl sm:text-3xl" lang="ar">
                {h.arabic}
              </p>
            )}
            <p className="mt-3 whitespace-pre-line leading-relaxed">{h.text}</p>
          </article>
        ))}
        {filtered.length > visible && (
          <div className="text-center">
            <button className="btn btn-outline" onClick={() => setVisible((v) => v + PAGE)}>
              Show more ({filtered.length - visible} remaining)
            </button>
          </div>
        )}
        {data && !q && data.hadiths.length > 0 && !data.hasArabic && showArabic && (
          <p className="text-center text-xs text-stone-500 dark:text-stone-400">Arabic text is unavailable for this chapter.</p>
        )}
      </div>

      {sections.length > 0 && (
        <nav className="mt-8 flex justify-between gap-3" aria-label="Chapter navigation">
          {prev ? (
            <button className="btn btn-outline" onClick={() => go(prev.id)}>
              <ChevronLeft className="h-4 w-4" aria-hidden /> Previous chapter
            </button>
          ) : (
            <span />
          )}
          {next && (
            <button className="btn btn-outline" onClick={() => go(next.id)}>
              Next chapter <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          )}
        </nav>
      )}
      {!data && !error && (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-stone-500 dark:text-stone-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading chapter…
        </p>
      )}
    </div>
  );
}
