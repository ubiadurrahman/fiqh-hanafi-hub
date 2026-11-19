import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, Clock, Loader2, PenLine } from "lucide-react";
import { PageHeader, Skeleton, ErrorState, EmptyState } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api, ApiError, ArticleSummary } from "../lib/api";
import { fullDate } from "../lib/format";
import { useInfiniteList } from "../lib/useInfiniteList";

export default function Articles() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const isScholar = user?.role === "SCHOLAR";
  const tab = isScholar && params.get("tab") === "mine" ? "mine" : "all";

  return (
    <>
      <PageHeader title="Articles" subtitle="In-depth writing from verified scholars.">
        {isScholar && (
          <Link to="/write" className="btn btn-gold">
            <PenLine className="h-4 w-4" aria-hidden /> Write an article
          </Link>
        )}
      </PageHeader>
      <div className="container-page py-8">
        {isScholar && (
          <div role="tablist" aria-label="Articles" className="mb-6 flex gap-2">
            {(
              [
                ["all", "All articles"],
                ["mine", "My articles"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setParams(key === "mine" ? { tab: "mine" } : {})}
                className={`btn ${tab === key ? "btn-primary" : "btn-outline"}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {tab === "mine" ? <MyArticles /> : <AllArticles />}
      </div>
    </>
  );
}

function AllArticles() {
  const list = useInfiniteList<ArticleSummary>("/articles");
  return (
    <>
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {list.items.map((a) => (
          <motion.li key={a.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Link to={`/articles/${a.id}`} className="card card-hover flex h-full flex-col p-6">
              <h2 className="font-display text-xl font-bold">{a.title}</h2>
              <p className="mt-3 line-clamp-4 flex-1 text-stone-600 dark:text-stone-400">{a.excerpt}</p>
              <p className="mt-4 flex flex-wrap items-center gap-x-2 text-sm text-stone-500 dark:text-stone-400">
                <BadgeCheck className="h-4 w-4 text-emerald-600" aria-label="Verified scholar" />
                {a.author.name} · {a.publishedAt ? fullDate(a.publishedAt) : ""} ·
                <Clock className="h-3.5 w-3.5" aria-hidden /> {a.minutes} min
              </p>
            </Link>
          </motion.li>
        ))}
      </ul>
      {list.loading && (
        <div aria-busy="true" className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      )}
      {list.error && <ErrorState message={list.error} onRetry={list.retry} />}
      {!list.loading && !list.error && list.items.length === 0 && (
        <EmptyState title="No articles published yet" text="Verified scholars will publish articles here." />
      )}
      <div ref={list.sentinel} aria-hidden className="h-1" />
    </>
  );
}

function MyArticles() {
  const list = useInfiniteList<ArticleSummary>("/articles/mine");
  return (
    <>
      <ul className="space-y-3">
        {list.items.map((a) => (
          <MyRow
            key={a.id}
            article={a}
            onChanged={(u) => list.setItems((prev) => prev.map((x) => (x.id === u.id ? u : x)))}
            onDeleted={(id) => list.setItems((prev) => prev.filter((x) => x.id !== id))}
          />
        ))}
      </ul>
      {list.loading && <Skeleton className="h-24" />}
      {list.error && <ErrorState message={list.error} onRetry={list.retry} />}
      {!list.loading && !list.error && list.items.length === 0 && (
        <EmptyState title="You haven't written any articles yet" text="Use “Write an article” to start a draft." />
      )}
    </>
  );
}

function MyRow({
  article: a,
  onChanged,
  onDeleted,
}: {
  article: ArticleSummary;
  onChanged: (a: ArticleSummary) => void;
  onDeleted: (id: string) => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const published = a.status === "PUBLISHED";

  const toggle = async () => {
    setBusy(true);
    try {
      const r = await api.patch<{ article: ArticleSummary }>(`/articles/${a.id}`, { publish: !published });
      onChanged(r.article);
      toast("success", published ? "Moved back to drafts." : "Article published.");
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Could not update the article");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/articles/${a.id}`);
      toast("success", "Article deleted.");
      onDeleted(a.id);
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Could not delete the article");
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <li className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/articles/${a.id}`} className="font-semibold hover:underline">
            {a.title}
          </Link>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Updated {fullDate(a.updatedAt)}</p>
        </div>
        <span
          className={`badge ${
            published
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
          }`}
        >
          {published ? "Published" : "Draft"}
        </span>
      </div>

      {confirming ? (
        <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 p-3 text-sm dark:bg-red-500/10">
          <span className="text-red-800 dark:text-red-300">Delete this article permanently?</span>
          <span className="flex gap-2">
            <button className="btn btn-outline !min-h-[40px] text-sm" onClick={() => setConfirming(false)} disabled={busy}>
              Cancel
            </button>
            <button className="btn btn-danger !min-h-[40px] text-sm" onClick={remove} disabled={busy}>
              Delete
            </button>
          </span>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to={`/write/${a.id}`} className="btn btn-outline !min-h-[40px] text-sm">
            Edit
          </Link>
          <button className="btn btn-outline !min-h-[40px] text-sm" onClick={toggle} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} {published ? "Unpublish" : "Publish"}
          </button>
          <button
            className="btn btn-ghost !min-h-[40px] text-sm text-red-600 dark:text-red-400"
            onClick={() => setConfirming(true)}
            disabled={busy}
          >
            Delete
          </button>
        </div>
      )}
    </li>
  );
}
