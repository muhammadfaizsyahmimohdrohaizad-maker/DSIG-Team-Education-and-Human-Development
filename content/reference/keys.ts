// Stable keys shared by the reference import and the server code.

const SKILL_PREFIX = "careerprep:skill/";

/** Primary key of a skill in ref.skills, built from its key in content/reference/skills.json. */
export const skillUri = (key: string): string => `${SKILL_PREFIX}${key}`;

/** Inverse of skillUri; undefined for anything that is not a CareerPrep skill key. */
export const skillKey = (uri: string): string | undefined =>
  uri.startsWith(SKILL_PREFIX) ? uri.slice(SKILL_PREFIX.length) : undefined;

/** Where a lesson's body lives; stored in ref.lessons.content_path. */
export const lessonPath = (key: string, no: number): string => `content/lessons/${key}.json#${no}`;
