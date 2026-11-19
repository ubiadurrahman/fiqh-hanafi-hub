import { Suspense, lazy, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { Skeleton } from "./components/ui";
import Home from "./pages/Home";

const Quran = lazy(() => import("./pages/Quran"));
const SurahReader = lazy(() => import("./pages/SurahReader"));
const Hadith = lazy(() => import("./pages/Hadith"));
const Knowledge = lazy(() => import("./pages/Knowledge"));
const Articles = lazy(() => import("./pages/Articles"));
const ArticleView = lazy(() => import("./pages/ArticleView"));
const ArticleEditor = lazy(() => import("./pages/ArticleEditor"));
const Feed = lazy(() => import("./pages/Feed"));
const Fatwas = lazy(() => import("./pages/Fatwas"));
const QnA = lazy(() => import("./pages/QnA"));
const Scholars = lazy(() => import("./pages/Scholars"));
const ScholarProfile = lazy(() => import("./pages/ScholarProfile"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const ScholarRegister = lazy(() => import("./pages/ScholarRegister"));
const AdminScholars = lazy(() => import("./pages/AdminScholars"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Fallback() {
  return (
    <div className="container-page space-y-4 py-12" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-[100] rounded-lg bg-emerald-700 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <Suspense fallback={<Fallback />}>
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/quran" element={<Quran />} />
                <Route path="/quran/:id" element={<SurahReader />} />
                <Route path="/hadith" element={<Hadith />} />
                <Route path="/knowledge" element={<Knowledge />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/articles/:id" element={<ArticleView />} />
                <Route path="/feed" element={<Feed />} />
                <Route
                  path="/write"
                  element={
                    <ProtectedRoute role="SCHOLAR">
                      <ArticleEditor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/write/:id"
                  element={
                    <ProtectedRoute role="SCHOLAR">
                      <ArticleEditor />
                    </ProtectedRoute>
                  }
                />
                <Route path="/fatwas" element={<Fatwas />} />
                <Route path="/qna" element={<QnA />} />
                <Route path="/scholars" element={<Scholars />} />
                <Route path="/scholars/:id" element={<ScholarProfile />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/scholar-register" element={<ScholarRegister />} />
                <Route
                  path="/admin/scholars"
                  element={
                    <ProtectedRoute role="ADMIN">
                      <AdminScholars />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
