import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, ShieldAlert, X, XCircle } from "lucide-react";
import { PageHeader, Skeleton, ErrorState, EmptyState } from "../components/ui";
import { api, ApiError, AppStatus, LoginAttempt, ScholarApplication } from "../lib/api";
import { useToast } from "../context/ToastContext";

const tabs: { key: AppStatus; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

const statusCls: Record<AppStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

const fmt = (d: string) => new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export default function AdminScholars() {
  const [tab, setTab] = useState<AppStatus>("PENDING");
  const [list, setList] = useState<ScholarApplication[] | null>(null);
  const [stats, setStats] = useState<Record<AppStatus, number> | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(() => {
    setError("");
    setList(null);
    Promise.all([
      api.get<{ scholars: ScholarApplication[] }>(`/admin/scholars?status=${tab}`),
      api.get<{ stats: Record<AppStatus, number> }>("/admin/scholars/stats"),
    ])
      .then(([l, s]) => {
        setList(l.scholars);
        setStats(s.stats);
      })
      .catch((e: ApiError) => setError(e.message));
  }, [tab]);
  useEffect(load, [load]);

  return (
    <>
      <PageHeader title="Scholar Applications" subtitle="Review, approve or reject scholar applications and inspect sign-in activity." />
      <div className="container-page py-8">
        <div role="tablist" aria-label="Application status" className="mb-6 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`btn ${tab === t.key ? "btn-primary" : "btn-outline"}`}
            >
              {t.label}
              {stats && <span className="badge bg-black/10 dark:bg-white/15">{stats[t.key]}</span>}
            </button>
          ))}
        </div>

        {error && <ErrorState message={error} onRetry={load} />}
        {!error && !list && (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        )}
        {list && list.length === 0 && <EmptyState title={`No ${tab.toLowerCase()} applications`} />}
        {list && list.length > 0 && (
          <ul className="space-y-3">
            {list.map((s) => (
              <li key={s.id}>
                <button onClick={() => setSelected(s.id)} className="card card-hover flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left">
                  <span>
                    <span className="block font-semibold">{s.name}</span>
                    <span className="block text-sm text-stone-500 dark:text-stone-400">
                      {s.specialization} · {s.institution}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 text-sm text-stone-500 dark:text-stone-400">
                    {fmt(s.createdAt)}
                    <span className={`badge ${statusCls[s.status]}`}>{s.status}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <ReviewPanel
            key={selected}
            id={selected}
            onClose={() => setSelected(null)}
            onChanged={() => {
              setSelected(null);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ReviewPanel({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [s, setS] = useState<ScholarApplication | null>(null);
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<{ scholar: ScholarApplication }>(`/admin/scholars/${id}`),
      api.get<{ attempts: LoginAttempt[] }>(`/admin/scholars/${id}/login-attempts`),
    ])
      .then(([a, b]) => {
        setS(a.scholar);
        setAttempts(b.attempts);
      })
      .catch((e: ApiError) => setError(e.message));
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const approve = async () => {
    setBusy(true);
    try {
      await api.patch(`/admin/scholars/${id}/approve`);
      toast("success", "Scholar approved and now visible in the directory.");
      onChanged();
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Could not approve");
      setBusy(false);
    }
  };

  const reject = async () => {
    if (reason.trim().length < 5) return setReasonError("Give a short reason (5+ characters)");
    setBusy(true);
    try {
      await api.patch(`/admin/scholars/${id}/reject`, { reason: reason.trim() });
      toast("info", "Application rejected.");
      onChanged();
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Could not reject");
      setBusy(false);
    }
  };

  const details: [string, string][] = s
    ? [
        ["Email", s.email],
        ["Qualification", s.qualification],
        ["Specialization", s.specialization],
        ["Institution", s.institution],
        ["Experience", `${s.experienceYears} years`],
        ["City", s.city ?? "—"],
        ["Applied", fmt(s.createdAt)],
      ]
    : [];

  return (
    <motion.div className="fixed inset-0 z-[70] flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Review scholar application"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="relative h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl dark:bg-neutral-900"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-xl font-bold">{s?.name ?? "Application"}</h2>
          <button onClick={onClose} className="btn btn-ghost -m-2 !px-2" aria-label="Close panel">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <ErrorState message={error} />}
        {!error && !s && <Skeleton className="h-64" />}
        {s && (
          <div className="space-y-6">
            <span className={`badge ${statusCls[s.status]}`}>{s.status}</span>
            <dl className="space-y-3 text-sm">
              {details.map(([k, v]) => (
                <div key={k} className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-2">
                  <dt className="text-stone-500 dark:text-stone-400">{k}</dt>
                  <dd className="col-span-2 break-words font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <section>
              <h3 className="text-sm font-semibold">Biography</h3>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-700 dark:text-stone-300">{s.bio}</p>
            </section>
            {s.rejectionReason && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300">
                Rejection reason: {s.rejectionReason}
              </p>
            )}

            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ShieldAlert className="h-4 w-4" aria-hidden /> Recent sign-in attempts
              </h3>
              {attempts.length === 0 ? (
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">No sign-in attempts recorded.</p>
              ) : (
                <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto text-xs">
                  {attempts.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2 dark:bg-white/5">
                      <span className="flex items-center gap-1.5">
                        {a.success ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" aria-label="Failed" />
                        )}
                        {a.success ? "Success" : a.reason ?? "Failed"}
                      </span>
                      <span className="text-stone-500 dark:text-stone-400">
                        {a.ip ?? "?"} · {fmt(a.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="space-y-3 border-t border-stone-200 pt-4 dark:border-white/10">
              {rejecting ? (
                <>
                  <label htmlFor="reason" className="label">
                    Reason for rejection (shown in the audit record)
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    maxLength={500}
                    className="input"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setReasonError("");
                    }}
                    aria-invalid={reasonError ? true : undefined}
                  />
                  {reasonError && <p role="alert" className="text-sm text-red-600">{reasonError}</p>}
                  <div className="flex gap-2">
                    <button className="btn btn-outline flex-1" onClick={() => setRejecting(false)} disabled={busy}>
                      Cancel
                    </button>
                    <button className="btn btn-danger flex-1" onClick={reject} disabled={busy}>
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirm rejection
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  {s.status !== "REJECTED" && (
                    <button className="btn btn-outline flex-1 !border-red-300 text-red-700 dark:!border-red-500/40 dark:text-red-300" onClick={() => setRejecting(true)} disabled={busy}>
                      Reject
                    </button>
                  )}
                  {s.status !== "APPROVED" && (
                    <button className="btn btn-primary flex-1" onClick={approve} disabled={busy}>
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />} Approve
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.aside>
    </motion.div>
  );
}
