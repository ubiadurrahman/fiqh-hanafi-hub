import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ImagePlus, Loader2, LogIn, Send, X } from "lucide-react";
import { PageHeader, Skeleton, ErrorState, EmptyState } from "../components/ui";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api, ApiError, Post } from "../lib/api";
import { useInfiniteList } from "../lib/useInfiniteList";

const MAX = 3000;
const MAX_FILES = 4;
const MAX_MB = 5;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function Feed() {
  const list = useInfiniteList<Post>("/posts");

  return (
    <>
      <PageHeader title="Community" subtitle="Reminders, reflections and announcements from verified scholars." />
      <div className="container-page max-w-2xl space-y-4 py-6">
        <Composer onPosted={(p) => list.setItems((prev) => [p, ...prev])} />

        {list.items.map((p) => (
          <PostCard key={p.id} post={p} onDeleted={(id) => list.setItems((prev) => prev.filter((x) => x.id !== id))} />
        ))}

        {list.loading && (
          <div aria-busy="true" className="space-y-4">
            <Skeleton className="h-36" />
            {list.items.length === 0 && <Skeleton className="h-36" />}
          </div>
        )}
        {list.error && <ErrorState message={list.error} onRetry={list.retry} />}
        {!list.loading && !list.error && list.items.length === 0 && (
          <EmptyState title="No posts yet" text="Verified scholars will share posts here." />
        )}
        {list.done && list.items.length > 0 && (
          <p className="py-4 text-center text-sm text-stone-500 dark:text-stone-400">You're all caught up.</p>
        )}
        <div ref={list.sentinel} aria-hidden className="h-1" />
      </div>
    </>
  );
}

function Composer({ onPosted }: { onPosted: (p: Post) => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // Local previews; the object URLs are released when the selection changes.
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  if (!user) {
    return (
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
        <span className="text-stone-600 dark:text-stone-400">Sign in to like posts. Only verified scholars can publish them.</span>
        <Link to="/signin" state={{ from: "/feed" }} className="btn btn-outline">
          <LogIn className="h-4 w-4" aria-hidden /> Sign in
        </Link>
      </div>
    );
  }
  if (user.role !== "SCHOLAR") {
    return (
      <p className="card p-4 text-sm text-stone-600 dark:text-stone-400">
        Only verified scholars can publish posts. You can read and like them.
      </p>
    );
  }

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow picking the same file again later
    if (chosen.length === 0) return;
    const bad = chosen.find((f) => !TYPES.includes(f.type));
    if (bad) return setError(`“${bad.name}” is not a JPG, PNG or WebP photo.`);
    const big = chosen.find((f) => f.size > MAX_MB * 1024 * 1024);
    if (big) return setError(`“${big.name}” is larger than ${MAX_MB} MB.`);
    if (files.length + chosen.length > MAX_FILES) return setError(`You can attach up to ${MAX_FILES} photos.`);
    setError("");
    setFiles((prev) => [...prev, ...chosen]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim() && files.length === 0) return setError("Write something or attach a photo.");
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("body", body.trim());
      files.forEach((f) => form.append("images", f));
      const r = await api.post<{ post: Post }>("/posts", form);
      onPosted(r.post);
      setBody("");
      setFiles([]);
      toast("success", "Your post is live.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not publish your post");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-4 sm:p-5" aria-label="Create a post">
      <div className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-700 font-display text-lg font-bold text-white" aria-hidden>
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <label htmlFor="post-body" className="sr-only">
            Share with the community
          </label>
          <textarea
            id="post-body"
            rows={3}
            maxLength={MAX}
            className="input resize-y"
            placeholder={`Share a reminder, ${user.name.split(" ")[0]}…`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "post-error" : undefined}
          />

          {previews.length > 0 && (
            <ul className="mt-3 grid grid-cols-4 gap-2" aria-label="Selected photos">
              {previews.map((src, i) => (
                <li key={src} className="relative aspect-square overflow-hidden rounded-xl bg-stone-100 dark:bg-white/5">
                  <img src={src} alt={`Selected photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p id="post-error" role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={pick}
                aria-label="Choose photos"
              />
              <button
                type="button"
                className="btn btn-outline !min-h-[40px] text-sm"
                onClick={() => fileInput.current?.click()}
                disabled={busy || files.length >= MAX_FILES}
              >
                <ImagePlus className="h-4 w-4" aria-hidden /> Photo
              </button>
              <span className="text-xs tabular-nums text-stone-500 dark:text-stone-400">
                {body.length}/{MAX}
                {files.length > 0 && ` · ${files.length}/${MAX_FILES} photos`}
              </span>
            </div>
            <div className="flex gap-2">
              <Link to="/write" className="btn btn-outline !min-h-[40px] text-sm">
                Write an article
              </Link>
              <button type="submit" className="btn btn-primary !min-h-[40px]" disabled={busy || (!body.trim() && files.length === 0)}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                {busy ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
