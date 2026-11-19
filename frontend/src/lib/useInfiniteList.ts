import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "./api";

// Cursor-based infinite scroll. The API must answer { items: T[], nextCursor: string | null }.
// Attach the returned `sentinel` ref to an empty element at the end of the list.
export function useInfiniteList<T>(path: string) {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const busy = useRef(false);
  const gen = useRef(0); // ignores responses that belong to an outdated request
  const sentinel = useRef<HTMLDivElement | null>(null);

  const load = useCallback(
    async (c: string | null, reset: boolean) => {
      if (busy.current && !reset) return;
      const my = reset ? ++gen.current : gen.current;
      busy.current = true;
      setLoading(true);
      setError("");
      try {
        const sep = path.includes("?") ? "&" : "?";
        const r = await api.get<{ items: T[]; nextCursor: string | null }>(
          `${path}${c ? `${sep}cursor=${encodeURIComponent(c)}` : ""}`,
        );
        if (my !== gen.current) return;
        setItems((p) => (reset ? r.items : [...p, ...r.items]));
        setCursor(r.nextCursor);
        setDone(!r.nextCursor);
      } catch (e) {
        if (my === gen.current) setError(e instanceof ApiError ? e.message : "Could not load. Please try again.");
      } finally {
        if (my === gen.current) {
          busy.current = false;
          setLoading(false);
        }
      }
    },
    [path],
  );

  useEffect(() => {
    setItems([]);
    setCursor(null);
    setDone(false);
    load(null, true);
  }, [load, reloadKey]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || done || error || !cursor) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) load(cursor, false);
      },
      { rootMargin: "500px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [cursor, done, error, load]);

  const retry = () => (items.length === 0 ? setReloadKey((k) => k + 1) : load(cursor, false));

  return { items, setItems, loading, error, done, sentinel, retry };
}
