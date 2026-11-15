import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronDown, LogOut, Menu, ShieldCheck, User as UserIcon, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";

const learn = [
  { to: "/knowledge", label: "Islamic Knowledge" },
  { to: "/articles", label: "Articles" },
  { to: "/fatwas", label: "Fatwas" },
  { to: "/qna", label: "Questions & Answers" },
];
const main = [
  { to: "/", label: "Home" },
  { to: "/quran", label: "Quran" },
  { to: "/hadith", label: "Hadith" },
  { to: "/feed", label: "Community" },
];

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "text-emerald-700 dark:text-emerald-400"
      : "text-stone-600 hover:text-emerald-700 dark:text-stone-300 dark:hover:text-emerald-400"
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const { user, logout } = useAuth();
  const loc = useLocation();
  const learnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setLearnOpen(false);
  }, [loc.pathname]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (learnRef.current && !learnRef.current.contains(e.target as Node)) setLearnOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLearnOpen(false);
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-stone-50/85 backdrop-blur-lg dark:border-white/10 dark:bg-neutral-950/85">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Fiqh-e-Hanafi Hub home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-700 text-gold-300 shadow-sm">
            <BookOpen className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-display text-lg font-bold leading-tight">
            Fiqh-e-Hanafi <span className="text-emerald-700 dark:text-emerald-400">Hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {main.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className={linkCls}>
              {l.label}
            </NavLink>
          ))}
          <div className="relative" ref={learnRef}>
            <button
              onClick={() => setLearnOpen((v) => !v)}
              aria-expanded={learnOpen}
              aria-haspopup="true"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:text-emerald-700 dark:text-stone-300 dark:hover:text-emerald-400"
            >
              Learn <ChevronDown className={`h-4 w-4 transition-transform ${learnOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {learnOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="card absolute left-0 mt-2 w-56 p-2 shadow-xl"
                >
                  {learn.map((l) => (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      className="block rounded-lg px-3 py-2.5 text-sm hover:bg-stone-100 dark:hover:bg-white/10"
                    >
                      {l.label}
                    </NavLink>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <NavLink to="/scholars" className={linkCls}>
            Scholars
          </NavLink>
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <div className="hidden items-center gap-2 sm:flex">
            {user ? (
              <>
                {user.role === "ADMIN" && (
                  <Link to="/admin/scholars" className="btn btn-outline">
                    <ShieldCheck className="h-4 w-4" aria-hidden /> Admin
                  </Link>
                )}
                <span className="flex items-center gap-1.5 px-2 text-sm text-stone-600 dark:text-stone-300">
                  <UserIcon className="h-4 w-4" aria-hidden /> {user.name.split(" ")[0]}
                </span>
                <button onClick={logout} className="btn btn-ghost" aria-label="Sign out">
                  <LogOut className="h-4 w-4" aria-hidden />
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" className="btn btn-ghost">
                  Sign in
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>
          <button
            className="btn btn-ghost h-11 w-11 !min-h-0 !px-0 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-stone-200 bg-stone-50 lg:hidden dark:border-white/10 dark:bg-neutral-950"
          >
            <div className="container-page flex flex-col gap-1 py-3">
              {[...main, ...learn, { to: "/scholars", label: "Scholars" }].map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === "/"}
                  className={({ isActive }) =>
                    `flex min-h-[48px] items-center rounded-xl px-4 font-medium ${
                      isActive
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "hover:bg-stone-100 dark:hover:bg-white/10"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-stone-200 pt-3 dark:border-white/10">
                {user ? (
                  <>
                    {user.role === "ADMIN" && (
                      <Link to="/admin/scholars" className="btn btn-outline col-span-2">
                        Admin dashboard
                      </Link>
                    )}
                    <button onClick={logout} className="btn btn-outline col-span-2">
                      Sign out ({user.name.split(" ")[0]})
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/signin" className="btn btn-outline">
                      Sign in
                    </Link>
                    <Link to="/signup" className="btn btn-primary">
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
