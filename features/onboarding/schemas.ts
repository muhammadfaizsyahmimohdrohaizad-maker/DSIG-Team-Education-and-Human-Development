// Same shape as the frontend's parentDecisionInput in lib/schemas.ts; the PM keeps one copy at merge.
import { z } from "zod";
import { parentToken } from "@/lib/schemas";

export const parentDecisionInput = z.object({
  token: parentToken,
  decision: z.enum(["agree", "decline"], { error: "Choose Agree or Decline" }),
});
