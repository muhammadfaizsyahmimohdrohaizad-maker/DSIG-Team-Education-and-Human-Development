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
