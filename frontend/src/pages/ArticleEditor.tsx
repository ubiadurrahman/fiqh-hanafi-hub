import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Field, { describe } from "../components/Field";
import { ErrorState, PageHeader, Skeleton } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { api, ApiError, ArticleFull } from "../lib/api";

const MIN_PUBLISH = 200;
const MAX_BODY = 20000;

export default function ArticleEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();

  const [existing, setExisting] = useState<ArticleFull | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [loadError, setLoadError] = useState("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState<"draft" | "publish" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!id) return;
    api
      .get<{ article: ArticleFull }>(`/articles/${encodeURIComponent(id)}`)
      .then((r) => {
        if (!r.article.canEdit) return setLoadError("You can only edit your own articles.");
        setExisting(r.article);
        setTitle(r.article.title);
        setExcerpt(r.article.excerpt);
        setBody(r.article.body);
      })
      .catch((e: ApiError) => setLoadError(e.status === 404 ? "Article not found." : e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const published = existing?.status === "PUBLISHED";

  const save = async (publish: boolean) => {
    const errs: Record<string, string> = {};
    if (title.trim().length < 5) errs.title = "Title needs at least 5 characters";
    if (body.trim().length < 50) errs.body = "Write at least 50 characters";
    else if (publish && body.trim().length < MIN_PUBLISH)
      errs.body = `To publish, write at least ${MIN_PUBLISH} characters (now ${body.trim().length}). You can save it as a draft instead.`;
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;

    setBusy(publish ? "publish" : "draft");
    try {
      const payload = { title: title.trim(), excerpt: excerpt.trim() || undefined, body: body.trim(), publish };
      const r = existing
        ? await api.patch<{ article: ArticleFull }>(`/articles/${existing.id}`, { ...payload, excerpt: excerpt.trim() })
        : await api.post<{ article: ArticleFull }>("/articles", payload);
      if (publish) {
        toast("success", published ? "Changes saved." : "Your article is published.");
        nav(`/articles/${r.article.id}`);
      } else {
        toast("success", "Draft saved.");
        nav("/articles?tab=mine");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        if (err.fieldErrors) setErrors(Object.fromEntries(Object.entries(err.fieldErrors).map(([k, v]) => [k, v[0]])));
      } else setFormError("Could not save the article");
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="container-page max-w-3xl py-10">
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="container-page max-w-3xl py-10">
        <ErrorState message={loadError} />
      </div>
    );
  }

  return (
    <>
      <PageHeader title={existing ? "Edit article" : "Write an article"} subtitle="Plain text. Leave a blank line between paragraphs." />
      <form onSubmit={(e) => e.preventDefault()} noValidate className="container-page max-w-3xl space-y-6 py-8">
        {formError && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {formError}
          </p>
        )}
        <Field id="title" label="Title" error={errors.title}>
          <input
            id="title"
            className="input text-lg"
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            {...describe("title", errors.title)}
          />
        </Field>
        <Field id="excerpt" label="Short summary (optional)" hint="Shown on the article list. If left empty, it is taken from the start of your article.">
          <textarea id="excerpt" rows={2} maxLength={300} className="input" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        </Field>
        <Field id="body" label="Article" error={errors.body}>
          <textarea
            id="body"
            rows={18}
            maxLength={MAX_BODY}
            className="input resize-y leading-relaxed"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            {...describe("body", errors.body)}
          />
          <p className="mt-1 text-right text-xs tabular-nums text-stone-500 dark:text-stone-400">
            {body.length}/{MAX_BODY}
          </p>
        </Field>

        <div className="flex flex-wrap gap-3">
          <Link to="/articles?tab=mine" className="btn btn-ghost">
            Cancel
          </Link>
          {published ? (
            <>
              <button type="button" className="btn btn-outline" onClick={() => save(false)} disabled={!!busy}>
                {busy === "draft" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Unpublish and save as draft
              </button>
              <button type="button" className="btn btn-primary" onClick={() => save(true)} disabled={!!busy}>
                {busy === "publish" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save changes
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-outline" onClick={() => save(false)} disabled={!!busy}>
                {busy === "draft" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save draft
              </button>
              <button type="button" className="btn btn-primary" onClick={() => save(true)} disabled={!!busy}>
                {busy === "publish" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Publish
              </button>
            </>
          )}
        </div>
      </form>
    </>
  );
}
