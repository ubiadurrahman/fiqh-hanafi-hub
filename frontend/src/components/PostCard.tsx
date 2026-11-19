import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, ChevronLeft, ChevronRight, Heart, Trash2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api, ApiError, assetUrl, Post } from "../lib/api";
import { timeAgo } from "../lib/format";

export default function PostCard({ post: initial, onDeleted }: { post: Post; onDeleted: (id: string) => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [post, setPost] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);

  const like = async () => {
    if (!user) return toast("info", "Sign in to like posts.");
    if (busy) return;
    setBusy(true);
    const before = post;
    // Optimistic update so the heart responds instantly.
    setPost({ ...post, likedByMe: !post.likedByMe, likeCount: post.likeCount + (post.likedByMe ? -1 : 1) });
    try {
      const r = await api.post<{ liked: boolean; likeCount: number }>(`/posts/${post.id}/like`);
      setPost((p) => ({ ...p, likedByMe: r.liked, likeCount: r.likeCount }));
    } catch (e) {
      setPost(before);
      toast("error", e instanceof ApiError ? e.message : "Could not update your like");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/posts/${post.id}`);
      toast("success", "Post deleted.");
      onDeleted(post.id);
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Could not delete the post");
      setBusy(false);
      setConfirming(false);
    }
  };

  const a = post.author;
  const n = post.images.length;
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card p-5"
    >
      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-700 font-display text-lg font-bold text-white" aria-hidden>
          {a.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-semibold">
            {a.profileId ? (
              <Link to={`/scholars/${a.profileId}`} className="truncate hover:underline">
                {a.name}
              </Link>
            ) : (
              <span className="truncate">{a.name}</span>
            )}
            <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Verified scholar" />
          </p>
          <p className="truncate text-xs text-stone-500 dark:text-stone-400">
            {a.specialization ? `${a.specialization} · ` : ""}
            <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
          </p>
        </div>
        {post.canDelete && !confirming && (
          <button
            className="btn btn-ghost -m-2 !min-h-[40px] !px-2.5 text-stone-500"
            onClick={() => setConfirming(true)}
            aria-label="Delete post"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>

      {confirming && (
        <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 p-3 text-sm dark:bg-red-500/10">
          <span className="text-red-800 dark:text-red-300">Delete this post permanently?</span>
          <span className="flex gap-2">
            <button className="btn btn-outline !min-h-[40px] text-sm" onClick={() => setConfirming(false)} disabled={busy}>
              Cancel
            </button>
            <button className="btn btn-danger !min-h-[40px] text-sm" onClick={remove} disabled={busy}>
              Delete
            </button>
          </span>
        </div>
      )}

      {post.body && <p className="mt-4 whitespace-pre-line break-words leading-relaxed">{post.body}</p>}

      {n > 0 && (
        <div className={`mt-4 grid gap-1.5 overflow-hidden rounded-xl ${n === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {post.images.map((src, i) => (
            <button
              key={src}
              onClick={() => setViewer(i)}
              aria-label={`View photo ${i + 1} of ${n}`}
              className={`block overflow-hidden bg-stone-100 dark:bg-white/5 ${
                n === 1 ? "max-h-[32rem]" : n === 3 && i === 0 ? "row-span-2" : "aspect-square"
              }`}
            >
              <img
                src={assetUrl(src)}
                alt={`Photo ${i + 1} shared by ${a.name}`}
                loading="lazy"
                className={`w-full object-cover transition-transform duration-300 hover:scale-[1.02] ${
                  n === 1 ? "max-h-[32rem]" : "h-full"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      <footer className="mt-4 flex items-center gap-2 border-t border-stone-100 pt-3 dark:border-white/10">
        <button
          onClick={like}
          aria-pressed={post.likedByMe}
          aria-label={post.likedByMe ? "Unlike this post" : "Like this post"}
          className={`btn btn-ghost !min-h-[40px] !px-3 text-sm ${post.likedByMe ? "text-rose-600 dark:text-rose-400" : ""}`}
        >
          <Heart className={`h-5 w-5 transition-transform ${post.likedByMe ? "scale-110 fill-current" : ""}`} aria-hidden />
          {post.likeCount}
        </button>
      </footer>

      <AnimatePresence>
        {viewer !== null && (
          <Lightbox images={post.images} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} name={a.name} />
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function Lightbox({
  images,
  index,
  onIndex,
  onClose,
  name,
}: {
  images: string[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  name: string;
}) {
  const n = images.length;
  const go = (d: number) => onIndex((index + d + n) % n);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (n > 1 && e.key === "ArrowRight") onIndex((index + 1) % n);
      if (n > 1 && e.key === "ArrowLeft") onIndex((index - 1 + n) % n);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, n, onClose, onIndex]);

  // Rendered in a portal so "fixed" is relative to the screen, not the animated card.
  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${n}`}
      className="fixed inset-0 z-[80] grid place-items-center bg-black/90 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <button
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label="Close photo viewer"
        autoFocus
      >
        <X className="h-6 w-6" />
      </button>
      {n > 1 && (
        <>
          <button
            className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      <img
        src={assetUrl(images[index])}
        alt={`Photo ${index + 1} shared by ${name}`}
        className="max-h-[88vh] max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>,
    document.body,
  );
}
