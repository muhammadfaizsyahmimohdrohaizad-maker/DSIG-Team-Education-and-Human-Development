// Zod schemas shared by forms and server actions: one rule set on both sides of the trust boundary.
import { z } from "zod";

export const email = z.string().trim().toLowerCase().email("Enter an email like name@student.gmi.edu.my");
export const password = z.string().min(8, "Use at least 8 characters");
export const fullName = z.string().trim().min(2, "Enter your full name").max(100);

export const signUpInput = z.object({
  role: z.enum(["student", "adviser"]),
  fullName,
  email,
  password,
  isUnder18: z.boolean(),
  parentEmail: email.optional(),
  staffCode: z.string().trim().optional(),
  consents: z.object({
    termsPrivacy: z.literal(true, { error: "Tick this box to create an account" }),
    storeUse: z.literal(true, { error: "Tick this box to create an account" }),
    aiProcessing: z.boolean(),
    adviserVisibility: z.boolean(),
  }),
}).refine((v) => !v.isUnder18 || !!v.parentEmail, { path: ["parentEmail"], message: "Enter a parent or guardian's email" })
  .refine((v) => v.role !== "adviser" || !!v.staffCode, { path: ["staffCode"], message: "Enter your staff code" });

export const profileInput = z.object({
  educationLevel: z.enum(["spm", "pre_university", "diploma", "degree"]),
  spmGrades: z.array(z.object({ subject: z.string(), grade: z.string() })).max(15),
  moduleIds: z.array(z.string()).max(80),
  skills: z.array(z.string()).max(50),
  interests: z.array(z.string()).max(10),
  projects: z.array(z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().max(1000).optional(),
    link: z.string().url().startsWith("https://", "Use an https:// link").optional(),
  })).max(10),
  jobInMind: z.string().optional(),
});

export const checkAnswers = z.object({
  skill: z.string(),
  answers: z.array(z.string()).length(5, "Answer all five questions"),
});

export const interviewAnswer = z.object({
  questionId: z.string().uuid(),
  text: z.string().trim().max(4000).optional(),
  skipped: z.boolean().default(false),
}).refine((v) => v.skipped || (v.text && v.text.length > 0), { path: ["text"], message: "Write an answer or choose Skip" });

export const bookingRequest = z.object({
  slotId: z.string().uuid(),
  topic: z.string().trim().min(1, "Pick a topic"),
  note: z.string().max(1000).optional(),
  shared: z.array(z.enum(["target_matches", "gap_progress", "study_plan", "interview_feedback"])),
  requestId: z.string().uuid(),
});

export const adviserFeedback = z.object({
  bookingId: z.string().uuid(),
  text: z.string().trim().min(1, "Write your feedback first").max(2000),
});

// ---- Accounts, booking and adviser actions (added by backend, Sprint 1) ----
const uuid = z.string().uuid("This link or button is out of date. Reload the page and try again.");

export const newPasswordInput = z.object({ password });

export const parentToken = z.string().trim().regex(/^[A-Za-z0-9_-]{43}$/, "This link is incomplete. Open it again from the email, or copy the whole link.");
export const parentTokenInput = z.object({ token: parentToken });
export const parentApprovalRequest = z.object({ parentEmail: email.optional() });

export const openSlotsQuery = z.object({
  from: z.iso.datetime({ offset: true }).optional(),
  days: z.number().int().min(1).max(60).default(14),
  adviserId: uuid.optional(),
});
export const bookingRef = z.object({ bookingId: uuid });
export const moveBookingInput = z.object({ bookingId: uuid, slotId: uuid });

export const respondInput = z.object({
  bookingId: uuid,
  accept: z.boolean(),
  note: z.string().trim().max(1000, "Keep the note under 1,000 characters").optional(),
}).refine((v) => v.accept || !!v.note, { path: ["note"], message: "Tell the student why, or suggest another time" });

export const availabilityInput = z.object({
  slots: z.array(z.object({
    start: z.iso.datetime({ offset: true, error: "Pick a time from the grid" }),
    minutes: z.union([z.literal(30), z.literal(60)], { error: "Choose 30 or 60 minutes" }),
    open: z.boolean(),
  })).max(300, "Save one or two weeks at a time"),
  blockDays: z.array(z.object({
    day: z.iso.date({ error: "Pick a date to block" }),
    reason: z.string().trim().max(200, "Keep the reason under 200 characters").optional(),
  })).max(60).default([]),
  unblockDays: z.array(z.iso.date({ error: "Pick a date to unblock" })).max(60).default([]),
});

export const consentUpdate = z.object({ kind: z.enum(["ai_processing", "adviser_visibility"]), given: z.boolean() });
export const deleteAccountInput = z.object({ confirmation: z.string().max(200) });

// ---- Added by fullstack (sprint 1) ----
export const occupationCode = z.string().trim().regex(/^\d{4}(-\d{2})?$/, "Pick a job from the list");
export const skillRef = z.string().trim().min(1).max(200);

export const setTargetInput = z.object({ code: occupationCode });
export const skillInput = z.object({ skill: skillRef });
export const skillText = z.object({ text: z.string().trim().min(2, "Type at least 2 letters").max(80, "Use 80 characters or fewer") });
export const studyOptionInput = z.object({ optionId: z.string().uuid() });
export const completeLessonInput = z.object({
  skill: skillRef,
  lessonNo: z.number().int().min(1).max(4),
  notes: z.string().max(20000, "Notes can be up to 20,000 characters").optional(),
});
/** Live ranking runs before the form is complete, so the education level may still be empty. */
export const rankInput = profileInput.partial({ educationLevel: true });
