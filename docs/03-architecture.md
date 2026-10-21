# 03. Architecture

| | |
|---|---|
| Document | 03-architecture.md |
| Version | 0.2 (draft for preliminary-round submission) |
| Status | Draft |
| Related | [01-prd.md](01-prd.md), [02-methodology.md](02-methodology.md), [06-evidence.md](06-evidence.md) |

**Contents:** [1. Purpose and scope](#1-purpose-and-scope) · [2. System context and containers](#2-system-context-and-containers) · [3. Components](#3-components) · [4. Data model](#4-data-model) · [5. AI guardrails (design requirements)](#5-ai-guardrails-design-requirements) · [6. LLM adapter, structured output, caching and fallbacks](#6-llm-adapter-structured-output-caching-and-fallbacks) · [7. Key sequences](#7-key-sequences) · [8. Lifecycle states](#8-lifecycle-states) · [9. Privacy and security](#9-privacy-and-security) · [10. Accessibility and responsiveness](#10-accessibility-and-responsiveness) · [11. Deployment](#11-deployment) · [12. Testing](#12-testing) · [13. Repository structure](#13-repository-structure) · [14. Scalability and future work](#14-scalability-and-future-work) · [15. Open questions](#15-open-questions)

## 1. Purpose and scope

This document specifies how CareerPrep is built: system context, containers, components, data model, AI guardrails, LLM handling, key sequences and states, privacy, deployment and tests. The matching pipeline, prompt contracts, match score and evaluation are defined once in [02-methodology.md](02-methodology.md) and linked from here, not repeated. Product scope and requirements are in [01-prd.md](01-prd.md). Acronyms and symbols (MASCO, ESCO, FSRS, STAR, PLO, PDPA, τ) are defined in the [README glossary](../README.md#17-glossary).

### 1.1 Diagram colour legend

Every diagram in the CareerPrep docs uses these colour classes with the same meaning.

| Class | Colour (fill / border) | Meaning |
|---|---|---|
| `person` | Pale red `#FDECEC` / red `#C53030` | Human actor |
| `ui` | Pale blue `#E8F1FB` / blue `#2B6CB0` | Screen or frontend |
| `svc` | Pale green `#EDF7ED` / green `#2F855A` | Our deterministic code |
| `ai` | Pale purple `#F3EEFB` / purple `#6B46C1` | LLM or embedding call |
| `data` | Pale amber `#FFF8E6` / amber `#B7791F` | Database table, store or file |
| `ext` | Pale grey `#F4F4F5` / grey `#71717A`, dashed | Third-party system or data source |

## 2. System context and containers

CareerPrep has two user roles, the **student** (diploma student) and the **career adviser**. Outside dependencies (Figure 3.1):

- **OpenAI API** for LLM calls and embeddings (text-embedding-3-small), behind one adapter. Claude or Gemini can be switched in by config; BGE-M3 is the open embedding alternative.
- **Supabase** for Postgres with pgvector, Auth and Storage.
- An **email provider** reached over SMTP. It sends Auth emails and booking status emails. Supabase's built-in email service sends only 2 emails an hour, and only to the project team, so a custom SMTP provider is needed. The provider is not chosen yet.
- Offline data sources listed in [02 §3](02-methodology.md#3-data-sources).
- An optional **browser speech service**, Chrome only. Chrome sends audio to a web service for recognition, so it does not work offline.

**Figure 3.1 — System context.** Students and advisers use one web app; everything else CareerPrep depends on is a third-party API or data source.

```mermaid
flowchart LR
    accTitle: CareerPrep system context
    accDescr: Students and career advisers use the CareerPrep web app. CareerPrep stores data in Supabase, calls the OpenAI API for LLM and embeddings, sends booking status emails through an SMTP email provider, reads ESCO, eMASCO and the GMI programme page offline, and can use the Chrome speech service. A legend shows the six colour classes.
    S(["Student"]) -->|"maps modules, practises, books adviser"| CP["CareerPrep<br/>web app + offline pipeline"]
    A(["Career adviser"]) -->|"reviews students, handles bookings"| CP
    CP -->|"reads and writes tables"| SB[("Supabase<br/>Postgres, Auth, Storage")]
    CP -->|"LLM and embedding calls"| OAI["OpenAI API<br/>LLM + embeddings (default)"]
    CP -->|"booking status emails"| MAIL["Email provider<br/>SMTP"]
    CP -->|"offline: skills, occupations"| ESCO["ESCO CSV download"]
    CP -->|"offline: tasks, codes"| EM["eMASCO portal"]
    CP -->|"offline: programme, PLOs"| GMI["GMI programme page"]
    CP -.->|"optional, Chrome only"| SP["Browser speech service"]
    subgraph Legend
        direction TB
        L1(["Person"]) ~~~ L2["Screen / frontend"] ~~~ L3["Our code"]
        L4["LLM / embedding call"] ~~~ L5[("Data store")] ~~~ L6["Third party"]
    end
    classDef person fill:#FDECEC,stroke:#C53030,color:#1A202C
    classDef ui fill:#E8F1FB,stroke:#2B6CB0,color:#1A202C
    classDef svc fill:#EDF7ED,stroke:#2F855A,color:#1A202C
    classDef ai fill:#F3EEFB,stroke:#6B46C1,color:#1A202C
    classDef data fill:#FFF8E6,stroke:#B7791F,color:#1A202C
    classDef ext fill:#F4F4F5,stroke:#71717A,color:#1A202C,stroke-dasharray:4 3
    class S,A,L1 person
    class L2 ui
    class CP,L3 svc
    class OAI,L4 ai
    class SB,L5 data
    class ESCO,EM,GMI,SP,MAIL,L6 ext
    style Legend fill:#FFFFFF,stroke:#A1A1AA
```

**Figure 3.2 — Containers.** Apart from optional speech, the browser talks only to the Next.js server and Supabase Auth; the Python pipeline runs on a developer machine and writes precomputed tables.

```mermaid
flowchart LR
    accTitle: CareerPrep containers
    accDescr: The browser PWA calls the Next.js server on Vercel over HTTPS and signs in with Supabase Auth. The Next.js server reads and writes Postgres with pgvector and Storage, and calls the OpenAI API. The Python pipeline on a developer machine upserts precomputed tables with the service-role key and calls OpenAI for embeddings and LLM. Speech recognition in Chrome is optional.
    subgraph Client["Browser"]
        PWA["Browser PWA<br/>Next.js client, Serwist"]
    end
    subgraph Vercel
        SRV["Next.js server<br/>route handlers, server actions"]
    end
    subgraph Supabase
        PG[("Postgres + pgvector")]
        AU["Auth"]
        ST[("Storage")]
    end
    subgraph Dev["Developer machine"]
        PY["Python pipeline<br/>/pipeline"]
    end
    OAI["OpenAI API"]
    MAIL["Email provider (SMTP)"]
    SP["Chrome speech service"]
    PWA -->|"HTTPS, JSON"| SRV
    PWA -->|"HTTPS, sign-in"| AU
    SRV -->|"HTTPS, supabase-js, RLS"| PG
    SRV -->|HTTPS| ST
    SRV -->|"HTTPS, JSON mode"| OAI
    SRV -->|"SMTP, TLS: booking status"| MAIL
    AU -->|"SMTP, TLS: auth emails"| MAIL
    PY -->|"service-role key, upsert"| PG
    PY -->|"HTTPS, embeddings + LLM"| OAI
    PWA -.->|"audio, optional"| SP
    classDef person fill:#FDECEC,stroke:#C53030,color:#1A202C
    classDef ui fill:#E8F1FB,stroke:#2B6CB0,color:#1A202C
    classDef svc fill:#EDF7ED,stroke:#2F855A,color:#1A202C
    classDef ai fill:#F3EEFB,stroke:#6B46C1,color:#1A202C
    classDef data fill:#FFF8E6,stroke:#B7791F,color:#1A202C
    classDef ext fill:#F4F4F5,stroke:#71717A,color:#1A202C,stroke-dasharray:4 3
    class PWA ui
    class SRV,PY svc
    class PG,ST data
    class AU,SP,MAIL ext
    class OAI ai
```

The Python pipeline precomputes the ESCO/eMASCO tables, `crosswalk`, `occupation_skill`, `outcome_skill` and embeddings ([02 §4](02-methodology.md#4-pipeline)). The Occupation Matcher and Gap Planner run in TypeScript (`/lib`) at request time over those tables, so the Map stage makes no LLM call. Live LLM calls are limited to lesson hints, interview turns and feedback.

## 3. Components

Component names match [02-methodology.md](02-methodology.md).

| Component | Responsibility | Inputs → Outputs | Tech |
|---|---|---|---|
| Skill Extractor | Propose candidate skills per learning outcome, each with a verbatim quote | `learning_outcome` → candidates (label, type, quote) | Python, LLM (offline) |
| Skill Normaliser | Map candidates to ESCO skills; accept or reject with quote and confidence | candidate + top-k `esco_skill` → `outcome_skill` | Embeddings, pgvector HNSW, LLM re-ranker (offline) |
| Occupation Matcher | Compute the match score per MASCO 6-digit occupation, using the score unit and "essential wins" rule in [02 §6](02-methodology.md#6-match-score) | `outcome_skill`, `occupation_skill`, `crosswalk` → ranked occupations + evidence quotes | TypeScript in `/lib`, SQL; request time |
| Gap Planner | List uncovered skills for the target, collect 1–5 confidence ratings, order gaps (essential first, then lowest rating), one ~5-minute lesson per day | `target_occupation` → `gap_skill`, `lesson` plan | TypeScript in `/lib`; request time |
| Lesson Engine | Serve micro-lessons and recall items; schedule reviews; give hints without answers; run the no-AI mastery check (5 questions per demo gap skill, pass 4 of 5, marked by answer key / keyword rubric) | `lesson`, `recall_item`, `review_state` → next items, updated `review_state` | ts-fsrs (FSRS-6), LLM adapter for hints only |
| Interview Engine | Build the role rubric and questions from eMASCO tasks and ESCO essential skills; run a text-first mock interview | `masco_occupation.tasks`, `occupation_skill`, `gap_skill` → `interview_session`, `interview_turn` | LLM adapter, optional Web Speech API |
| Feedback Engine | Task-level feedback per answer: STAR, evidence, technical accuracy, one next step; requeue weak areas | `interview_turn` + rubric → `feedback_item`, new `review_state` cards | LLM adapter |
| Adviser Hand-off | "Talk to a human" booking from low-confidence match cards and every Feedback screen; read-only adviser dashboard; accept, decline, complete, cancel; status emails to the student | student state → `booking`; adviser view; email | Next.js, Supabase RLS, SMTP |

**Figure 3.3 — Components and the tables they use.** Only three request-time components call the LLM, and all of them go through one adapter backed by `llm_cache`.

```mermaid
flowchart LR
    accTitle: Components and table access
    accDescr: The offline Skill Extractor and Skill Normaliser write precomputed tables. At request time the Occupation Matcher and Gap Planner read precomputed and student plan tables, the Lesson Engine reads and updates practice tables, the Interview and Feedback Engines write interview tables and add review cards, and the Adviser Hand-off writes bookings and sends status emails through the email provider. Lesson, Interview and Feedback Engines call the LLM adapter, which uses llm_cache and the OpenAI API.
    subgraph Off["Offline pipeline (Python)"]
        SX["Skill Extractor +<br/>Skill Normaliser"]
    end
    subgraph Req["Request time (Next.js, /lib)"]
        OM["Occupation Matcher"] --> GP["Gap Planner"]
        LE["Lesson Engine"]
        IE["Interview Engine"]
        FE["Feedback Engine"]
        AH["Adviser Hand-off"]
        AD["LLM adapter"]
    end
    subgraph SB["Supabase"]
        REF[("esco_skill, masco_occupation,<br/>crosswalk, occupation_skill,<br/>outcome_skill")]
        PLAN[("student_module,<br/>target_occupation, gap_skill")]
        PRAC[("lesson, recall_item,<br/>review_state")]
        INT[("interview_session,<br/>interview_turn, feedback_item")]
        BK[("booking")]
        CA[("llm_cache")]
    end
    OAI["OpenAI API (default)"]
    MAIL["Email provider (SMTP)"]
    SX -->|writes| REF
    SX --> OAI
    OM -->|reads| REF
    OM -->|reads| PLAN
    GP -->|"writes gap_skill"| PLAN
    LE -->|"reads, updates"| PRAC
    IE -->|reads| REF
    IE -->|writes| INT
    FE -->|writes| INT
    FE -->|"adds cards"| PRAC
    AH -->|writes| BK
    AH -->|"status emails"| MAIL
    AH -->|reads| PLAN
    LE --> AD
    IE --> AD
    FE --> AD
    AD <--> CA
    AD --> OAI
    classDef person fill:#FDECEC,stroke:#C53030,color:#1A202C
    classDef ui fill:#E8F1FB,stroke:#2B6CB0,color:#1A202C
    classDef svc fill:#EDF7ED,stroke:#2F855A,color:#1A202C
    classDef ai fill:#F3EEFB,stroke:#6B46C1,color:#1A202C
    classDef data fill:#FFF8E6,stroke:#B7791F,color:#1A202C
    classDef ext fill:#F4F4F5,stroke:#71717A,color:#1A202C,stroke-dasharray:4 3
    class SX,OM,GP,LE,IE,FE,AH,AD svc
    class REF,PLAN,PRAC,INT,BK,CA data
    class OAI ai
    class MAIL ext
```

## 4. Data model

The model has 21 entities, so it is shown as two diagrams with key fields only. `module`, `masco_occupation` and `esco_skill` appear in both. Full DDL lives in `/supabase/migrations`.

**Figure 3.4 — Data model: reference data and crosswalk.** Everything here is precomputed by the pipeline and read-only at request time.

```mermaid
erDiagram
    accTitle: Reference data and crosswalk entities
    accDescr: A programme has modules, which have learning outcomes. Learning outcomes link to ESCO skills through outcome_skill. MASCO occupations map to ESCO occupations through crosswalk, and ESCO occupations require ESCO skills through occupation_skill.
    programme ||--o{ module : has
    module ||--o{ learning_outcome : has
    learning_outcome ||--o{ outcome_skill : evidences
    esco_skill ||--o{ outcome_skill : linked_by
    esco_occupation ||--o{ occupation_skill : requires
    esco_skill ||--o{ occupation_skill : required_in
    masco_occupation ||--o{ crosswalk : maps
    esco_occupation ||--o{ crosswalk : mapped_from

    learning_outcome {
        uuid id PK
        uuid module_id FK
        text text
    }
    esco_skill {
        text uri PK
        text label_en
        vector embedding
    }
    esco_occupation {
        text uri PK
        text label_en
        text isco_code
    }
    masco_occupation {
        text code PK
        text title_en
        text title_ms
        jsonb tasks
        text isco_code
    }
    crosswalk {
        text masco_code FK
        text esco_occupation_uri FK
        text method
        float confidence
    }
    occupation_skill {
        text esco_occupation_uri FK
        text esco_skill_uri FK
        text relation
    }
    outcome_skill {
        uuid learning_outcome_id FK
        text esco_skill_uri FK
        text quote
        float confidence
        text method
    }
```

**Figure 3.5 — Data model: student activity.** Every student-owned row hangs off `student`, which is what row-level security and delete-my-data key on.

```mermaid
erDiagram
    accTitle: Student activity entities
    accDescr: A student takes modules, chooses target occupations, has gap skills, owns review states for recall items in lessons, runs interview sessions with turns and feedback items, and requests bookings. An adviser advises students and receives bookings.
    student ||--o{ student_module : takes
    module ||--o{ student_module : taken_in
    student ||--o{ target_occupation : chooses
    masco_occupation ||--o{ target_occupation : chosen_as
    student ||--o{ gap_skill : has
    esco_skill ||--o{ gap_skill : is
    esco_skill ||--o{ lesson : taught_in
    lesson ||--o{ recall_item : contains
    recall_item ||--o{ review_state : scheduled_by
    student ||--o{ review_state : owns
    student ||--o{ interview_session : runs
    masco_occupation ||--o{ interview_session : for_role
    interview_session ||--o{ interview_turn : has
    interview_turn ||--o{ feedback_item : receives
    adviser ||--o{ student : advises
    student ||--o{ booking : requests
    adviser ||--o{ booking : receives

    gap_skill {
        uuid student_id FK
        text esco_skill_uri FK
        int confidence_rating
    }
    review_state {
        uuid student_id FK
        uuid recall_item_id FK
        jsonb fsrs_card
        timestamptz due
    }
```

Notes:
- Entities without an attribute block carry the foreign keys implied by their relationships, plus: `interview_session` (status, §8.2), `interview_turn` (question, answer_text, needs_adviser), `feedback_item` (dimension, next_step), `booking` (status, §8.3, slot, note, cancelled_by, cancel_reason), `student` (adviser_id, consent_given). Mastery-check questions and their answer key / keyword rubric are stored in `recall_item` (kind = `mastery`, answer_key).
- `masco_occupation.tasks` holds `tasks[]` as a JSON array of task strings.
- `masco_occupation.code` is the 6-digit code (e.g. 2519-01). `crosswalk.masco_code` is the 4-digit unit group; a 6-digit occupation uses the rows for its first four digits ([02 §6](02-methodology.md#6-match-score)).
- `occupation_skill.relation` is `essential` or `optional`.
- `interview_turn` stores answer text only. No audio is stored.
- One support table outside the domain model, `llm_cache` (key hash, prompt version, model, JSON output), backs §6.

## 5. AI guardrails (design requirements)

Bastani et al. (2025, *PNAS* 122(26):e2422633122) ran a field experiment with about 1,000 Turkish high-school students: unrestricted GPT-4 access raised practice grades by 48% but left unassisted exam scores 17% below the control group. A guardrailed tutor (hints, teacher-provided solutions) avoided that harm, though it did not beat the control group. The following are requirements.

| # | Requirement | How it is enforced | Source |
|---|---|---|---|
| 1 | Hints, not answers, in lessons | Lesson Engine uses a hint ladder: nudge, then concept, then worked analogue. The output schema has no `answer` field. The model gets the answer key only to judge correctness | Bastani et al. 2025 |
| 2 | Grounded outputs | Extraction and matching must quote source text, and code verifies each quote as a substring ([02 §5](02-methodology.md#5-prompt-contracts)). Lessons draw on vetted content in `lesson.content`. Interview questions cite a MASCO task or ESCO skill | Bastani et al. 2025 |
| 3 | No-AI mastery checks | One 5-question check per demo gap skill, pass 4 of 5, with hints and AI disabled, marked deterministically against an answer key / keyword rubric (no LLM). Its result updates `review_state` | Bastani et al. 2025 |
| 4 | Human in the loop | Confidence is shown on every link. Skills below τ (default 0.6) are not covered and show "check with adviser". A "Talk to a human" button is on every low-confidence match card and every Feedback screen | Whiston et al. 2003 |
| 5 | Task-level feedback | `feedback_item` covers dimensions (STAR, evidence, technical accuracy) plus one next step. There is no overall grade or praise of the person | Kluger & DeNisi 1996 [K] |

## 6. LLM adapter, structured output, caching and fallbacks

**Figure 3.6 — LLM call path.** A request-time LLM result reaches the student only after it passes validation; every failure path ends in a fixed fallback.

```mermaid
flowchart TB
    accTitle: LLM call path with caching, validation, retry and fallback
    accDescr: The calling engine builds a cache key and checks llm_cache. On a miss the adapter calls the provider. Timeouts, rate limits and 5xx errors retry with backoff up to two times. Responses are validated; invalid ones get one repair attempt. Valid results are written to llm_cache and returned. Exhausted retries or a failed repair fall back to a stage-specific default.
    A["Caller<br/>Lesson, Interview or Feedback Engine"] --> B["Cache key<br/>hash(prompt_version, model, input)"]
    B --> C{"Hit in llm_cache?"}
    C -->|hit| R["Return to caller"]
    C -->|miss| E["LLM adapter<br/>generateJSON"]
    E --> F["Provider API<br/>OpenAI by default"]
    F --> G{"Timeout, rate limit<br/>or 5xx?"}
    G -->|yes| H{"Retries left?<br/>(max 2)"}
    H -->|"yes, backoff"| E
    H -->|no| M["Stage fallback<br/>static hint, cached questions<br/>or needs adviser"]
    G -->|no| I["Validate: Zod schema,<br/>quotes, URIs in options"]
    I --> J{"Valid?"}
    J -->|yes| L[("Write llm_cache")]
    J -->|"no, first time"| K["One repair attempt<br/>with validation error"]
    J -->|"no, after repair"| M
    K --> F
    L --> R
    M --> R
    classDef person fill:#FDECEC,stroke:#C53030,color:#1A202C
    classDef ui fill:#E8F1FB,stroke:#2B6CB0,color:#1A202C
    classDef svc fill:#EDF7ED,stroke:#2F855A,color:#1A202C
    classDef ai fill:#F3EEFB,stroke:#6B46C1,color:#1A202C
    classDef data fill:#FFF8E6,stroke:#B7791F,color:#1A202C
    classDef ext fill:#F4F4F5,stroke:#71717A,color:#1A202C,stroke-dasharray:4 3
    class A,B,C,E,G,H,I,J,K,M,R svc
    class F ai
    class L data
```

- **Adapter.** `server/llm/adapter.ts` exposes `generateJSON(schema, prompt, input, opts)`. Provider modules implement each vendor's schema-constrained JSON mode. Switching provider is a config change (`LLM_PROVIDER`), including `recorded`, which replays saved responses for the demo and end-to-end tests. The Python pipeline follows the same pattern in `pipeline/careerprep_pipeline/llm.py`. Each side keeps its prompts next to the code that uses them (`server/llm/prompts/`, `pipeline/prompts/`), because no prompt is shared between runtime and pipeline.
- **Validation.** Responses are parsed against a Zod schema (TypeScript) or a pydantic schema (Python), then quote and URI checks run. Responses that fail validation are never shown.
- **Determinism.** Temperature is fixed at 0. Each prompt version is stored with its output.
- **Caching.** The key is `hash(prompt_version, model, input)`. The pipeline writes JSON files in `/pipeline/cache/`; the runtime writes to `llm_cache`. Interview question sets are cached per (occupation, gap set, prompt version).
- **Retries** follow Figure 3.6. Assumption: at most 2 retries.
- **Fallbacks when the LLM fails:**
  - **Map:** precomputed results are always available, so there is no runtime dependency.
  - **Lesson hint:** show the vetted static hint for that `recall_item`.
  - **Interview question:** serve the cached question set for the occupation.
  - **Feedback:** keep the answer, mark the turn **"needs adviser"**, and offer the adviser hand-off.
- **Data routing.** Real student data must never be sent to the Gemini free tier, because content sent there is used to improve Google's products (per a third-party summary; [06 §6](06-evidence.md#6-technical-facts-used)). The demo uses seeded personas only.

## 7. Key sequences

### 7.1 Map flow

**Figure 3.7 — Map flow.** Scoring reads only precomputed tables, so the Map stage makes no LLM call.

```mermaid
sequenceDiagram
    accTitle: Map flow
    accDescr: The student selects programme and modules. The route handler saves student_module rows and asks the Occupation Matcher for scores. The matcher reads outcome_skill, occupation_skill and crosswalk and returns ranked occupations with evidence quotes and low-confidence flags, which the UI shows as a radar chart and match cards.
    actor S as Student
    participant UI as Browser PWA
    participant API as Route handler
    participant M as Occupation Matcher
    participant DB as Supabase Postgres
    S->>UI: Select programme and modules
    UI->>API: POST /api/map {moduleIds}
    API->>DB: Save student_module rows
    API->>M: score(studentId)
    M->>DB: Read outcome_skill, occupation_skill, crosswalk
    DB-->>M: Rows
    M-->>API: Ranked occupations, scores, evidence quotes, low-confidence flags
    API-->>UI: JSON
    UI-->>S: Radar chart, match cards with quotes and confidence
```

### 7.2 Practice: lesson and hint ladder

**Figure 3.8 — Practice lesson.** Hints escalate one level per request and never contain the answer; the student's own rating drives the FSRS schedule.

```mermaid
sequenceDiagram
    accTitle: Practice lesson with hint ladder and FSRS update
    accDescr: The Lesson Engine reads due review_state rows and serves a recall question. Each hint request moves one step up the ladder of nudge, concept and worked analogue, using the LLM adapter or the vetted static hint if the LLM fails. The student submits an answer and rates recall, and ts-fsrs updates review_state.
    actor S as Student
    participant UI as Browser PWA
    participant LE as Lesson Engine
    participant LLM as LLM adapter
    participant DB as Supabase Postgres
    S->>UI: Open today's practice
    UI->>LE: Next due item
    LE->>DB: Read due review_state, recall_item, lesson
    DB-->>LE: Rows
    LE-->>UI: Micro-lesson and recall question
    loop Each hint request: nudge, then concept, then worked analogue
        S->>UI: Ask for a hint
        UI->>LE: Hint request (next level)
        LE->>LLM: generateJSON(hintSchema), answer key for judging only
        alt Valid hint
            LLM-->>LE: Hint JSON with no answer field
        else LLM fails
            LE->>LE: Use vetted static hint for the recall_item
        end
        LE-->>UI: Hint
    end
    S->>UI: Submit answer, rate Again, Hard, Good or Easy
    UI->>LE: Answer and rating
    LE->>LE: ts-fsrs computes next card state and due date
    LE->>DB: Update review_state (fsrs_card, due)
    LE-->>UI: Next due date
```

### 7.3 Mastery check

**Figure 3.9 — Mastery check.** The check is marked by code against an answer key, with no LLM anywhere in the flow. The skill is mastered with at least 4 of 5 correct (`MASTERY_PASS_MARK`, default 0.8).

```mermaid
sequenceDiagram
    accTitle: No-AI mastery check
    accDescr: The student starts a five-question mastery check for a gap skill with hints and AI disabled. The Lesson Engine reads the questions and answer key, marks the answers deterministically against the answer key or keyword rubric, compares the score with the pass mark of 4 of 5, and updates review_state.
    actor S as Student
    participant UI as Browser PWA
    participant LE as Lesson Engine
    participant DB as Supabase Postgres
    Note over UI,DB: No LLM call. Hints and AI are disabled.
    S->>UI: Start mastery check for a gap skill
    UI->>LE: Start check (gap skill)
    LE->>DB: Read 5 check questions and answer key
    DB-->>LE: Rows
    LE-->>UI: 5 questions (answer key stays on the server)
    S->>UI: Answer all 5
    UI->>LE: Submit answers
    LE->>LE: Mark against answer key / keyword rubric
    LE->>LE: Mastered if score ≥ 4 of 5
    LE->>DB: Update review_state
    LE-->>UI: Result per question and pass or retry
```

### 7.4 Interview turn and feedback

**Figure 3.10 — Interview turn and feedback.** Answer text is saved before evaluation, so an LLM failure loses nothing and routes the student to an adviser.

```mermaid
sequenceDiagram
    accTitle: Interview turn and feedback
    accDescr: The student types or dictates an answer. The Interview Engine saves the turn as text and asks the Feedback Engine to evaluate it against the rubric points through the LLM adapter. Valid feedback is saved and weak areas are added to review_state. If the LLM fails after retries, the turn is marked needs adviser and the UI offers Talk to a human.
    actor S as Student
    participant UI as Browser PWA
    participant IE as Interview Engine
    participant FE as Feedback Engine
    participant LLM as LLM adapter
    participant DB as Supabase Postgres
    S->>UI: Type answer (or dictate, Chrome only)
    UI->>IE: POST /api/interview/turn {sessionId, answer}
    IE->>DB: Save interview_turn (text only)
    IE->>FE: evaluate(turn, rubric_points)
    FE->>LLM: generateJSON(feedbackSchema)
    alt Valid response
        LLM-->>FE: Task-level feedback JSON
        FE->>DB: Save feedback_item rows
        FE->>DB: Add weak areas to review_state
        FE-->>UI: Feedback and next question
    else LLM fails after retries
        FE->>DB: Mark turn needs adviser
        FE-->>UI: Answer saved, offer Talk to a human
    end
    UI-->>S: Feedback per dimension and one next step
```

### 7.5 Adviser hand-off and booking

**Figure 3.11 — Adviser hand-off.** The booking carries the student's evidence to the adviser, who can change the booking status but not the student's data. The status is saved before the email is sent.

```mermaid
sequenceDiagram
    accTitle: Adviser hand-off and booking
    accDescr: The student taps Talk to a human on a flagged match card or a Feedback screen. The Adviser Hand-off inserts a booking with status requested. The adviser opens the read-only dashboard, sees the student's target occupation, gap skills and feedback summary, and accepts or declines. The Adviser Hand-off saves the status, then emails the student the status, slot and a link. The student also sees the new status in the app.
    actor S as Student
    participant UI as Browser PWA
    participant AH as Adviser Hand-off
    participant DB as Supabase Postgres
    actor A as Career adviser
    participant EM as Email provider
    S->>UI: Tap Talk to a human (flagged match card or Feedback screen)
    UI->>AH: Booking request (preferred slot, note)
    AH->>DB: Insert booking, status requested
    AH-->>UI: Request sent
    A->>UI: Open adviser dashboard
    UI->>AH: List requests
    AH->>DB: Read bookings and assigned students (RLS, read-only)
    DB-->>AH: Target occupation, gap skills, feedback summary
    AH-->>UI: Dashboard rows
    A->>UI: Accept or decline
    UI->>AH: Update booking status
    AH->>DB: Set status accepted or declined
    AH->>EM: Status email (status, slot, link)
    UI-->>S: New status and badge shown in the app
```

## 8. Lifecycle states

### 8.1 review_state card

`review_state.fsrs_card` holds a ts-fsrs card. Cards are created for each recall item of a gap-skill lesson and for weak areas found by the Feedback Engine. Transitions follow ts-fsrs with its default short-term learning steps.

**Figure 3.12 — review_state card states.** A card leaves Learning once it is recalled well, and a lapse in Review sends it to Relearning rather than back to New.

```mermaid
stateDiagram-v2
    accTitle: review_state card states in ts-fsrs
    accDescr: A card starts as New. Again, Hard or Good move it to Learning, Easy moves it straight to Review. Learning graduates to Review on Good at the last step or Easy. In Review, Again is a lapse that moves the card to Relearning, and Good or Easy in Relearning return it to Review.
    [*] --> New: card created
    New --> Learning: Again, Hard or Good
    New --> Review: Easy
    Learning --> Learning: Again, Hard, or Good before last step
    Learning --> Review: Good on last step, or Easy
    Review --> Review: Hard, Good or Easy
    Review --> Relearning: Again (lapse)
    Relearning --> Relearning: Again or Hard
    Relearning --> Review: Good or Easy
```

### 8.2 interview_session

**Figure 3.13 — interview_session states.** A session is closed only after feedback is ready; a session left early is kept as abandoned.

```mermaid
stateDiagram-v2
    accTitle: interview_session states
    accDescr: A session is created when the student picks a target role, moves to in_progress when the first question is served, stays in_progress while turns are saved, becomes feedback_ready after the last answer, and closed once the student reviews feedback. Created or in_progress sessions become abandoned if the student leaves.
    [*] --> created: student starts interview
    created --> in_progress: first question served
    in_progress --> in_progress: turn saved and evaluated
    in_progress --> feedback_ready: last question answered
    feedback_ready --> closed: student reviews feedback
    created --> abandoned: student leaves
    in_progress --> abandoned: student leaves
    closed --> [*]
    abandoned --> [*]
```

A turn marked "needs adviser" (§6) does not change the session state.

### 8.3 booking

**Figure 3.14 — booking states.** Only an accepted booking can be completed, and only the adviser completes it. The student can cancel a request, and either side can cancel an accepted booking; the adviser must give a reason.

```mermaid
stateDiagram-v2
    accTitle: booking states
    accDescr: A booking starts as requested. The adviser accepts or declines it, or the student cancels it. The adviser marks an accepted booking completed after the session. Either side can cancel it; the adviser gives a reason, which is stored with who cancelled.
    [*] --> requested: Talk to a human
    requested --> accepted: adviser accepts / email student
    requested --> declined: adviser declines / email student
    requested --> cancelled: student cancels
    accepted --> completed: adviser marks session held
    accepted --> cancelled: student cancels
    accepted --> cancelled: adviser cancels [reason given] / email student
    declined --> [*]
    completed --> [*]
    cancelled --> [*]
```

## 9. Privacy and security

Legal context (Malaysia PDPA 2010, with the 2024 amendments phased in on 1 Jan, 1 Apr and 1 Jun 2025):
- Breach notification to the Commissioner is due within 72 h, and to affected data subjects within 7 days after that where significant harm is likely.
- A DPO is mandatory above 20,000 data subjects, or 10,000 for sensitive data.
- Data portability is a new right.
- Biometric data is now sensitive. Whether voice recordings count as biometric is unconfirmed, so we treat them cautiously.

**Figure 3.15 — Personal-data flow.** Student data leaves the browser as text, except opt-in audio sent to the speech service, and audio is never stored.

```mermaid
flowchart LR
    accTitle: Personal-data flow across trust boundaries
    accDescr: The student passes the consent screen before using the browser PWA. Optional audio goes from the browser to the Chrome speech service and comes back as text, and audio is never stored. The browser sends module choices, ratings and answer text over HTTPS to route handlers on the Next.js server, which store rows in Supabase student-owned tables under RLS and send answer text, rubric and lesson item to the OpenAI API. Booking status emails carry only the status, slot and a link to the student's email address. Delete my data removes student-owned rows.
    subgraph BR["Browser (student device)"]
        S(["Student"]) --> CS["Consent screen<br/>before first use"]
        CS --> UI["Browser PWA"]
    end
    subgraph GS["Chrome speech service (optional)"]
        SP["Speech recognition"]
    end
    subgraph VS["Next.js server (Vercel)"]
        RH["Route handlers<br/>server-only keys"]
        DEL["Delete my data"]
    end
    subgraph SB["Supabase"]
        DB[("Student-owned tables<br/>RLS on student_id")]
    end
    subgraph OA["OpenAI API"]
        LLM["LLM via adapter"]
    end
    subgraph EP["Email provider (SMTP)"]
        MAIL["Status email"]
    end
    NA["Never stored: audio"]
    UI -.->|"audio, opt-in"| SP
    SP -.->|"transcript text"| UI
    SP -.- NA
    UI -->|"modules, ratings,<br/>answer text (HTTPS)"| RH
    RH -->|"rows incl. answer text"| DB
    RH -->|"answer text, rubric,<br/>lesson item"| LLM
    LLM -->|"JSON output"| RH
    RH -->|"status, slot, link<br/>to student email"| MAIL
    UI --> DEL
    DEL -->|"delete student-owned rows"| DB
    classDef person fill:#FDECEC,stroke:#C53030,color:#1A202C
    classDef ui fill:#E8F1FB,stroke:#2B6CB0,color:#1A202C
    classDef svc fill:#EDF7ED,stroke:#2F855A,color:#1A202C
    classDef ai fill:#F3EEFB,stroke:#6B46C1,color:#1A202C
    classDef data fill:#FFF8E6,stroke:#B7791F,color:#1A202C
    classDef ext fill:#F4F4F5,stroke:#71717A,color:#1A202C,stroke-dasharray:4 3
    class S person
    class CS,UI ui
    class RH,DEL svc
    class DB data
    class NA ext
    class LLM ai
    class SP,MAIL ext
```

MVP measures:
- **Demo personas only.** The demo and the judges' build contain no real student data.
- **Consent screen** before first use, with an English notice. A Malay notice is a stretch goal.
- **Delete-my-data** (Must) removes all student-owned rows. A JSON export for portability is a Could (C4 in [01 §7](01-prd.md#7-features-moscow)).
- **Minimal emails.** Booking status emails carry the status, the slot and a link to the app. Gap skills, feedback and interview answers never go into an email. The email provider receives the student's email address, so it is a data processor like Supabase and the LLM API.
- **No audio storage.** Typed or transcribed text is the only thing saved. Speech is opt-in, with a note that Chrome sends audio to a web service for recognition.
- **Row-level security** is on for every student-owned table:
  - Students can access only rows where `student_id = auth.uid()`.
  - Advisers get read-only access to rows of their assigned students. The one exception is `booking`: an adviser can change `status` and `cancel_reason` on bookings addressed to them, and nothing else.
  - Reference tables (`esco_*`, `masco_occupation`, `crosswalk`, `occupation_skill`) are read-only.
- **Secrets.** LLM and service-role keys live only in Vercel and Supabase environment variables, server-side. Only `NEXT_PUBLIC_*` values reach the browser. `.env.local` is git-ignored, and `.env.example` lists the names.
- **Cross-border.** Supabase, the LLM APIs, Chrome speech and, depending on the provider chosen, the email provider all process data outside Malaysia. We prefer a Singapore Supabase region and record the transfer basis before any pilot.

## 10. Accessibility and responsiveness

We aim for WCAG 2.2 AA and treat it as a goal, not a claim, until it has been audited.
- **Layout.** Mobile-first Tailwind layouts, checked at 375 px and desktop widths. The app is installable as a PWA via Serwist.
- **Keyboard.** Every flow works by keyboard, with a visible focus ring and logical tab order.
- **Labels.** Every input has a label. Errors are given in text, not by colour alone.
- **Radar chart.** It has a data-table alternative and an `aria-label` summary. Match cards carry the same information in text.
- **Interview.** It is text-first. Speech is feature-detected (`SpeechRecognition || webkitSpeechRecognition`) and hidden when unsupported.
- **Motion.** Animations respect `prefers-reduced-motion`.

## 11. Deployment

**Figure 3.16 — Deployment.** One GitHub repo feeds Vercel previews and production; the pipeline runs from a developer machine against the same Supabase free-plan project.

```mermaid
flowchart LR
    accTitle: Deployment
    accDescr: A developer machine holds the repo with a git-ignored .env.local and runs the Python pipeline. Pushes go to GitHub; pull requests create Vercel preview deployments and main deploys to production. Vercel holds server-only secrets and NEXT_PUBLIC values as environment variables. Production and the pipeline call the Supabase free-plan project and the OpenAI API. Production and Supabase Auth send email through an SMTP provider. The Supabase project pauses after one week of inactivity.
    subgraph DEV["Developer machine"]
        REPO[(".env.local<br/>git-ignored")]
        PIPE["Python pipeline<br/>run.py, eval.py"]
    end
    GH["GitHub repo"]
    subgraph VER["Vercel"]
        PRE["Preview deployment<br/>per pull request"]
        PROD["Production<br/>from main"]
        ENV[("Environment variables<br/>server-only secrets,<br/>NEXT_PUBLIC_* values")]
    end
    subgraph SUP["Supabase free plan project"]
        PG[("Postgres + pgvector")]
        AUTH["Auth"]
        STO[("Storage")]
    end
    OAI["OpenAI API"]
    MAIL["Email provider (SMTP)"]
    PAUSE["Pauses after 1 week<br/>of inactivity"]
    DEV -->|"git push"| GH
    GH -->|"pull request"| PRE
    GH -->|"merge to main"| PROD
    ENV -.- PROD
    PROD -->|HTTPS| PG
    PROD --> AUTH
    PROD --> STO
    PROD -->|HTTPS| OAI
    PROD -->|SMTP| MAIL
    AUTH -->|SMTP| MAIL
    PIPE -->|"migrate, upsert, seed"| PG
    PIPE -->|HTTPS| OAI
    PG -.- PAUSE
    classDef person fill:#FDECEC,stroke:#C53030,color:#1A202C
    classDef ui fill:#E8F1FB,stroke:#2B6CB0,color:#1A202C
    classDef svc fill:#EDF7ED,stroke:#2F855A,color:#1A202C
    classDef ai fill:#F3EEFB,stroke:#6B46C1,color:#1A202C
    classDef data fill:#FFF8E6,stroke:#B7791F,color:#1A202C
    classDef ext fill:#F4F4F5,stroke:#71717A,color:#1A202C,stroke-dasharray:4 3
    class PIPE,PRE,PROD svc
    class REPO,ENV,PG,STO data
    class GH,AUTH,PAUSE,MAIL ext
    class OAI ai
```

- **Vercel** hosts the Next.js app. Each pull request gets a preview deployment, and `main` deploys to production.
- **Supabase free plan:**
  - Limits: 500 MB database, 1 GB storage, 5 GB egress, 50,000 MAU, 2 active projects.
  - Projects pause after 1 week of inactivity. Keep the project active while the demo build must be reachable, or upgrade (Pro is $25/month).
  - pgvector uses HNSW indexes.
- **Setup order** (same as the [README Quick start](../README.md#10-quick-start)):
  1. `pnpm install`
  2. `supabase link` + `pnpm db:migrate` (applies `supabase/migrations`)
  3. `python pipeline/run.py`: loads the ESCO subset (English CSV), the eMASCO occupations ([02 §6](02-methodology.md#6-match-score)) and the GMI outcomes. It builds `crosswalk` and `occupation_skill`, then extracts and embeds outcome skills into `outcome_skill` (from cache where present).
  4. `pnpm db:seed` (`supabase/seed/`): demo personas (Aina + 4), one adviser, lessons and recall items. It needs the pipeline output.
  5. `pnpm dev`

  Steps 3 and 4 upsert, so they are safe to re-run.
- **Environment variables** (planned names):

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Anon key (RLS applies) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server, pipeline only | Seed and pipeline writes |
| `DATA_MODE` | Server | `fixtures` (demo default: reads `content/`, no database) or `supabase` ([11 §5](11-repo-structure.md#5-demo-mode-and-real-mode)) |
| `LLM_PROVIDER` | Server | `openai`, `anthropic`, `gemini`, or `recorded` (demo default: replays `content/llm/`) |
| `LLM_MODEL` | Server | Model id for the adapter |
| `LLM_API_KEY` | Server | Key for the chosen provider |
| `EMBEDDING_API_KEY` | Pipeline | Embedding provider key; same value as `LLM_API_KEY` when both are OpenAI |
| `MASTERY_PASS_MARK` | Server | Share of mastery-check answers needed to pass, default `0.8` (4 of 5) |
| `SMTP_URL` | Server | SMTP connection for booking status emails; Supabase Auth's custom SMTP is set in the Supabase dashboard |
| `MATCH_CONFIDENCE_THRESHOLD` | Server | τ, default `0.6` until tuned on the dev split ([02 §8](02-methodology.md#8-evaluation-plan)) |

## 12. Testing

Commands: `pnpm test` (unit), `pnpm test:e2e` (Playwright), `python pipeline/eval.py` (matcher P/R/F1).
- **Unit tests (Vitest; Assumption):**
  - Match-score function: the toy example from [02 §6](02-methodology.md#6-match-score) must give 70%. Also test the τ boundary, an occupation with no optional skills, and empty coverage.
  - FSRS wrapper around ts-fsrs: a new card gets a due date, a rating of "Again" brings the next review sooner than "Good", and weak interview areas create cards.
  - Mastery-check marking against the answer key / keyword rubric, with no LLM call. 4 of 5 passes and 3 of 5 fails.
  - Booking transitions: only the adviser can complete; an adviser cancel without a reason is rejected; a failed email still saves the status.
- **Pipeline tests (pytest):**
  - The quote substring check accepts or rejects as expected.
  - Out-of-options URIs are rejected.
  - Crosswalk rows carry `method` and `confidence`.
- **Evaluation script.** `pipeline/eval.py` computes P/R/F1 against the hand-tagged gold set, tunes τ on the dev split and prints error categories ([02 §8](02-methodology.md#8-evaluation-plan)).
- **Playwright end-to-end tests** run with a seeded persona and the LLM adapter in fixture mode (recorded responses):
  - (1) Map shows ranked cards with quotes.
  - (2) Plan saves confidence ratings.
  - (3) Practice serves a recall item and a hint with no answer.
  - (4) An interview turn returns task-level feedback.
  - (5) An LLM failure shows "needs adviser".

## 13. Repository structure

The full tree, import rules, naming and ownership are in [11-repo-structure.md](11-repo-structure.md). Summary:

```text
/app                  Next.js App Router routes and layouts only
/features             One folder per stage (map, matches, plan, practice, interview, feedback, booking, adviser): UI + server actions
/components/ui        Shared building blocks (button, field, radio scale, drawer, status chip…)
/lib                  Pure logic: Occupation Matcher, Gap Planner, FSRS wrapper, mastery marking, booking transitions
/server               Server-only: data store (fixtures or Supabase), LLM adapter, engines, email
/content              Demo personas, lessons, mastery questions, interview script, recorded LLM responses
/pipeline             Python: run.py (ingest, extract, normalise, crosswalk, embed), eval.py, prompts/, cache/
/supabase/migrations  SQL schema, RLS policies, pgvector indexes
/supabase/seed        seed.ts loads content/ into the database (pnpm db:seed)
/docs                 01–11 planning and technical docs
/tests                unit/, pipeline/, e2e/ (Playwright + axe)
```

## 14. Scalability and future work

- **More programmes.** Each programme costs data entry plus about 25 hand-tagged outcomes, following [02 §10](02-methodology.md#10-how-to-add-a-new-programme). The runtime does not change.
- **Storage.** About 14k ESCO skills and 3k occupations (ESCO v1.2, launch deck) with embeddings is about 70–100 MB including the HNSW index (our estimate, not measured). It fits the 500 MB free database. Switch to `halfvec` if space gets tight.
- **Cost control.** Most LLM work is offline and cached. Runtime calls are limited to hints, interview turns and feedback.
- **Future work:**
  - NOSS ingestion, once a software or IT NOSS code is confirmed.
  - Malay UI strings, plus Malay matching after testing.
  - A periodic demand-data refresh.
  - Institution and adviser accounts at scale.
  - Other ISCO-based countries in Southeast Asia.

## 15. Open questions

- Supabase region availability (Singapore) on the free plan.
