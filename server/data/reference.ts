import "server-only";
import modulesFile from "@/content/reference/modules.json";
import skillsFile from "@/content/reference/skills.json";
import linksFile from "@/content/reference/links.json";
import occupationsFile from "@/content/reference/occupations.json";
import iv251901 from "@/content/interview/2519-01.json";
import iv251201 from "@/content/interview/2512-01.json";
import iv251204 from "@/content/interview/2512-04.json";
import iv251401 from "@/content/interview/2514-01.json";
import iv251402 from "@/content/interview/2514-02.json";
import iv251301 from "@/content/interview/2513-01.json";
import iv3512 from "@/content/interview/3512.json";
import iv3513 from "@/content/interview/3513.json";
import iv3514 from "@/content/interview/3514.json";
import integration from "@/content/lessons/execute-integration-testing.json";
import automation from "@/content/lessons/use-test-automation-tools.json";
import reporting from "@/content/lessons/report-test-findings.json";
import type { InterviewQuestion, Lesson, Occupation } from "@/lib/types";

export type InterviewSet = { occupation: string; title: string; questions: InterviewQuestion[] };

const INTERVIEWS: InterviewSet[] = [iv251901, iv251201, iv251204, iv251401, iv251402, iv251301, iv3512, iv3513, iv3514];
const DEFAULT_INTERVIEW = INTERVIEWS[0];

/**
 * Reference data: the programme's modules, ESCO skills, the pipeline's skill links, the nine
 * MASCO occupations, lessons and interview questions. The same for every user and read-only,
 * so both stores read it from content/ rather than the database.
 */
export const reference = {
  modules: { axes: modulesFile.axes, modules: modulesFile.modules },
  skills: { groups: skillsFile.groups, skills: skillsFile.skills },
  links: linksFile.links,
  occupations: occupationsFile.occupations as Occupation[],
  lessons: [integration, automation, reporting] as Lesson[],
  /** The question set for a target occupation; 2519-01 System Tester when there is no target yet. */
  interviewFor(code: string | null): InterviewSet {
    return INTERVIEWS.find((i) => i.occupation === code) ?? DEFAULT_INTERVIEW;
  },
  /** Any question by id, with the set it belongs to and its 1-based number in that set. */
  questionById(id: string): { set: InterviewSet; question: InterviewQuestion; n: number } | null {
    for (const set of INTERVIEWS) {
      const i = set.questions.findIndex((q) => q.id === id);
      if (i >= 0) return { set, question: set.questions[i], n: i + 1 };
    }
    return null;
  },
};
