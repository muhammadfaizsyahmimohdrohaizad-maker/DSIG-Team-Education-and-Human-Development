"use server";

// auth: server actions. Each validates input with Zod, calls server/data and server/engines,
// and returns a Result. See System Design 2.2 for the logic each one needs.
import { notBuilt, err, type Result } from "@/lib/result";
import { signUpInput } from "@/lib/schemas";

export async function signUp(input: unknown): Promise<Result<never>> {
  const parsed = signUpInput.safeParse(input);
  if (!parsed.success) return err("VALIDATION", "Check the highlighted fields.", Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])));
  return notBuilt("Sign-up");
}

export async function logIn(): Promise<Result<never>> {
  return notBuilt("Log-in");
}

export async function requestPasswordReset(): Promise<Result<never>> {
  return notBuilt("Password reset");
}
