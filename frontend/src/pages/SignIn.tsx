import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Field, { describe } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ApiError } from "../lib/api";

export default function SignIn() {
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Enter your password";
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      toast("success", `Welcome back, ${u.name.split(" ")[0]}.`);
      nav(from ?? (u.role === "ADMIN" ? "/admin/scholars" : "/"), { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-10">
      <form onSubmit={submit} noValidate className="card w-full max-w-md space-y-5 p-6 sm:p-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Sign in</h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">Welcome back to Fiqh-e-Hanafi Hub.</p>
        </div>
        {formError && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {formError}
          </p>
        )}
        <Field id="email" label="Email" error={errors.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            {...describe("email", errors.email)}
          />
        </Field>
        <Field id="password" label="Password" error={errors.password}>
          <div className="relative">
            <input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className="input !pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              {...describe("password", errors.password)}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </Field>
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-stone-600 dark:text-stone-400">
          New here?{" "}
          <Link to="/signup" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            Create an account
          </Link>{" "}
          or{" "}
          <Link to="/scholar-register" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            apply as a scholar
          </Link>
        </p>
      </form>
    </div>
  );
}
