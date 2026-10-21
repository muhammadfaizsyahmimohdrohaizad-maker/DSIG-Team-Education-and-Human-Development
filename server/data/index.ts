import "server-only";
import { env } from "../env";
import { fixtures } from "./fixtures";
import type { Store } from "./store";

/** Pages and actions call this and never import a store directly. */
export function getStore(): Store {
  if (env.DATA_MODE !== "fixtures") {
    throw new Error("DATA_MODE=supabase is not built yet. Use DATA_MODE=fixtures.");
  }
  return fixtures;
}
