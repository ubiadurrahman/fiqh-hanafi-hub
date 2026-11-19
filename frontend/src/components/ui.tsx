import { ReactNode } from "react";
import { motion } from "framer-motion";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-900 text-white">
      <div className="pattern-bg absolute inset-0" aria-hidden />
      <div className="container-page relative py-10 sm:py-14">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-bold sm:text-4xl"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-2 max-w-2xl text-emerald-50/90"
          >
            {subtitle}
          </motion.p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="card p-10 text-center">
      <p className="font-medium">{title}</p>
      {text && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{text}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="card border-red-200 p-8 text-center dark:border-red-500/30">
      <p className="font-medium text-red-700 dark:text-red-400">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-outline mt-4">
          Try again
        </button>
      )}
    </div>
  );
}

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
export const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};
