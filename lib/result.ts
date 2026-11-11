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

function newRef(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}
