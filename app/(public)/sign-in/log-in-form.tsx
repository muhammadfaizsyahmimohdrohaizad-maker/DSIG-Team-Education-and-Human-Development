"use client";
// Log-in form (Login board, "Log in"). Validates with logInInput from lib/schemas, shows errors after blur,
// and calls the logIn server action from features/auth/actions.ts.
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertMessage, Button, InfoMessage, PasswordInput, TextInput, useActionForm, zodFieldErrors } from "@/components/ui";
import type { Result } from "@/lib/result";
import { logInInput, passwordResetInput } from "@/lib/schemas";

type LogInValues = { email: string; password: string };

export function LogInForm({
  logIn,
  requestPasswordReset,
  next,
}: {
  logIn: (input: LogInValues) => Promise<Result<unknown>>;
  requestPasswordReset: (input: { email: string }) => Promise<Result<unknown>>;
  next: string;
}) {
  const router = useRouter();
  const validate = useCallback((v: LogInValues) => zodFieldErrors(logInInput.safeParse(v)), []);
  const form = useActionForm<LogInValues>({ initial: { email: "", password: "" }, validate });
  const [reset, setReset] = useState<{ kind: "sent" | "failed"; text: string } | null>(null);
  const [resetting, setResetting] = useState(false);

  async function sendReset() {
    if (resetting) return;
    const parsed = passwordResetInput.safeParse({ email: form.values.email });
    if (!parsed.success) {
      form.blur("email");
      setReset({ kind: "failed", text: "Enter your email above first, then choose Forgot password." });
      document.getElementById("email")?.focus();
      return;
    }
    setResetting(true);
    const result = await requestPasswordReset({ email: parsed.data.email });
    setResetting(false);
    setReset(result.ok
      ? { kind: "sent", text: `If an account uses ${parsed.data.email}, we've emailed it a link to reset the password. The link works once.` }
      : { kind: "failed", text: `${result.error.message} Reference: ${result.error.ref}.` });
  }

  return (
    <form
      noValidate
      onSubmit={form.onSubmit(logIn, () => { router.push(next); router.refresh(); })}
      className="m-0 flex flex-col gap-[18px]"
    >
      <TextInput
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="name@student.gmi.edu.my"
        value={form.values.email}
        onChange={(e) => form.set("email", e.target.value)}
        onBlur={() => form.blur("email")}
        error={form.error("email")}
      />
      <PasswordInput
        id="password"
        label="Password"
        autoComplete="current-password"
        value={form.values.password}
        onChange={(e) => form.set("password", e.target.value)}
        onBlur={() => form.blur("password")}
        error={form.error("password")}
        labelAside={
          <button type="button" onClick={sendReset} className="min-h-11 cursor-pointer px-1 text-sm font-semibold text-maroon underline">
            {resetting ? "Sending link…" : "Forgot password?"}
          </button>
        }
      />
      {reset ? (reset.kind === "sent" ? <InfoMessage>{reset.text}</InfoMessage> : <AlertMessage>{reset.text}</AlertMessage>) : null}
      {form.formError ? <AlertMessage>{form.formError}</AlertMessage> : null}
      <Button type="submit" size="large" fullWidth loading={form.pending} loadingText="Logging in…">Log in</Button>
    </form>
  );
}
