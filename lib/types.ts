// Domain types shared by engines, server actions and UI. Names follow the analysis data dictionary.

export type Role = "student" | "adviser" | "institution";
export type EducationLevel = "spm" | "pre_university" | "diploma" | "degree";
export type ConsentKind = "terms_privacy" | "store_use" | "ai_processing" | "adviser_visibility" | "parent";
export type SkillState = "have" | "learning" | "missing" | "check_needed" | "mastered";
export type BookingState = "requested" | "accepted" | "declined" | "change_requested" | "cancelled" | "completed";
export type InterviewRound = "technical" | "behavioural";
export type SharedItem = "target_matches" | "gap_progress" | "study_plan" | "interview_feedback";
export type Fit = "Strong" | "Good" | "Some";

export type MascoCode = string;
export type EscoUri = string;

export type SpmGrade = { subject: string; grade: string };
export type Project = { name: string; description?: string; link?: string };

export type Profile = {
  userId: string;
  isUnder18: boolean;
  educationLevel?: EducationLevel;
  spmGrades: SpmGrade[];
  moduleIds: string[];
  skills: EscoUri[];
  projects: Project[];
  interests: string[];
  jobInMind?: MascoCode;
  target?: MascoCode;
};

export type Occupation = {
  code: MascoCode;
  titleEn: string;
  titleMs?: string;
  tasks: string[];
  essentialSkills: EscoUri[];
  interestAreas: string[];
};

export type Reason = { kind: "interest" | "skill" | "project" | "job_in_mind"; text: string; source: string };

export type Match = {
  code: MascoCode;
  score: number;
  coverage: number;
  fit: Fit;
  reasons: Reason[];
};

export type SkillProgress = {
  skill: EscoUri;
  claimed: boolean;
  lessonsDone: number[];
  bestCheckScore?: number;
};

export type GapRow = { skill: EscoUri; state: SkillState };

export type Marks = { structure: 0 | 1 | 2; accuracy: 0 | 1 | 2; evidence: 0 | 1 };

// ---- Added by fullstack (sprint 1): matches, plan, learning, CV ----

export type SkillRef = { uri: EscoUri; label: string };
export type SkillSuggestion = SkillRef & { score: number };

/** A ranked match with what the screen needs to show it. */
export type MatchView = Match & { title: string; titleMs?: string; tasks: string[]; sourceUrl?: string };

export type StudyOption = {
  id: string;
  code: MascoCode;
  level: EducationLevel;
  kind: string;
  institution: string;
  programme: string;
  duration?: string;
  award?: string;
  sourceUrl: string;
  verified: boolean;
};

export type GapRowView = GapRow & {
  label: string;
  lessonsDone: number;
  /** The lesson to open next (1 to 4); undefined when there is nothing left to read. */
  nextLesson?: number;
  /** Why the row has this state, in plain words. */
  evidence: string;
  hasLessons: boolean;
};

export type SkillGapView = {
  target: { code: MascoCode; title: string };
  rows: GapRowView[];
  lessonsLeft: number;
  options: StudyOption[];
  savedOptionIds: string[];
};

export type LessonOutline = { no: number; title: string; minutes: number; done: boolean };

export type CheckQuestionView = { id: string; lessonNo: number; prompt: string; options: { id: string; text: string }[] };

export type CheckOpen =
  | { open: true; skill: EscoUri; title: string; questions: CheckQuestionView[] }
  | { open: false; skill: EscoUri; title: string; finishLesson: number; reason: "retake" | "lessons" };

export type CheckOutcome = {
  score: number;
  passed: boolean;
  retakeAfterLesson?: number;
  /**
   * The questions to go over and the lesson each comes from. The right answer and the explanation are
   * included only on a pass: a retake uses the same five questions, so a fail never reveals the key.
   */
  missed: { id: string; lessonNo: number; prompt: string; answer?: string; explanation?: string }[];
  reviewCardsAdded: number;
};

export type CvView = {
  name: string;
  educationLevel?: EducationLevel;
  target?: string;
  skills: { uri: EscoUri; label: string; evidence: string; forTarget: boolean }[];
  modules: string[];
  projects: Project[];
};
