import { ReactNode } from "react";

interface Props {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export default function Field({ id, label, error, hint, children }: Props) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export const describe = (id: string, error?: string, hint?: string) => ({
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
});

export function PasswordStrength({ value }: { value: string }) {
  const checks = [value.length >= 10, /[a-z]/.test(value), /[A-Z]/.test(value), /[0-9]/.test(value)];
  const score = checks.filter(Boolean).length;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-stone-300", "bg-red-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];
  if (!value) return null;
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? colors[score] : "bg-stone-200 dark:bg-white/10"}`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
        Strength: {labels[score]} — needs 10+ characters, upper &amp; lower case, and a number.
      </p>
    </div>
  );
}
