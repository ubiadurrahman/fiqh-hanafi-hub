import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Languages, Minus, Pause, Play, Plus, SkipBack, SkipForward } from "lucide-react";
import {
  Ayah,
  Surah,
  ayahAudioUrl,
  fetchSurah,
  isValidReciter,
  lastRead,
  reciters,
} from "../lib/quran";
import { ErrorState, Skeleton } from "../components/ui";
import { useToast } from "../context/ToastContext";

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

export default function SurahReader() {
  const { id } = useParams();
  const n = Number(id);
  const toast = useToast();

  const [surah, setSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [showTranslation, setShowTranslation] = useState(true);
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem("fh_qfont")) || 34);
  const [reciter, setReciter] = useState(() => {
    const stored = localStorage.getItem("fh_reciter");
    return stored && isValidReciter(stored) ? stored : reciters[0].id;
  });
  const [speed, setSpeed] = useState(1);

  const [current, setCurrent] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const ayahRefs = useRef<Array<HTMLElement | null>>([]);

  const load = useCallback(() => {
    if (!Number.isInteger(n) || n < 1 || n > 114) {
      setError("Surah not found. Choose a number between 1 and 114.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setCurrent(null);
    setPlaying(false);
    fetchSurah(n)
      .then((r) => {
        setSurah(r.surah);
        setAyahs(r.ayahs);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [n]);

  useEffect(load, [load]);

  // Stop audio when leaving the page.
  useEffect(() => {
    const a = audioRef.current;
    return () => {
      a?.pause();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("fh_qfont", String(fontSize));
    } catch {
      /* ignore */
    }
  }, [fontSize]);

  // Load & play the current ayah whenever it (or the reciter) changes.
  useEffect(() => {
    const a = audioRef.current;
    if (current === null || !a || !ayahs[current]) return;
    a.src = ayahAudioUrl(reciter, ayahs[current].number);
    a.playbackRate = speed;
    a.play().catch(() => {
      setPlaying(false);
    });
    ayahRefs.current[current]?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (surah) lastRead.set({ surah: surah.number, name: surah.englishName, ayah: ayahs[current].numberInSurah });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, reciter, ayahs]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !ayahs.length) return;
    if (current === null) return setCurrent(0);
    if (a.paused) a.play().catch(() => setPlaying(false));
    else a.pause();
  };
  const prev = () => setCurrent((c) => (c === null ? 0 : Math.max(0, c - 1)));
  const next = () => setCurrent((c) => (c === null ? 0 : Math.min(ayahs.length - 1, c + 1)));
  const onEnded = () => {
    if (current !== null && current < ayahs.length - 1) setCurrent(current + 1);
    else {
      setPlaying(false);
      toast("info", "Reached the end of the surah.");
    }
  };

  if (loading) {
    return (
      <div className="container-page max-w-3xl space-y-4 py-10" aria-busy="true">
        <Skeleton className="h-24" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }
  if (error || !surah) {
    return (
      <div className="container-page max-w-3xl py-10">
        <ErrorState message={error || "Could not load this surah."} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="pb-32">
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 to-emerald-950 text-white">
        <div className="pattern-bg absolute inset-0" aria-hidden />
        <div className="container-page relative max-w-3xl py-8 text-center">
          <Link to="/quran" className="mb-4 inline-flex items-center gap-1 text-sm text-emerald-100 hover:text-white">
            <ChevronLeft className="h-4 w-4" aria-hidden /> All surahs
          </Link>
          <h1 className="font-display text-3xl font-bold">
            {surah.number}. {surah.englishName}
          </h1>
          <p className="mt-1 text-emerald-100">
            {surah.englishNameTranslation} · {surah.numberOfAyahs} ayahs · {surah.revelationType}
          </p>
          <p className="arabic mt-3 text-4xl text-gold-300" lang="ar">
            {surah.name}
          </p>
        </div>
      </div>

      <div className="container-page max-w-3xl py-6">
        <div className="card mb-6 flex flex-wrap items-center gap-3 p-3" role="group" aria-label="Reading options">
          <button
            onClick={() => setShowTranslation((v) => !v)}
            aria-pressed={showTranslation}
            className={`btn ${showTranslation ? "btn-primary" : "btn-outline"}`}
          >
            <Languages className="h-4 w-4" aria-hidden /> Translation
          </button>
          <div className="flex items-center gap-1" role="group" aria-label="Text size">
            <button
              className="btn btn-outline !px-3"
              onClick={() => setFontSize((s) => Math.max(24, s - 4))}
              aria-label="Decrease text size"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm tabular-nums">{fontSize}</span>
            <button
              className="btn btn-outline !px-3"
              onClick={() => setFontSize((s) => Math.min(64, s + 4))}
              aria-label="Increase text size"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <label className="flex w-full min-w-0 items-center gap-2 text-sm sm:ml-auto sm:w-auto">
            <span className="shrink-0 text-stone-500 dark:text-stone-400">Reciter</span>
            <select
              className="input min-w-0 flex-1 sm:!w-auto sm:max-w-[16rem]"
              value={reciter}
              onChange={(e) => {
                setReciter(e.target.value);
                try {
                  localStorage.setItem("fh_reciter", e.target.value);
                } catch {
                  /* ignore */
                }
              }}
            >
              {reciters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {n !== 1 && n !== 9 && (
          <p className="arabic mb-6 text-center text-3xl text-emerald-800 dark:text-gold-300" lang="ar">
            {BISMILLAH}
          </p>
        )}

        <ol className="space-y-3">
          {ayahs.map((a, i) => {
            const active = current === i;
            return (
              <motion.li
                key={a.number}
                ref={(el) => {
                  ayahRefs.current[i] = el;
                }}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                className={`card scroll-mt-24 p-4 transition-colors sm:p-5 ${
                  active ? "!border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : ""
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                    {surah.number}:{a.numberInSurah}
                  </span>
                  <button
                    className="btn btn-ghost !min-h-[40px] !px-3 text-sm"
                    onClick={() => (active ? toggle() : setCurrent(i))}
                    aria-label={active && playing ? `Pause ayah ${a.numberInSurah}` : `Play ayah ${a.numberInSurah}`}
                  >
                    {active && playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {active && playing ? "Pause" : "Listen"}
                  </button>
                </div>
                <p className="arabic text-right" style={{ fontSize }} lang="ar">
                  {a.arabic}
                </p>
                {showTranslation && (
                  <p className="mt-3 border-t border-stone-100 pt-3 leading-relaxed text-stone-700 dark:border-white/10 dark:text-stone-300">
                    {a.translation}
                  </p>
                )}
              </motion.li>
            );
          })}
        </ol>

        <nav className="mt-8 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:justify-between" aria-label="Surah navigation">
          {n > 1 ? (
            <Link to={`/quran/${n - 1}`} className="btn btn-outline">
              <ChevronLeft className="h-4 w-4" aria-hidden /> Previous surah
            </Link>
          ) : (
            <span />
          )}
          {n < 114 && (
            <Link to={`/quran/${n + 1}`} className="btn btn-outline">
              Next surah <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </nav>
      </div>

      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
        onError={() => {
          if (current !== null) toast("error", "Audio could not be loaded. Check your connection or try another reciter.");
          setPlaying(false);
        }}
      />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-white/10 dark:bg-neutral-900/95">
        <div className="container-page flex max-w-3xl items-center gap-1 py-3 sm:gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{surah.englishName}</p>
            <p className="truncate text-xs text-stone-500 dark:text-stone-400" aria-live="polite">
              {current === null ? "Press play to listen" : `Ayah ${ayahs[current].numberInSurah} of ${ayahs.length}`}
            </p>
          </div>
          <select
            className="input !w-[4.5rem] !px-2 text-sm"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            aria-label="Playback speed"
          >
            {[0.75, 1, 1.25, 1.5].map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
          <button className="btn btn-ghost !px-3" onClick={prev} aria-label="Previous ayah" disabled={current === null || current === 0}>
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            className="btn btn-primary h-12 w-12 !min-h-0 rounded-full !px-0"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button
            className="btn btn-ghost !px-3"
            onClick={next}
            aria-label="Next ayah"
            disabled={current === null || current >= ayahs.length - 1}
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
