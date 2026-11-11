// Inputs for the auth actions. logInInput and passwordResetInput have the same shapes as the
// frontend's copies in lib/schemas.ts; the PM keeps one set at merge.
import { z } from "zod";
import { email, fullName, password } from "@/lib/schemas";

export const logInInput = z.object({ email, password: z.string().min(1, "Enter your password") });
export const passwordResetInput = z.object({ email });

const TICK = "Tick this box to create an account";

/**
 * Same fields and messages as signUpInput in lib/schemas.ts, except storeUse: advisers are not shown
 * that box (it is about a student's modules and skills), so it is required for students only.
 */
export const signUpForm = z.object({
  role: z.enum(["student", "adviser"]),
  fullName,
  email,
  password,
  isUnder18: z.boolean(),
  parentEmail: email.optional(),
  staffCode: z.string().trim().optional(),
  consents: z.object({
    termsPrivacy: z.literal(true, { error: TICK }),
    storeUse: z.boolean().optional(),
    aiProcessing: z.boolean().default(false),
    adviserVisibility: z.boolean().default(false),
  }),
}).refine((v) => v.role !== "student" || !v.isUnder18 || !!v.parentEmail, { path: ["parentEmail"], message: "Enter a parent or guardian's email" })
  .refine((v) => v.role !== "adviser" || !!v.staffCode, { path: ["staffCode"], message: "Enter your staff code" })
  .refine((v) => v.role !== "student" || v.consents.storeUse === true, { path: ["consents", "storeUse"], message: TICK });
