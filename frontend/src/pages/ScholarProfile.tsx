import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, Building2, ChevronLeft, GraduationCap, MapPin, Timer } from "lucide-react";
import { api, ApiError, Scholar } from "../lib/api";
import { ErrorState, Skeleton } from "../components/ui";

export default function ScholarProfile() {
  const { id } = useParams();
  const [s, setS] = useState<Scholar | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setS(null);
    setError("");
    api
      .get<{ scholar: Scholar }>(`/scholars/${encodeURIComponent(id ?? "")}`)
      .then((r) => setS(r.scholar))
      .catch((e: ApiError) => setError(e.status === 404 ? "This scholar profile was not found." : e.message));
  }, [id]);

  const rows = s
    ? [
        { icon: GraduationCap, label: "Qualification", value: s.qualification },
        { icon: Building2, label: "Institution", value: s.institution },
        { icon: Timer, label: "Experience", value: `${s.experienceYears} years` },
        ...(s.city ? [{ icon: MapPin, label: "City", value: s.city }] : []),
      ]
    : [];

  return (
    <div className="container-page max-w-3xl py-8">
      <Link to="/scholars" className="mb-4 inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline dark:text-emerald-400">
        <ChevronLeft className="h-4 w-4" aria-hidden /> All scholars
      </Link>
      {error && <ErrorState message={error} />}
      {!error && !s && <Skeleton className="h-72" />}
      {s && (
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 text-white sm:p-8">
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white/15 font-display text-2xl font-bold">
                {s.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <h1 className="font-display text-2xl font-bold">{s.name}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-emerald-100">
                  <BadgeCheck className="h-4 w-4 text-gold-300" aria-hidden /> Verified · {s.specialization}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-6 p-6 sm:p-8">
            <section>
              <h2 className="font-semibold">About</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-stone-700 dark:text-stone-300">{s.bio}</p>
            </section>
            <dl className="grid gap-4 sm:grid-cols-2">
              {rows.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 rounded-xl bg-stone-50 p-4 dark:bg-white/5">
                  <Icon className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <div>
                    <dt className="text-xs text-stone-500 dark:text-stone-400">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
