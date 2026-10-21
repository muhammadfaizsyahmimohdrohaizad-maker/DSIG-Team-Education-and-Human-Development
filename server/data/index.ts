import "server-only";
import { env } from "../env";
import { fixtures } from "./fixtures";
import { supabaseStore } from "./supabase";
import type { Store } from "./store";

/** Pages and actions call this and never import a store directly. */
export function getStore(): Store {
  return env.DATA_MODE === "supabase" ? supabaseStore : fixtures;
}
