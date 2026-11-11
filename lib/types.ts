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
