import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader, stagger, rise } from "../components/ui";
import { fatwas } from "../data/content";

export default function Fatwas() {
  const cats = useMemo(() => ["All", ...Array.from(new Set(fatwas.map((f) => f.category)))], []);
  const [cat, setCat] = useState("All");
  const list = fatwas.filter((f) => cat === "All" || f.category === cat);
  return (
    <>
      <PageHeader title="Fatwas" subtitle="Practical rulings in the Hanafi school, explained simply." />
      <div className="container-page max-w-3xl py-8">
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={`btn !min-h-[40px] !px-4 text-sm ${cat === c ? "btn-primary" : "btn-outline"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <motion.ul key={cat} variants={stagger} initial="hidden" animate="show" className="space-y-4">
          {list.map((f) => (
            <motion.li key={f.id} variants={rise} className="card p-6">
              <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">{f.category}</span>
              <h2 className="mt-3 text-lg font-semibold">{f.question}</h2>
              <p className="mt-2 leading-relaxed text-stone-700 dark:text-stone-300">{f.answer}</p>
            </motion.li>
          ))}
        </motion.ul>
        <p className="mt-8 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          These entries are general educational summaries, not personal fatwas. For your own situation, consult a qualified
          scholar from our <a className="underline" href="/scholars">verified directory</a>.
        </p>
      </div>
    </>
  );
}
