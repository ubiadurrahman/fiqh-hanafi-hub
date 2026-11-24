import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, BookMarked, Loader2, LogIn, PenLine, Search, Send } from "lucide-react";
import Field, { describe } from "./Field";
import { EmptyState, ErrorState, Skeleton } from "./ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api, ApiError, QAQuestion, QuestionStatus } from "../lib/api";

type Filter = "all" | "answered" | "unanswered";
const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "answered", label: "Answered" },
  { key: "unanswered", label: "Awaiting answer" },
];

const statusFilters: { key: QuestionStatus; label: string }[] = [
  { key: "SUBMITTED", label: "Submitted" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "ANSWERED", label: "Answered" },
  { key: "NEEDS_CLARIFICATION", label: "Needs Clarification" },
];

const statusBadge: Record<QuestionStatus, string> = {
  SUBMITTED: "bg-stone-100 text-stone-800 dark:bg-stone-700/30 dark:text-stone-200",
  UNDER_REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  ANSWERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  NEEDS_CLARIFICATION: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
};

const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" });
const fieldErrs = (e: ApiError) =>
  e.fieldErrors ? Object.fromEntries(Object.entries(e.fieldErrors).map(([k, v]) => [k, v[0]])) : {};

export default function QnAFeed() {
  const { user } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState<QAQuestion[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [statusFilter, setStatusFilter] = useState<QuestionStatus | "all">("all");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const fetchPage = useCallback(
    (p: number) => {
      const params = new URLSearchParams({ page: String(p), filter });
      if (debounced) params.set("q", debounced);
      if (statusFilter !== "all") params.set("status", statusFilter);
      return api.get<{ questions: QAQuestion[]; hasMore: boolean }>(`/questions?${params}`);
    },
    [filter, statusFilter, debounced],
  );

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError("");
    setPage(1);
    fetchPage(1)
      .then((r) => {
        if (cancelled) return;
        setItems(r.questions);
        setHasMore(r.hasMore);
      })
      .catch((e: ApiError) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [fetchPage, reloadKey]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const r = await fetchPage(page + 1);
      setItems((prev) => [...(prev ?? []), ...r.questions]);
      setHasMore(r.hasMore);
      setPage(page + 1);
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Could not load more questions");
    } finally {
      setLoadingMore(false);
    }
  };

  const replace = (updated: QAQuestion) =>
    setItems((prev) => (prev ?? []).map((x) => (x.id === updated.id ? updated : x)));

  return (
    <div>
      <AskCard
        onAsked={(question) => {
          if (filter !== "answered" && !debounced) setItems((prev) => [question, ...(prev ?? [])]);
          else {
            setFilter("all");
            setQ("");
          }
        }}
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filter questions" className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`btn !min-h-[40px] !px-4 text-sm ${filter === f.key ? "btn-primary" : "btn-outline"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {user ? (
          <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
            <button
              key="status-all"
              onClick={() => setStatusFilter("all")}
              aria-pressed={statusFilter === "all"}
              className={`btn !min-h-[40px] !px-4 text-xs ${statusFilter === "all" ? "btn-primary" : "btn-outline"}`}
            >
              All statuses
            </button>
            {statusFilters.map((s) => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                aria-pressed={statusFilter === s.key}
                className={`btn !min-h-[40px] !px-4 text-xs ${statusFilter === s.key ? "btn-primary" : "btn-outline"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        ) : null}
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
          <input
            type="search"
            className="input !pl-11"
            placeholder="Search questions…"
            aria-label="Search questions"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 space-y-4" aria-live="polite">
        {error && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}
        {!error && !items && (
          <div aria-busy="true" className="space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        )}
        {items && items.length === 0 && (
          <EmptyState
            title={debounced ? "No questions match your search" : "No questions here yet"}
            text={debounced ? "Try different keywords." : "Be the first to ask."}
          />
        )}
        <AnimatePresence initial={false}>
          {items?.map((x) => (
            <QuestionCard key={x.id} question={x} onUpdated={replace} />
          ))}
        </AnimatePresence>
        {hasMore && (
          <div className="text-center">
            <button className="btn btn-outline" onClick={loadMore} disabled={loadingMore}>
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Load more questions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AskCard({ onAsked }: { onAsked: (q: QAQuestion) => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  if (!user) {
    return (
      <div className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Have a question for our scholars?</h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Sign in to ask. Verified scholars answer with authentic references.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link to="/signin" state={{ from: "/" }} className="btn btn-primary">
            <LogIn className="h-4 w-4" aria-hidden /> Sign in to ask
          </Link>
          <Link to="/signup" className="btn btn-outline">
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (title.trim().length < 10) errs.title = "Write at least 10 characters";
    if (body.trim().length < 10) errs.body = "Add a few details (10+ characters)";
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const r = await api.post<{ question: QAQuestion }>("/questions", { title: title.trim(), body: body.trim() });
      onAsked(r.question);
      setTitle("");
      setBody("");
      toast("success", "Your question was posted. A verified scholar will answer it.");
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        setErrors(fieldErrs(err));
      } else setFormError("Could not post your question");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="card space-y-4 p-5 sm:p-6" aria-labelledby="ask-heading">
      <h2 id="ask-heading" className="text-lg font-semibold">
        Ask a question
      </h2>
      {formError && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {formError}
        </p>
      )}
      <Field id="q-title" label="Your question" error={errors.title}>
        <input
          id="q-title"
          className="input"
          maxLength={200}
          placeholder="e.g. Is it permissible to combine two prayers while travelling?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          {...describe("q-title", errors.title)}
        />
      </Field>
      <Field id="q-body" label="Details" error={errors.body} hint="Share the situation so the scholar can answer accurately.">
        <textarea
          id="q-body"
          rows={3}
          maxLength={2000}
          className="input"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          {...describe("q-body", errors.body, "x")}
        />
      </Field>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
        {busy ? "Posting…" : "Post question"}
      </button>
    </form>
  );
}

function QuestionCard({ question: x, onUpdated }: { question: QAQuestion; onUpdated: (q: QAQuestion) => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [writing, setWriting] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const r = await api.patch<{ question: QAQuestion }>(`/questions/${x.id}/status`, {
        status: newStatus,
      });
      toast("success", `Status updated to ${r.question.status.replace(/_/g, " ")}`);
      onUpdated(r.question);
    } catch (err) {
      toast("error", err instanceof ApiError ? err.message : "Failed to update status");
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="card p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`badge ${
            x.answers.length
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
          }`}
        >
          {x.answers.length ? `${x.answers.length} answer${x.answers.length > 1 ? "s" : ""}` : "Awaiting answer"}
        </span>
        <span
          className={`badge text-xs font-medium ${statusBadge[x.status]}`}
        >
          {x.status.replace(/_/g, " ")}
        </span>
        <span className="text-xs text-stone-500 dark:text-stone-400">
          Asked by {x.askedBy} · {fmt(x.createdAt)}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-semibold">{x.title}</h3>
      <p className="mt-1 whitespace-pre-line text-stone-700 dark:text-stone-300">{x.body}</p>

      {x.answers.map((a) => (
        <div key={a.id} className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/5">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
            <BadgeCheck className="h-4 w-4 text-emerald-600" aria-label="Verified scholar" />
            {a.scholar.profileId ? (
              <Link to={`/scholars/${a.scholar.profileId}`} className="hover:underline">
                {a.scholar.name}
              </Link>
            ) : (
              a.scholar.name
            )}
            {a.scholar.specialization && (
              <span className="font-normal text-stone-500 dark:text-stone-400">· {a.scholar.specialization}</span>
            )}
            <span className="ml-auto text-xs font-normal text-stone-500 dark:text-stone-400">{fmt(a.createdAt)}</span>
          </p>
          <p className="mt-2 whitespace-pre-line leading-relaxed">{a.body}</p>
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-white p-3 text-sm dark:bg-white/5">
            <BookMarked className="mt-0.5 h-4 w-4 shrink-0 text-gold-600 dark:text-gold-300" aria-hidden />
            <span>
              <span className="font-semibold">Reference: </span>
              {a.reference}
            </span>
          </p>
        </div>
      ))}

      {user?.role === "SCHOLAR" && (
        <div className="mt-4">
          {!writing ? (
            <button className="btn btn-outline !min-h-[40px] text-sm" onClick={() => setWriting(true)}>
              <PenLine className="h-4 w-4" aria-hidden /> Write an answer
            </button>
          ) : (
            <AnswerForm
              questionId={x.id}
              onCancel={() => setWriting(false)}
              onDone={(q) => {
                setWriting(false);
                onUpdated(q);
              }}
            />
          )}
        </div>
      )}
      {(user?.role === "ADMIN" || user?.role === "SCHOLAR") && (
        <div className="mt-4">
          <label className="text-xs font-medium text-stone-500 dark:text-stone-400 block mb-1">
            Change status
          </label>
          <select
            value={x.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="input input-sm w-48"
          >
            {statusFilters.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </motion.article>
  );
}

function AnswerForm({
  questionId,
  onDone,
  onCancel,
}: {
  questionId: string;
  onDone: (q: QAQuestion) => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const [body, setBody] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const id = `ans-${questionId}`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

if (body.trim().length < 20) {
  errs.body = "Write at least 20 characters";
}

setErrors(errs);
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const r = await api.post<{ question: QAQuestion }>(`/questions/${questionId}/answers`, {
        body: body.trim(),
        reference: reference.trim() || undefined,
      });
      toast("success", "Your answer was published.");
      onDone(r.question);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        setErrors(fieldErrs(err));
      } else setFormError("Could not publish your answer");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-xl border border-stone-200 p-4 dark:border-white/10">
      {formError && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {formError}
        </p>
      )}
      <Field id={`${id}-body`} label="Your answer" error={errors.body}>
        <textarea
          id={`${id}-body`}
          rows={4}
          maxLength={5000}
          className="input"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          {...describe(`${id}-body`, errors.body)}
        />
      </Field>
      <Field
        id={`${id}-ref`}
        label="Authentic reference (optional)"
        error={errors.reference}
        hint="Optional: Quran (surah:ayah), Hadith (collection & number), or a Hanafi text (e.g. Al-Hidayah, Radd al-Muhtar)."
      >
        <input
          id={`${id}-ref`}
          className="input"
          maxLength={500}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          {...describe(`${id}-ref`, errors.reference, "x")}
        />
      </Field>
      <div className="flex gap-2">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Publish answer
        </button>
      </div>
    </form>
  );
}
