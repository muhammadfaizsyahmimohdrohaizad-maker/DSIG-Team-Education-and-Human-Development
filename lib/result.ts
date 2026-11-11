// Every server action returns a Result (System Design 2.5).
// The message is safe to show; raw database or provider errors stay in server logs.

export type ErrorCode =
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "NOT_FOUND"
  | "AI_TIMEOUT"
  | "AI_ERROR"
  | "EMAIL_FAILED"
  | "NOT_BUILT"
  | "UNEXPECTED";

export type AppError = {
  code: ErrorCode;
  message: string;
  ref: string;
  fields?: Record<string, string>;
};

export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export function err(code: ErrorCode, message: string, fields?: Record<string, string>): Result<never> {
  return { ok: false, error: { code, message, ref: newRef(), fields } };
}

/** Placeholder for actions whose screens are not built yet. grep "notBuilt(" to see what is left. */
export function notBuilt(feature: string): Result<never> {
  return err("NOT_BUILT", `${feature} is not built yet.`);
}

type Issue = { path: readonly PropertyKey[]; message: string };

/** A Zod failure as a VALIDATION result: one message per field, keyed by its dotted path. */
export function invalid(error: { issues: readonly Issue[] }): Result<never> {
  const fields: Record<string, string> = {};
  for (const i of error.issues) {
    const key = i.path.map(String).join(".") || "form";
    fields[key] ??= i.message;
  }
  return err("VALIDATION", "Check the highlighted fields.", fields);
}

/** The part of a Supabase / PostgREST error we look at. */
export type DbError = { code?: string; message?: string };

export type KnownDbErrors = Record<string, readonly [ErrorCode, string]>;

/**
 * Turns a database error into a safe Result. RPCs raise a short token as the message
 * (for example "slot_taken"); `known` maps tokens or SQLSTATE codes to what the user sees.
 * Anything else is logged with a reference and shown as UNEXPECTED.
 */
export function fromDb(e: DbError, known: KnownDbErrors, context: string): Result<never> {
  const hit = (e.message && known[e.message]) || (e.code && known[e.code]);
  if (hit) return err(hit[0], hit[1]);
  const r = err("UNEXPECTED", "Something went wrong on our side. Try again, and if it keeps happening, send us the error reference.");
  if (!r.ok) console.error(`[${context}] ref=${r.error.ref} code=${e.code ?? "?"} message=${e.message ?? "?"}`);
  return r;
}

/** UNEXPECTED with the cause logged against a reference the user can quote. */
export function unexpected(context: string, cause?: unknown): Result<never> {
  const r = err("UNEXPECTED", "Something went wrong on our side. Try again, and if it keeps happening, send us the error reference.");
  if (!r.ok) console.error(`[${context}] ref=${r.error.ref}`, cause instanceof Error ? cause.message : (cause ?? ""));
  return r;
}

function newRef(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}
