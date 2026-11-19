import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-stone-200 bg-white dark:border-white/10 dark:bg-neutral-900">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">Fiqh-e-Hanafi Hub</p>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            Authentic Hanafi learning with a directory of administrator-verified scholars.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Explore</p>
          <ul className="mt-2 space-y-1 text-sm text-stone-600 dark:text-stone-400">
            {[
              ["/quran", "Quran"],
              ["/hadith", "Hadith"],
              ["/fatwas", "Fatwas"],
              ["/scholars", "Scholars"],
            ].map(([to, l]) => (
              <li key={to}>
                <Link className="hover:text-emerald-700 dark:hover:text-emerald-400" to={to}>
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">For scholars</p>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            Qualified scholars can apply for verification and a public profile.
          </p>
          <Link to="/scholar-register" className="btn btn-outline mt-3">
            Apply as a scholar
          </Link>
        </div>
      </div>
      <div className="border-t border-stone-200 py-4 text-center text-xs text-stone-500 dark:border-white/10 dark:text-stone-400">
        Final Year Project · University of Buner · Quran text &amp; audio via alquran.cloud / islamic.network
      </div>
    </footer>
  );
}
