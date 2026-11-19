import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { PageHeader } from "../components/ui";
import { knowledge } from "../data/content";

export default function Knowledge() {
  const [open, setOpen] = useState<string | null>(knowledge[0].id);
  return (
    <>
      <PageHeader title="Islamic Knowledge" subtitle="Short, clear guides to the foundations of belief and practice." />
      <div className="container-page max-w-3xl space-y-3 py-8">
        {knowledge.map((k) => {
          const isOpen = open === k.id;
          return (
            <div key={k.id} className="card overflow-hidden">
              <h2>
                <button
                  className="flex min-h-[64px] w-full items-center justify-between gap-4 p-5 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`panel-${k.id}`}
                  onClick={() => setOpen(isOpen ? null : k.id)}
                >
                  <span>
                    <span className="block font-semibold">{k.title}</span>
                    <span className="block text-sm text-stone-500 dark:text-stone-400">{k.summary}</span>
                  </span>
                  <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                </button>
              </h2>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`panel-${k.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 leading-relaxed text-stone-700 dark:text-stone-300">{k.body}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </>
  );
}
