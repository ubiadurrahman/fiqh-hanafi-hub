import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Field, { describe, PasswordStrength } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ApiError } from "../lib/api";

export const validPassword = (p: string) => p.length >= 10 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p);

export default function SignUp() {
  const { signUp } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email address";
    if (!validPassword(password)) errs.password = "Use 10+ characters with upper & lower case letters and a number";
    if (confirm !== password) errs.confirm = "Passwords do not match";
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await signUp(name.trim(), email.trim(), password);
      toast("success", "Your account has been created.");
      nav("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        if (err.fieldErrors) {
          setErrors(Object.fromEntries(Object.entries(err.fieldErrors).map(([k, v]) => [k, v[0]])));
        }
      } else setFormError("Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-10">
      <form onSubmit={submit} noValidate className="card w-full max-w-md space-y-5 p-6 sm:p-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">Free, and it only takes a minute.</p>
        </div>
        {formError && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {formError}
          </p>
        )}
        <Field id="name" label="Full name" error={errors.name}>
          <input id="name" autoComplete="name" className="input" value={name} onChange={(e) => setName(e.target.value)} {...describe("name", errors.name)} />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <input id="email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} {...describe("email", errors.email)} />
        </Field>
        <Field id="password" label="Password" error={errors.password}>
          <input id="password" type="password" autoComplete="new-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} {...describe("password", errors.password)} />
          <PasswordStrength value={password} />
        </Field>
        <Field id="confirm" label="Confirm password" error={errors.confirm}>
          <input id="confirm" type="password" autoComplete="new-password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} {...describe("confirm", errors.confirm)} />
        </Field>
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} {busy ? "Creating account…" : "Sign up"}
        </button>
        <p className="text-center text-sm text-stone-600 dark:text-stone-400">
          Already registered?{" "}
          <Link to="/signin" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
