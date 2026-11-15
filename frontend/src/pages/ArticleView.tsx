import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, ChevronLeft, Clock, PenLine } from "lucide-react";
import { ErrorState, Skeleton } from "../components/ui";
import { api, ApiError, ArticleFull } from "../lib/api";
import { fullDate } from "../lib/format";

export default function ArticleView() {
  const { id } = useParams();
  const [a, setA] = useState<ArticleFull | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setA(null);
    setError("");
    api
      .get<{ article: ArticleFull }>(`/articles/${encodeURIComponent(id ?? "")}`)
      .then((r) => setA(r.article))
      .catch((e: ApiError) => setError(e.status === 404 ? "This article was not found." : e.message));
  }, [id]);

  return (
    <div className="container-page max-w-3xl py-8">
      <Link to="/articles" className="mb-4 inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline dark:text-emerald-400">
        <ChevronLeft className="h-4 w-4" aria-hidden /> All articles
      </Link>
      {error && <ErrorState message={error} />}
      {!error && !a && <Skeleton className="h-96" />}
      {a && (
        <article>
          {a.status === "DRAFT" && (
            <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              This is a draft. Only you can see it.
            </p>
          )}
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{a.title}</h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
            <BadgeCheck className="h-4 w-4 text-emerald-600" aria-label="Verified scholar" />
            {a.author.profileId ? (
              <Link to={`/scholars/${a.author.profileId}`} className="font-medium text-stone-800 hover:underline dark:text-stone-200">
                {a.author.name}
              </Link>
            ) : (
              <span className="font-medium">{a.author.name}</span>
            )}
            · {fullDate(a.publishedAt ?? a.updatedAt)} · <Clock className="h-3.5 w-3.5" aria-hidden /> {a.minutes} min read
          </p>
          {a.canEdit && (
            <Link to={`/write/${a.id}`} className="btn btn-outline mt-4 !min-h-[40px] text-sm">
              <PenLine className="h-4 w-4" aria-hidden /> Edit
            </Link>
          )}
          <div className="mt-8 whitespace-pre-line break-words text-lg leading-8 text-stone-800 dark:text-stone-200">{a.body}</div>
          <p className="mt-10 rounded-xl bg-stone-100 p-4 text-sm text-stone-600 dark:bg-white/5 dark:text-stone-400">
            Written by a verified scholar. For a ruling on your own situation, please ask a scholar directly.
          </p>
        </article>
      )}
    </div>
  );
}
