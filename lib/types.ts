export type Persona = { id: string; name: string; semester: number; targetCode: string | null };
export type Module = { id: string; semester: number; semesterLabel: string; name: string; coverage: number[] };

export type Skill = { id: string; escoLabel: string; group: number; note: string };
/** One line of a module's learning outcome that points at a skill. */
export type SkillLink = { skillId: string; moduleId: string; confidence: number; quote: string };

export type Occupation = {
  code: string;
  titleMs: string;
  titleEn: string;
  role: "primary" | "secondary" | "entry-level";
  essential: string[]; // skill ids
  optional: string[];
};

export type BookingStatus = "requested" | "accepted" | "declined" | "completed" | "cancelled";
export type Booking = {
  id: string;
  studentId: string;
  slot: string; // local time, "2026-10-22T10:00"
  status: BookingStatus;
  note?: string;
  cancelReason?: string;
  cancelledBy?: "student" | "adviser";
  changedSinceViewed: boolean;
};

export type RecallItem = { id: string; question: string; modelAnswer: string };
export type MasteryQuestion = { id: string; text: string; options: string[]; key: number };
export type Lesson = {
  skillId: string;
  slug: string;
  label: string;
  /** Content the team still has to write. The lesson and check pages say so. */
  todo?: boolean;
  items: RecallItem[];
  mastery: MasteryQuestion[];
};

export type Hint = { level: 1 | 2 | 3; title: "Nudge" | "Concept" | "Worked example"; text: string };

export type InterviewQuestion = { id: string; text: string; source: string; demoAnswer?: string };

export type StarPart = { part: "Situation" | "Task" | "Action" | "Result"; present: boolean; note: string };
export type Feedback = {
  star: StarPart[];
  evidence: string;
  technicalAccuracy: string;
  nextStep: string;
  weakArea: { label: string; itemId: string };
};
export type InterviewAnswer = { id: string; questionId: string; text: string; createdAt: string };

export type AdviserStudent = {
  id: string;
  name: string;
  semester: number;
  target: string;
  gaps: string;
  feedback: string;
};
