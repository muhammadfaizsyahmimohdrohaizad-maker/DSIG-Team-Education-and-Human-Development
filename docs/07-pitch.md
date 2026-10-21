# 07. Project pitch

| | |
|---|---|
| Document | 07-pitch.md |
| Version | 0.2 (draft for preliminary-round submission) |
| Status | Draft |
| Related | [README](../README.md), [03-architecture.md](03-architecture.md), [04-business-and-risk.md](04-business-and-risk.md), [06-evidence.md](06-evidence.md) |

This is the short version of CareerPrep for judges, mentors and anyone deciding whether to back it. It covers what we are building, why, how it works and where it stops. Every number links to its source in [06-evidence.md](06-evidence.md); terms such as MASCO, ESCO and τ are defined in the [README glossary](../README.md#17-glossary). The four figures are drawn in draw.io using standard notations: UML activity diagrams for behaviour and the C4 model for structure. Each figure has its own key, and the editable `.drawio` source sits next to the image in [diagrams/drawio/](diagrams/drawio/).

**Contents:** [1. Title and headline](#1-title-and-headline) · [2. The problem](#2-the-problem) · [3. The solution](#3-the-solution) · [4. Impact](#4-impact) · [5. Agent workflow and architecture](#5-agent-workflow-and-architecture) · [6. Safeguards](#6-safeguards) · [7. Limitations](#7-limitations) · [8. Value](#8-value)

## 1. Title and headline

**CareerPrep**

**Your diploma already points to a job. CareerPrep shows you which one, and gets you ready for the interview.**

Track 2: Education and Human Development. Built by Software Engineering students at the German-Malaysian Institute (GMI) for students like us.

## 2. The problem

Aina is in Semester 5 of the GMI Diploma in Software Engineering. Industrial Training starts next semester. She has passed Quality Assurance & Control, Android Programming and Advanced Web Programming, but when she opens a job board she sees hundreds of titles and no way to tell which ones her modules actually prepare her for. She doesn't know which skills she is missing, and she has never practised an interview for a specific role.

She is not unusual:

| What we see | Number | Source |
|---|---|---|
| Employed tertiary-educated Malaysians working below their qualifications (skill-related underemployment), Q2 2026 | **35.2%**, more than 1 in 3 | DOSM via [RinggitPlus](https://ringgitplus.com/en/blog/career/dosm-over-a-third-of-graduates-still-stuck-in-jobs-below-their-skills.html) |
| Youth unemployment (ages 15–24) against the national rate, Aug 2026 | 10.1% vs 2.9% | DOSM via [Malay Mail](https://www.malaymail.com/amp/news/money/2026/10/09/malaysias-august-2026-unemployment-rate-hits-new-low-of-29pc/238372) |
| New graduates each year against skilled, high-paying jobs created each year | ~100,000 TVET and ~300,000 university graduates vs ~50,000 jobs | HR Minister, Jan 2025, via [Malay Mail](https://www.malaymail.com/news/money/2025/01/20/low-wages-skills-mismatch-and-insufficient-job-opportunities-three-paradoxes-straining-malaysias-labour-market-says-hr-minister/163945) |
| Diploma and certificate holders in GenAI-exposed jobs, the most exposed education group | 46% | ISIS/World Bank, Aug 2025, via [Malay Mail](https://www.malaymail.com/news/malaysia/2025/08/29/study-warns-mid-skilled-young-workers-women-in-malaysia-most-at-risk-from-ai/188895) |

The information to help Aina exists, but it is scattered. Malaysia's official occupation list, MASCO 2020, describes each job and its tasks on the eMASCO portal. ESCO lists the skills each occupation needs. Her own course outlines list what she can do. Nothing connects the three, and no official machine-readable crosswalk from MASCO to ESCO exists. Job boards match job titles to qualifications. They do not read a student's modules.

## 3. The solution

CareerPrep connects those three sources for one student at a time, then turns the result into practice. It has four stages.

| Stage | What the student does | What CareerPrep does |
|---|---|---|
| **Map** | Picks their programme and the modules they have completed | Reads each learning outcome, finds the skills in it, and ranks MASCO 2020 occupations by how many of the needed skills the student already has. Every skill shows the sentence from the course outline it came from. |
| **Plan** | Picks a target job, for example 2519-01 System Tester, and rates their confidence in each missing skill | Builds a plan of one five-minute lesson a day, essential skills first, weakest first |
| **Practice** | Answers short recall questions, then takes a mock interview for that job | Schedules reviews with FSRS, gives hints instead of answers, checks mastery with the AI switched off, and asks interview questions taken from the job's official eMASCO task list |
| **Feedback** | Reads feedback on each answer and books an adviser if needed | Gives feedback on the answer (structure, evidence, technical accuracy, one next step), sends weak areas back into practice, and passes the student's evidence to a career adviser on request |

**Figure 7.1 — What changes for the student (UML activity diagram).** Today the path from module list to interview runs on guesswork. With CareerPrep, each step works from the student's own modules and the job's official task list. Square brackets mark the condition on each branch; τ is the match confidence threshold (0.6).

![Before and after CareerPrep: two swimlanes. Today: read module list, search job boards by title, prepare from generic tips, attend interview. With CareerPrep: select modules, Map, then a decision on match confidence; below τ goes to a career adviser, at or above τ goes to Plan, Practice with a no-AI mastery check that loops until mastered, a mock interview, feedback, and a loop back to Practice for weak areas.](diagrams/drawio/fig-7-1-before-after.png)

*Source: [fig-7-1-before-after.drawio](diagrams/drawio/fig-7-1-before-after.drawio)*

A career adviser gets a dashboard of their students' target jobs, gap skills, interview feedback and booking requests. Instead of starting each meeting from zero, the adviser starts from the student's evidence.

As of 19 Oct 2026, none of the tools we checked does all three things for Malaysian diploma students: map programme learning outcomes to MASCO occupations with quoted evidence, teach the missing skills with spaced practice, and run interviews built from the official task list with a human hand-off. AI interview tools such as Yoodli and Final Round AI tailor questions to a job description; they do not start from the student's modules or hand off to an adviser. TalentCorp's MYMahir offers a national skills taxonomy and upskilling recommendations; CareerPrep is meant to complement it, not replace it. The full comparison is in [04 §4](04-business-and-risk.md#4-competitors).

## 4. Impact

**Who it reaches.** Malaysia has 1,398 TVET institutions, and the government reports that 57.4% of SPM leavers entered TVET in 2025 (an official figure). About 100,000 TVET graduates enter the job market each year. Almost every one of them has a phone: 99.6% of Malaysians use a mobile phone and 98.3% use the internet (DOSM 2025). CareerPrep runs in the browser and installs as an app, so it needs no new hardware.

**What changes for each group.**

| Group | Change |
|---|---|
| Students | See which official jobs their modules lead to, what they are missing, and practise for that job before Industrial Training or graduation |
| Career advisers | Start each conversation from the student's mapped skills and interview feedback, and see which students asked for help and why |
| Institutions | Get evidence of how their programme maps to national occupations, and where students fall short, for each cohort |
| The wider system | A documented MASCO–ISCO–ESCO crosswalk built from real programme outcomes, which other programmes can reuse |

**How we will know it works.** We have no outcome data yet, and we will not claim any. No randomised trial of an AI career adviser exists, and evidence on AI interview practice is limited to small studies without control groups ([06 §4](06-evidence.md#4-design-evidence)). The design draws on evidence that career interventions work best with individual interpretation, labour-market information and human support (Brown & Ryan Krane [K]; Whiston et al. 2003), and that retrieval practice and spacing improve retention (Dunlosky et al. 2013 [K]). A pilot with one GMI cohort would measure career decision self-efficacy, interview self-efficacy, career certainty, adviser time per student and matcher precision, before and after use. The pilot design is in [04 §6](04-business-and-risk.md#6-impact-and-pilot-evaluation-plan).

## 5. Agent workflow and architecture

### 5.1 How the AI agents work

CareerPrep uses five AI agents. We use the word loosely: each one is a single language-model step with one narrow job and a fixed JSON output format. None of them acts on its own, browses or calls other tools. Code checks every output before anything is saved or shown, and the steps that decide things (scoring, scheduling, mastery marking) are plain code with no AI.

| Agent | Runs | Job | What checks it |
|---|---|---|---|
| Skill Extractor | Offline | Finds candidate skills in each learning outcome and returns the exact sentence each came from | Code confirms the quote appears word for word in the outcome |
| Skill Normaliser (re-ranker) | Offline | Picks the right ESCO skill from the top matches found by vector search, with a confidence score | Answer must be one of the supplied options; links below τ (0.6) are flagged |
| Lesson Engine (hint step) | Request time | Gives the next hint when a student is stuck | Output format has no answer field; the model sees the answer key only to judge correctness |
| Interview Engine | Request time | Writes interview questions for the target job | Each question must cite an eMASCO task or ESCO skill |
| Feedback Engine | Request time | Comments on each interview answer: structure, evidence, accuracy, one next step | Schema validation; on failure the answer is kept and marked "needs adviser" |

**Figure 7.2 — Agent workflow (UML activity diagram with swimlanes).** The middle lane holds every language-model step and the right lane every code step. Each model step hands its output straight to a code step, so nothing a model writes is stored or shown without a check.

![Agent workflow in two phases. Offline: a learning outcome goes to the Skill Extractor, code verifies quotes and discards unfound ones, the Skill Normaliser picks an ESCO skill, code stores it as covered or flagged against τ. Request time: Occupation Matcher and Gap Planner in code, Lesson Engine hint, mastery check in code, Interview Engine question, citation check in code, Feedback Engine, schema validation in code, then either show feedback or mark needs adviser.](diagrams/drawio/fig-7-2-agent-workflow.png)

*Source: [fig-7-2-agent-workflow.drawio](diagrams/drawio/fig-7-2-agent-workflow.drawio)*

The heavy work, reading every learning outcome and linking it to ESCO, runs once offline. That keeps the Map stage fast and means it still works if the language-model API is down. The full matching method and score formula are in [02-methodology.md](02-methodology.md).

### 5.2 Architecture

**Figure 7.3 — Containers (C4 model, level 2).** Students and advisers use one web app. The API server does all request-time work and is the only part that calls the model provider. The data pipeline fills the database ahead of time.

![C4 container diagram. Student and adviser use the Web app; Web app calls the API server; API server reads and writes the Postgres database, prompts the OpenAI API and sends booking status emails through an email provider over SMTP; the Python data pipeline loads reference data, writes to the database and calls OpenAI for extraction and embeddings.](diagrams/drawio/fig-7-3-containers.png)

*Source: [fig-7-3-containers.drawio](diagrams/drawio/fig-7-3-containers.drawio)*

| Layer | Choice | Why |
|---|---|---|
| App | Next.js progressive web app, Tailwind, Recharts | One codebase for phone and laptop; installs without an app store |
| Data | Supabase: Postgres with pgvector, Auth, row-level security | Vector search and student data in one database, with access rules enforced in the database |
| AI | OpenAI for the language model and embeddings, behind one adapter | One key for the demo; Claude or Gemini can be switched in by config |
| Pipeline | Python 3.11: ESCO loader, crosswalk builder, extraction, embeddings | Runs once per programme, so cost and latency stay out of the student's path |
| Scheduling | ts-fsrs (FSRS-6) | An open, benchmarked spaced-repetition scheduler |

Component diagrams, the data model, request sequences and deployment are in [03-architecture.md](03-architecture.md).

## 6. Safeguards

Unguarded AI can make students worse at a subject. In a field experiment with about 1,000 high-school students, open GPT-4 access raised practice grades by 48% but left unassisted exam scores 17% below the control group; a tutor limited to hints avoided that harm (Bastani et al. 2025, *PNAS*). We built CareerPrep around that result.

| Risk | Safeguard |
|---|---|
| The AI does the work for the student | Lessons give hints in three steps (nudge, concept, worked analogue) and never the answer. Mastery checks run with the AI off and are marked by an answer key in code. |
| The AI makes up a skill or a match | Every extracted skill must quote its source sentence, and code checks the quote word for word. The re-ranker can only choose from the options it is given. Interview questions must cite an official task. |
| A wrong match misleads a student | Every match shows its evidence and confidence. Links below τ (0.6) do not count towards the score and are marked "check with adviser". |
| A student relies only on the AI | A "Talk to a human" button sits on every low-confidence match card and every Feedback screen, and sends the student's evidence to a career adviser. |
| Feedback discourages the student | Feedback is about the answer, never the person: no overall grade and no praise or criticism of the student. |
| The model service fails | Results are cached. Each stage has a fallback: precomputed matches, a vetted static hint, a cached question set, or "needs adviser". |
| Personal data leaks | The demo uses made-up personas only. No audio is stored. Row-level security limits each student to their own rows. Students give consent first and can delete their data. Student data is never sent to a free tier that trains on it. Booking emails carry only the status, the time slot and a link. We follow the PDPA 2024 amendments, including 72-hour breach notification ([03 §9](03-architecture.md#9-privacy-and-security)). |

## 7. Limitations

We would rather name these ourselves than have a judge find them.

- **One programme.** The prototype covers the GMI Diploma in Software Engineering only. GMI does not publish course-level learning outcomes, so we entered them from our own course outlines.
- **Nine occupations.** The MASCO-to-ESCO crosswalk is our own; no official machine-readable version exists, and we entered eMASCO titles and tasks by hand.
- **Small evaluation.** About 25 hand-tagged learning outcomes is a sanity check, not a benchmark. We report precision, recall and F1 next to PERKESO's 2021 matching study (precision 59%, F1 64%) without claiming to beat it.
- **English only.** ESCO has no Malay version, and we have not tested how well the embeddings handle Malay.
- **No live job data.** Demand information is static and dated.
- **No outcome evidence yet.** We can show the system works as designed, not that it improves employment. That needs a pilot.
- **Voice is optional.** The interview is text-first; speech input works in Chrome only.
- **Competitor check incomplete.** We have not yet opened mymahir.my or mynext.my to confirm that neither maps programme outcomes to MASCO occupations.

Most of these limits have a known fix. Which tools we would add, and which we would leave out, is set out in [08-technology-upgrades.md](08-technology-upgrades.md).

## 8. Value

**Figure 7.4 — System context and value exchange (C4 model, level 1).** The institution pays and receives placement-readiness reports. Students use CareerPrep free, advisers receive booking requests with evidence, and national platforms are planned links rather than dependencies.

![C4 system context. A career-services officer pays a per-student annual licence and receives placement-readiness reports; the diploma student maps modules and practises; the career adviser handles bookings and receives booking requests with evidence; dashed planned links go to MYMahir for courses and MyFutureJobs for vacancies.](diagrams/drawio/fig-7-4-context-value.png)

*Source: [fig-7-4-context-value.drawio](diagrams/drawio/fig-7-4-context-value.drawio)*

**For students:** a clear answer to "what job is my diploma for, and am I ready?", with the evidence behind it and practice for the real interview.

**For advisers and institutions:** a starting point for every career conversation, and cohort-level evidence of where a programme meets national occupations and where it falls short. Institutions are already measured on graduate employability, so this is a report they need.

**Business model.** B2B2C: the institution pays a per-student annual licence and students use it free. We have not set a price. Running costs at pilot scale are small, because the expensive matching work runs once per programme; the order-of-magnitude estimate is in [04 §8](04-business-and-risk.md#8-costs-at-pilot-scale-order-of-magnitude).

**What is hard to copy.** The crosswalk and the dataset of real programme outcomes mapped to MASCO occupations. Each programme we add makes the next one cheaper and the dataset more useful to institutions and national platforms.

**What comes next.** We would add measurement first: an evaluation suite that scores the matcher on every change, traces for every AI call, and moderation that routes a student in distress to a person. Students would also get a portfolio export in plain Markdown that opens in Obsidian. After the prototype, a self-hosted SEA-LION model and the Malaysian-hosted ILMU API would answer the two questions institutions will ask: does it work in Malay, and does the data stay in Malaysia? We would not turn CareerPrep into an autonomous agent; its checked, single-step design is what makes it trustworthy. Details and the target architecture are in [08-technology-upgrades.md](08-technology-upgrades.md).

**What we ask for.** A pilot cohort at GMI, an adviser willing to use the dashboard, and feedback on whether the matches make sense to the people who teach these modules.
