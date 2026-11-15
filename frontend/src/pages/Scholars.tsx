import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, MapPin, Search } from "lucide-react";
import { PageHeader, Skeleton, ErrorState, EmptyState, stagger, rise } from "../components/ui";
import { api, ApiError, Scholar } from "../lib/api";

export default function Scholars() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [scholars, setScholars] = useState<Scholar[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(() => {
    setError("");
    setScholars(null);
    api
      .get<{ scholars: Scholar[] }>(`/scholars${debounced ? `?q=${encodeURIComponent(debounced)}` : ""}`)
      .then((r) => setScholars(r.scholars))
      .catch((e: ApiError) => setError(e.message));
  }, [debounced]);
  useEffect(load, [load]);

  return (
    <>
      <PageHeader title="Verified Scholars" subtitle="Every scholar listed here was reviewed and approved by an administrator.">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" aria-hidden />
          <input
            className="input !pl-12"
            type="search"
            placeholder="Search name, specialization, city…"
            aria-label="Search scholars"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </PageHeader>
      <div className="container-page py-8">
        {error && <ErrorState message={error} onRetry={load} />}
        {!error && !scholars && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        )}
        {scholars && scholars.length === 0 && (
          <EmptyState
            title={debounced ? "No scholars match your search" : "No scholars have been approved yet"}
            text={debounced ? "Try different keywords." : "Check back soon."}
          />
        )}
        {scholars && scholars.length > 0 && (
          <motion.ul variants={stagger} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scholars.map((s) => (
              <motion.li key={s.id} variants={rise}>
                <Link to={`/scholars/${s.id}`} className="card card-hover block h-full p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-700 font-display text-lg font-bold text-white">
                      {s.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h2 className="flex items-center gap-1.5 font-semibold">
                        <span className="truncate">{s.name}</span>
                        <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Verified" />
                      </h2>
                      <p className="truncate text-sm text-stone-500 dark:text-stone-400">{s.specialization}</p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">{s.bio}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                    <MapPin className="h-3.5 w-3.5" aria-hidden /> {s.city ?? s.institution} · {s.experienceYears} yrs
                  </p>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </>
  );
}
