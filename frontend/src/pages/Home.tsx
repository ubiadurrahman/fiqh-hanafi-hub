import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Headphones, Library, MessageCircleQuestion, ScrollText, ShieldCheck } from "lucide-react";
import { stagger, rise } from "../components/ui";
import QnAFeed from "../components/QnAFeed";
import QuranArt from "../components/QuranArt";

const features = [
  { to: "/quran", icon: Headphones, title: "Quran", text: "Read with translation and listen verse by verse with your favourite reciter." },
  { to: "/hadith", icon: ScrollText, title: "Hadith", text: "Authentic narrations with references to their sources." },
  { to: "/knowledge", icon: Library, title: "Islamic Knowledge", text: "Concise guides to belief, practice and the Hanafi school." },
  { to: "/fatwas", icon: BookOpen, title: "Fatwas", text: "Practical rulings explained clearly." },
  { to: "/qna", icon: MessageCircleQuestion, title: "Questions & Answers", text: "Common questions with trustworthy answers." },
  { to: "/scholars", icon: GraduationCap, title: "Verified Scholars", text: "Only administrator-approved scholars appear in our directory." },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-900 text-white">
        <div className="pattern-bg absolute inset-0 opacity-70" aria-hidden />
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl" aria-hidden />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" aria-hidden />
        <div className="container-page relative grid items-center gap-8 py-12 sm:gap-10 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-gold-300" aria-hidden /> Scholar-verified Hanafi learning
            </p>
            <h1 className="font-display text-[2rem] font-bold leading-[1.15] sm:text-5xl lg:text-[3.25rem]">
              Learn authentic Hanafi fiqh, with scholars you can trust.
            </h1>
            <p className="mt-4 max-w-xl text-base text-emerald-50/90 sm:text-lg">
              Quran reading and listening, Hadith, fatwas and a directory of scholars whose credentials are reviewed
              before they are listed.
            </p>
            <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
              <Link to="/quran" className="btn btn-gold">
                Start reading the Quran
              </Link>
              <Link to="/scholars" className="btn border border-white/30 text-white hover:bg-white/10">
                Meet our scholars
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.55 }}
            className="relative"
          >
            <QuranArt />
            <p className="mx-auto mt-2 max-w-sm text-center text-sm text-emerald-50/90">
              <span className="arabic text-lg text-gold-300" lang="ar">
                اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ
              </span>
              <span className="mt-1 block">“Read in the name of your Lord who created.” — Al-‘Alaq 96:1</span>
            </p>
          </motion.div>
        </div>
      </section>

      <section id="questions" className="container-page max-w-3xl py-12">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Questions &amp; answers</h2>
        <p className="mb-6 mt-2 text-stone-600 dark:text-stone-400">
          Recent questions answered by verified scholars, each with its reference.
        </p>
        <QnAFeed />
      </section>

      <section className="container-page py-14">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Everything in one place</h2>
        <p className="mt-2 text-stone-600 dark:text-stone-400">Pick a topic to get started.</p>
        <motion.ul
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map(({ to, icon: Icon, title, text }) => (
            <motion.li key={to} variants={rise}>
              <Link to={to} className="card card-hover block h-full p-6">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{text}</p>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </section>

      <section className="container-page pb-6">
        <div className="card flex flex-col items-start gap-4 bg-gradient-to-r from-emerald-50 to-gold-300/20 p-8 sm:flex-row sm:items-center sm:justify-between dark:from-emerald-500/10 dark:to-gold-400/10">
          <div>
            <h2 className="font-display text-xl font-bold">Are you a qualified scholar?</h2>
            <p className="mt-1 text-stone-600 dark:text-stone-400">
              Apply for verification. Administrators review every application before a profile is published.
            </p>
          </div>
          <Link to="/scholar-register" className="btn btn-primary shrink-0">
            Apply as a scholar
          </Link>
        </div>
      </section>
    </>
  );
}
