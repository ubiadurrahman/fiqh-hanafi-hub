import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import Field, { describe, PasswordStrength } from "../components/Field";
import { PageHeader } from "../components/ui";
import { api, ApiError } from "../lib/api";
import { validPassword } from "./SignUp";

const initial = {
  name: "",
  email: "",
  password: "",
  confirm: "",
  qualification: "",
  specialization: "",
  institution: "",
  experienceYears: "",
  city: "",
  bio: "",
};

export default function ScholarRegister() {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const set = (k: keyof typeof initial) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (f.name.trim().length < 2) errs.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) errs.email = "Enter a valid email address";
    if (!validPassword(f.password)) errs.password = "Use 10+ characters with upper & lower case letters and a number";
    if (f.confirm !== f.password) errs.confirm = "Passwords do not match";
    if (f.qualification.trim().length < 3) errs.qualification = "Describe your highest qualification";
    if (f.specialization.trim().length < 2) errs.specialization = "Enter your specialization";
    if (f.institution.trim().length < 2) errs.institution = "Enter your institution";
    const yrs = Number(f.experienceYears);
    if (f.experienceYears === "" || !Number.isInteger(yrs) || yrs < 0 || yrs > 80) errs.experienceYears = "Enter whole years (0–80)";
    if (f.bio.trim().length < 50) errs.bio = `Write at least 50 characters (${f.bio.trim().length}/50)`;
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await api.post("/auth/register-scholar", {
        name: f.name.trim(),
        email: f.email.trim(),
        password: f.password,
        qualification: f.qualification.trim(),
        specialization: f.specialization.trim(),
        institution: f.institution.trim(),
        experienceYears: yrs,
        city: f.city.trim() || undefined,
        bio: f.bio.trim(),
      });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        if (err.fieldErrors) setErrors(Object.fromEntries(Object.entries(err.fieldErrors).map(([k, v]) => [k, v[0]])));
      } else setFormError("Submission failed");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center py-10">
        <div className="card max-w-md p-8 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" aria-hidden />
          <h1 className="mt-4 font-display text-2xl font-bold">Application submitted</h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            An administrator will review your details. You will be able to sign in once your application is approved.
          </p>
          <Link to="/" className="btn btn-primary mt-6">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Apply as a Scholar" subtitle="Applications are reviewed by administrators before a public profile is created." />
      <form onSubmit={submit} noValidate className="container-page max-w-2xl space-y-8 py-8">
        {formError && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {formError}
          </p>
        )}
        <fieldset className="card space-y-5 p-6">
          <legend className="px-2 font-semibold">Account</legend>
          <Field id="name" label="Full name" error={errors.name}>
            <input id="name" autoComplete="name" className="input" value={f.name} onChange={set("name")} {...describe("name", errors.name)} />
          </Field>
          <Field id="email" label="Email" error={errors.email}>
            <input id="email" type="email" autoComplete="email" className="input" value={f.email} onChange={set("email")} {...describe("email", errors.email)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="password" label="Password" error={errors.password}>
              <input id="password" type="password" autoComplete="new-password" className="input" value={f.password} onChange={set("password")} {...describe("password", errors.password)} />
            </Field>
            <Field id="confirm" label="Confirm password" error={errors.confirm}>
              <input id="confirm" type="password" autoComplete="new-password" className="input" value={f.confirm} onChange={set("confirm")} {...describe("confirm", errors.confirm)} />
            </Field>
          </div>
          <PasswordStrength value={f.password} />
        </fieldset>

        <fieldset className="card space-y-5 p-6">
          <legend className="px-2 font-semibold">Credentials</legend>
          <Field id="qualification" label="Highest qualification" error={errors.qualification} hint="e.g. Dars-e-Nizami / Shahadat-ul-Alamiyyah, Takhassus fi al-Fiqh">
            <input id="qualification" className="input" value={f.qualification} onChange={set("qualification")} {...describe("qualification", errors.qualification, "x")} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="specialization" label="Specialization" error={errors.specialization}>
              <input id="specialization" list="specs" className="input" value={f.specialization} onChange={set("specialization")} {...describe("specialization", errors.specialization)} />
              <datalist id="specs">
                {["Hanafi Fiqh", "Hadith", "Tafsir", "Quran Recitation (Tajweed)", "Aqeedah", "Arabic Language"].map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>
            <Field id="experienceYears" label="Years of experience" error={errors.experienceYears}>
              <input id="experienceYears" type="number" min={0} max={80} inputMode="numeric" className="input" value={f.experienceYears} onChange={set("experienceYears")} {...describe("experienceYears", errors.experienceYears)} />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="institution" label="Institution / Madrasa" error={errors.institution}>
              <input id="institution" className="input" value={f.institution} onChange={set("institution")} {...describe("institution", errors.institution)} />
            </Field>
            <Field id="city" label="City (optional)">
              <input id="city" autoComplete="address-level2" className="input" value={f.city} onChange={set("city")} />
            </Field>
          </div>
          <Field id="bio" label="Short biography" error={errors.bio} hint="Teachers, areas of teaching and any published work (50–1000 characters).">
            <textarea id="bio" rows={5} maxLength={1000} className="input" value={f.bio} onChange={set("bio")} {...describe("bio", errors.bio, "x")} />
          </Field>
        </fieldset>

        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} {busy ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </>
  );
}
