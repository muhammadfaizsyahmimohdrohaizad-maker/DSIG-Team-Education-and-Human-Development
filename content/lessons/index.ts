import "server-only";
// Lesson bodies, check questions with their answer keys, and review cards, bundled with the server.
// server-only: the answer keys in these files must never reach a client bundle.
import type { LessonFile } from "./types.ts";
import git from "./git.json";
import machineLearning from "./machine-learning.json";
import modelEvaluation from "./model-evaluation.json";
import deepLearning from "./deep-learning.json";
import modelDeployment from "./model-deployment.json";

const FILES = [git, machineLearning, modelEvaluation, deepLearning, modelDeployment] as unknown as LessonFile[];
const BY_KEY = new Map(FILES.map((f) => [f.skill, f]));

/** The lesson file for a skill key (see content/reference/keys.ts), or undefined if none is written yet. */
export function lessonFile(key: string): LessonFile | undefined {
  return BY_KEY.get(key);
}
