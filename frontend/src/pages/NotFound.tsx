import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="font-display text-6xl font-bold text-emerald-700 dark:text-emerald-400">404</p>
      <h1 className="mt-4 text-2xl font-semibold">We couldn't find that page</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400">The link may be broken or the page may have moved.</p>
      <Link to="/" className="btn btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}
