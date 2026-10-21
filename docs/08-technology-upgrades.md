# 08. Technology upgrades

| | |
|---|---|
| Document | 08-technology-upgrades.md |
| Version | 0.2 (draft for preliminary-round submission) |
| Status | Draft |
| Related | [03-architecture.md](03-architecture.md), [04-business-and-risk.md](04-business-and-risk.md), [07-pitch.md](07-pitch.md) |

**Contents:** [1. Purpose and scope](#1-purpose-and-scope) · [2. Verdicts at a glance](#2-verdicts-at-a-glance) · [3. Adopt now](#3-adopt-now) · [4. Plan next](#4-plan-next) · [5. Target architecture](#5-target-architecture) · [6. Watch](#6-watch) · [7. Skip, and why](#7-skip-and-why) · [8. Open issues](#8-open-issues)

## 1. Purpose and scope

### 1.1 Purpose

We looked at the tools people most often suggest for a project like this: Llama and other open models, the LlamaIndex toolkit, Obsidian, Agent Skills, MCP, and a set of evaluation, speech, LMS and credential tools. This document records which ones would make CareerPrep better, which ones would not, and why. Terms such as MASCO, ESCO, PDPA and τ are defined in the [README glossary](../README.md#17-glossary). Facts were checked in October 2026 against the sources linked in each section.

### 1.2 How to read the verdicts

| Verdict | Meaning |
|---|---|
| **Adopt now** | Small, low-risk, and fits the prototype as it stands |
| **Plan next** | Worth doing after the prototype, once we have a pilot partner or a test set |
| **Watch** | Promising, but immature or gated by a partner; revisit when something changes |
| **Skip** | Adds dependencies or risk without fixing a problem we have |

One rule decided most verdicts: CareerPrep's AI steps are single model calls with a fixed output schema, each followed by a code check ([03 §5](03-architecture.md#5-ai-guardrails-design-requirements)). That design is the most auditable thing about the product. A tool that makes those steps easier to measure or check is a good fit. A tool that replaces them with an autonomous loop is not.

## 2. Verdicts at a glance

| Technology | Verdict | What it fixes |
|---|---|---|
| promptfoo evaluation in CI | Adopt now | Turns the hand-tagged gold set into accuracy numbers on every prompt or model change |
| Langfuse tracing (demo data only) | Adopt now | A record of prompt, version, latency and cost for every AI call |
| OpenAI moderation endpoint | Adopt now | Screens interview answers; a self-harm flag routes the student to a human |
| Markdown + JSON Canvas portfolio export | Adopt now | Students take their data with them; opens in Obsidian or any editor |
| OpenDOSM labour statistics | Adopt now | Employment context on occupation cards, labelled as context, not live jobs |
| Crosswalk kept in Postgres (ltree + pgvector) | Adopt now | No graph database needed for a four-step crosswalk |
| Agent Skill file for the dev team | Adopt now | Coding agents follow our conventions; not a product feature |
| SEA-LION v4.5 (self-hosted) | Plan next | Malay-capable open model for the offline pipeline |
| ILMU API | Plan next | A model option that keeps data in Malaysia |
| Malay–English embedding test | Plan next | Evidence on whether Malay outcomes match English ESCO skills |
| Server-side speech-to-text | Plan next | Voice answers in any browser, not only Chrome |
| Malaysian Whisper (Mesolitica) | Plan next | Better recognition of Malay and Manglish |
| Vercel AI SDK 6 as the adapter | Plan next | Cheap provider switching once there is more than one |
| LTI 1.3 integration with the LMS | Plan next | More programmes, rosters and gradebook passback |
| Open Badges 3.0 learning records | Plan next | A portable, verifiable record of a mastered skill |
| Read-only crosswalk MCP server | Plan next | Advisers' own AI assistants can query the crosswalk |
| Agent Skills pack for advisers | Plan next | Advisers apply our method in whichever assistant they use |
| LlamaParse, in-browser Whisper, Chrome on-device speech, hosted open-model APIs, Lightcast data, Neo4j, MyDigital ID | Watch | See [§6](#6-watch) |
| Llama 4, Llama Guard, LlamaIndex framework, agent frameworks, NeMo Guardrails, Obsidian as a shared store, Apache AGE, scraping job boards | Skip | See [§7](#7-skip-and-why) |

## 3. Adopt now

### 3.1 promptfoo: put a number on the matcher

The methodology already promises precision, recall and F1 on about 25 hand-tagged learning outcomes ([02 §8](02-methodology.md#8-evaluation-plan)). promptfoo runs those test cases from plain YAML in CI. Each case checks four things: the output matches the schema, the chosen skill is one of the options given, the correct skill is in the top k, and the quote appears word for word in the learning outcome. The result sits next to PERKESO's 2021 matching study (precision 59%, F1 64%), which we report alongside and do not claim to beat. OpenAI announced on 9 March 2026 that it would acquire Promptfoo and keep the open-source project going ([Yahoo Finance](https://finance.yahoo.com/news/openai-acquires-promptfoo-secure-ai-174904138.html)). Test cases are portable YAML, so the risk to us is low.

### 3.2 Langfuse: a trace for every AI call

Langfuse records the prompt, prompt version, latency and cost of each call. ClickHouse acquired it on 16 January 2026; the core stays MIT-licensed and self-hosting is unchanged ([ClickHouse](https://clickhouse.com/blog/clickhouse-acquires-langfuse-open-source-llm-observability)). The free Hobby tier covers 50,000 units a month ([Langfuse pricing](https://langfuse.com/pricing)). We would send only the seeded demo personas through it. A pilot with real students would self-host Langfuse or strip personal data first, because any trace store is another data processor under the PDPA.

### 3.3 Moderation, routed to a person

Students type interview answers while worried about jobs. OpenAI's `omni-moderation-latest` is free and covers self-harm, harassment, violence and other categories ([OpenAI](https://openai.com/index/upgrading-the-moderation-API-with-our-new-multimodal-moderation-model/)). We would not use it to block students. A self-harm flag replaces the feedback with a short supportive message and shows the "Talk to a human" button, which already exists. OpenAI does not list Malay among its tested languages, so we will test Malay and code-switched samples before claiming Malay coverage.

### 3.4 A portfolio the student owns

Obsidian has been free for commercial use since 20 February 2025, and its vaults are plain Markdown files ([Obsidian](https://obsidian.md/blog/free-for-work/)). Its canvas format, JSON Canvas, is an open MIT-licensed specification ([jsoncanvas.org](https://jsoncanvas.org/)). CareerPrep can export a zip with one note per target occupation, evidence notes quoting the student's own learning outcomes, interview feedback, and a `Career-map.canvas` linking jobs to skills. It is one server route over data we already store, with no Obsidian dependency; any text editor can read it. It also supports the PDPA data-portability right, in force since 1 June 2025 ([DFDL](https://www.dfdl.com/insights/legal-and-tax-updates/malaysia-implementation-of-the-personal-data-protection-amendment-act-2024/)). We present it as "your data in plain files", not as an Obsidian feature, because we do not know how many GMI students use Obsidian.

### 3.5 Labour context from OpenDOSM

OpenDOSM is the only documented, machine-readable source of Malaysian labour data we found: a REST API at `api.data.gov.my/opendosm` with Labour Force Survey datasets ([data.gov.my](https://developer.data.gov.my/static-api/opendosm)). The pipeline can pull it once and show employment context on each occupation card. It is probably available only at major-group level, not by 4-digit MASCO code; we have not confirmed this. MyFutureJobs has no public API, so occupation cards link out to it instead.

### 3.6 Keep the crosswalk in Postgres

MASCO → ISCO-08 → ESCO occupation → skill is a shallow, fixed-depth graph. Join tables, the `ltree` extension for code hierarchies and pgvector for matching cover it. Supabase does not offer Apache AGE anyway ([Supabase extensions](https://supabase.com/docs/guides/database/extensions)).

### 3.7 A skill file for our own coding agents

A `SKILL.md` in the repository can tell coding agents our rules: schemas first, quote verification, options-only re-ranking, no AI in mastery checks, every model call through the adapter. The Agent Skills format works across Claude Code, Codex, Copilot and Cursor ([agentskills.io](https://agentskills.io/home)). It helps the team stay consistent. We will not present it to judges as a product feature.

## 4. Plan next

### 4.1 Malay and data residency: SEA-LION and ILMU, not Llama

Malay quality and keeping data in Malaysia are the two objections institutions are most likely to raise. Two options address them.

- **SEA-LION v4.5 27B** from AI Singapore lists Malay, uses the MIT licence and supports a 262K-token context ([Hugging Face](https://huggingface.co/aisingapore/Qwen-SEA-LION-v4.5-27B-IT)). Run locally with Ollama, it can be forced to return JSON that matches our schema ([Ollama docs](https://docs.ollama.com/capabilities/structured-outputs)). It fits the offline pipeline, which runs in batches and has no latency limit. "Regional model" does not guarantee better Malay: the previous version scored 71.31 on a Malay benchmark against 71.20 for its base model ([MarkTechPost](https://www.marktechpost.com/2025/08/25/sea-lion-v4-multimodal-language-modeling-for-southeast-asia/)). It earns a place only if it passes the same promptfoo gold set as the OpenAI baseline.
- **ILMU**, from YTL AI Labs with Universiti Malaya, launched on 12 August 2025 as an API hosted in Malaysia ([YTL](https://www.ytlpowerinternational.com/press-releases/ytl-ai-labs-launches-ilmu-100-malaysian-ai-built-by-malaysians-for-malaysians/)). Since 1 April 2025, every transfer of personal data abroad, including to OpenAI, has to pass the PDPA's "substantially similar law" test. A Malaysian-hosted API avoids that. Prices and terms are not published, so this starts with an enquiry, including about education credits.

Both would sit behind the existing adapter as additional providers. Nothing else in the architecture changes.

### 4.2 Test Malay embeddings before switching

ESCO has no Malay labels, so the real test is a Malay learning outcome matched against English ESCO skills. A 2025 benchmark across ten Southeast Asian languages found that no single embedding model does well on all of them ([arXiv 2508.12243](https://arxiv.org/abs/2508.12243)). We would add a second pgvector column for an open model such as BGE-M3 and compare recall on about 100 hand-labelled Malay and English pairs.

### 4.3 Voice in any browser

Speech input today relies on Chrome, which sends the audio to a web service ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)). A server-side transcription route would work in Safari and Firefox too. A third-party listing prices gpt-4o-transcribe at about USD 0.006 per minute ([Opper](https://opper.ai/openai/gpt-4o-transcribe)); we have not confirmed this on OpenAI's own page. The harder question is legal: biometric data has been sensitive personal data under the PDPA since 1 April 2025, and a voice recording may count. Our design asks for explicit consent, stores only the transcript, and keeps text as the default. Mesolitica's Malaysian Whisper models ([Hugging Face](https://huggingface.co/mesolitica)) come after that, once we have consented GMI recordings to measure Malay and Manglish accuracy.

### 4.4 Integrations that need a partner

- **LTI 1.3.** Moodle, for example, supports LTI Advantage: secure launch, class rosters and gradebook passback ([Moodle Docs](https://docs.moodle.org/en/Publish_as_LTI_tool)). This is how CareerPrep would scale beyond one programme. We do not know which LMS GMI uses; the first step is asking GMI IT.
- **Open Badges 3.0.** A W3C Verifiable Credential that can carry an ESCO skill link and the mastery-check evidence ([1EdTech](https://www.1edtech.org/1edtech-article/new-open-badges-30-standard-provides-enhanced-security-and-mobility/411060)). It is an informal learning record. It is not an MQA micro-credential, and we will not call it one.
- **Vercel AI SDK 6.** Structured output with Zod schemas and a built-in "choose one of these options" mode that matches our re-ranker ([Vercel](https://vercel.com/blog/ai-sdk-6)). Worth adopting when a second provider arrives, not before.

### 4.5 MCP and Agent Skills: for advisers, not the runtime

MCP has been governed by the Linux Foundation's Agentic AI Foundation since 9 December 2025 ([Anthropic](https://anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)). A read-only MCP server over the public crosswalk would let an adviser ask their own assistant, "which MASCO jobs does this module support?". Student data would never go through it. An Agent Skills pack ("crosswalk method" and "interview rubric") would let advisers apply the same rules in Claude, ChatGPT or Copilot. Neither improves the student's experience directly, so both wait until the prototype is done.

## 5. Target architecture

**Figure 8.1 — CareerPrep with the recommended upgrades (C4 model, level 2).** Solid shapes are in the prototype or adopted now; dashed shapes are planned next. The upgrades attach at the edges, as new providers, exports and integrations. The core path from web app to API server to database does not change.

![C4 container diagram with upgrades. Inside the CareerPrep boundary: web app, API server, data pipeline, Postgres database, and a planned read-only crosswalk MCP server. The API server exports the portfolio to the student's notes app, sends traces to Langfuse, sends booking status emails through an email provider, prompts the OpenAI API and, planned, the Malaysian-hosted ILMU API, and receives planned LTI 1.3 launches from the institution LMS. The pipeline loads public reference data including OpenDOSM and, planned, runs extraction on a self-hosted SEA-LION model. Advisers' AI assistants query the MCP server.](diagrams/drawio/fig-8-1-target-containers.png)

*Source: [fig-8-1-target-containers.drawio](diagrams/drawio/fig-8-1-target-containers.drawio)*

## 6. Watch

| Technology | Why not yet |
|---|---|
| LlamaParse | A paid cloud PDF parser (free tier 10,000 credits a month) ([LlamaIndex](https://developers.llamaindex.ai/llamaparse/general/pricing/)). We type outcomes in by hand, and pdfplumber keeps the exact character positions our quote checks rely on. Revisit for scanned or table-heavy programme documents. |
| Chrome on-device speech | Keeps audio on the device, but is experimental, still Chrome-only, and Malay support is unknown ([MDN](https://developer.mozilla.org/docs/Web/API/SpeechRecognition/processLocally)). |
| In-browser Whisper | Runs offline with WebGPU, but is about ten times slower without it and weak on low-end phones ([LogRocket](https://blog.logrocket.com/how-to-build-a-real-time-voice-ai-agent-in-the-browser)). |
| Hosted open-model APIs | Cheap per token, but still a transfer abroad, like OpenAI. |
| Lightcast job postings, TalentCorp or PERKESO data | Live job data, but commercial or partnership-only. |
| Neo4j | Only useful if multi-step career-path recommendations become central. |
| MyDigital ID login | 12 million users, but we found no way for non-government apps to use it ([Malay Mail](https://www.malaymail.com/amp/news/malaysia/2026/05/03/mydigital-id-integration-with-myjpj-running-smoothly-since-may-1/218524)). |

## 7. Skip, and why

**Llama 4 as our model.** Scout and Maverick (released 5 April 2025) support twelve languages, including Indonesian and Thai, but not Malay. Scout needs an H100-class GPU even when quantised ([Hugging Face](https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct)). Meta's newest model, Muse Spark (8 April 2026), is closed, so the open Llama roadmap is uncertain ([NYU Shanghai RITS](https://rits.shanghai.nyu.edu/ai/meta-hasnt-given-up-on-open-source-muse-spark-launches-as-open-weight-plans-continue)). If we want an open model, SEA-LION is the better fit ([§4.1](#41-malay-and-data-residency-sea-lion-and-ilmu-not-llama)).

**Llama Guard 4.** Meta describes it as optimised for English ([Meta](https://dev.meta.ai/llama/docs/model-cards-and-prompt-formats/llama-guard-4)). It would not fix the Malay gap and duplicates the free moderation endpoint.

**The LlamaIndex framework.** Our retrieval is one pgvector query feeding one schema-checked call. A framework around that adds dependencies without adding capability.

**Agent frameworks** (LangGraph, OpenAI Agents SDK, agent loops). They would replace checked single steps with an autonomous loop, adding latency, cost and unpredictability. They would also remove the property judges can verify: every AI output is quoted, limited to given options and checked by code.

**NeMo Guardrails and Guardrails AI.** Our own checks (quote verification, options-only re-ranking, no-AI mastery checks) are specific to this domain and stronger than generic rules.

**Obsidian as a shared or adviser store.** Obsidian keeps files on one person's machine and has no multi-user access control or audit log; shared vaults need paid Sync at USD 4 per user a month ([Obsidian pricing](https://obsidian.md/pricing)). Adviser notes belong in Supabase with row-level security. Obsidian is where a student's exported data can end up, not where the institution's data lives.

**Apache AGE, Braintrust, Helicone, scraping job boards.** AGE is not available on Supabase. Braintrust and Helicone duplicate promptfoo and Langfuse. Scraping Jobstreet, Hiredly or MyFutureJobs breaks their terms.

## 8. Open issues

- Which LMS does GMI use, and would GMI IT support an LTI 1.3 trial?
- What are ILMU's prices, data terms and education credits?
- Does OpenDOSM publish labour data below MASCO major-group level?
- How well does the moderation endpoint handle Malay and code-switched text?
