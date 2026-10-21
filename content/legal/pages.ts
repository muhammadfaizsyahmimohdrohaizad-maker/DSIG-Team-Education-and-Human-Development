// Legal and confidentiality pages. Every page is a draft for legal review and must be checked by a
// lawyer before any real pilot. Facts about providers and licences were checked on 21 Oct 2026.
// Facts come from docs/03-architecture.md §9, docs/07-pitch.md §6–7 and docs/02-methodology.md.

export type LegalBlock = { heading?: string; text?: string[]; list?: string[] };
export type LegalPage = { slug: string; title: string; short: string; summary: string; blocks: LegalBlock[] };

export const LEGAL_PAGES: LegalPage[] = [
  {
    slug: "privacy",
    title: "Privacy notice",
    short: "Privacy",
    summary: "What CareerPrep collects, why, how long it keeps it, and your rights under Malaysia's Personal Data Protection Act 2010 (as amended in 2024).",
    blocks: [
      {
        heading: "Who we are",
        text: [
          "CareerPrep is run by the CareerPrep team (\"we\"), a group of students at the German-Malaysian Institute (GMI), Jalan Ilmiah, Taman Universiti, 43000 Kajang, Selangor. We are a student project, not a registered company. If CareerPrep is piloted with an institution, the institution may also be responsible for your data; the pilot agreement will say who does what.",
          "Data protection contact: Muhammad Faiz Syahmi, team lead, muhammadfaizsyahmi.mohdrohaizad@student.gmi.edu.my.",
        ],
      },
      {
        heading: "What we collect",
        list: [
          "Account details: your name, email address and semester.",
          "What you enter: the modules you tick, your target occupation, your 1 to 5 confidence ratings, your practice and mastery-check results, and the text of your interview answers.",
          "What we work out from it: skill matches, gap skills, review dates and AI-written feedback.",
          "Bookings: the time you pick, your optional note, and status changes.",
          "Your consent choices, with the date and the version of this notice.",
          "We never store audio. If you use dictation in Chrome, your browser sends the sound to its maker to turn it into text; we only receive the text.",
        ],
      },
      {
        heading: "Why we use it",
        list: [
          "To show which occupations your modules point to and which skills you are missing.",
          "To schedule your practice and mark your mastery checks.",
          "To write hints and interview feedback, only if you allow AI processing.",
          "To let your career adviser prepare for a session, only if you allow adviser visibility or send a booking.",
          "To email you about booking changes, only if you allow booking emails. Those emails carry the status, the time and a link, nothing else.",
          "To give your institution anonymous totals. Groups smaller than 5 students are never shown.",
        ],
      },
      {
        heading: "Where it goes",
        text: [
          "Our service providers process data for us under contract. Some of them are outside Malaysia. The list is on the page \"Who processes your data\". We do not send student data to any AI service tier that trains on it, and we do not sell data.",
        ],
      },
      {
        heading: "How long we keep it",
        text: [
          "We keep your data while your account is open. If you do not sign in for 12 months, we delete your account. When you delete your account, we delete your data straight away, including your consent records. Any backups held by our database host are overwritten within 7 days.",
        ],
      },
      {
        heading: "Your rights",
        list: [
          "Access: see everything we hold. Settings → Export my data gives you a full copy.",
          "Correction: change your name, modules, target and ratings at any time in the app, or ask us.",
          "Deletion: Settings → Delete my data removes your account and every record linked to it.",
          "Portability: the export is a machine-readable JSON file you can take elsewhere.",
          "Withdrawing consent: change your choices in Settings at any time. Withdrawing does not affect what was done before.",
          "Complaints: contact our DPO first. You can also complain to the Personal Data Protection Commissioner of Malaysia.",
        ],
      },
      {
        heading: "If something goes wrong",
        text: [
          "If a personal data breach happens, we will notify the Personal Data Protection Commissioner within 72 hours of becoming aware of it, and notify affected people within 7 days after that where significant harm is likely.",
        ],
      },
      {
        heading: "Children",
        text: ["If you are under 18, a parent or guardian must agree to your consent choices before you use CareerPrep."],
      },
    ],
  },
  {
    slug: "processors",
    title: "Who processes your data",
    short: "Processors",
    summary: "The outside services that handle personal data for CareerPrep, what they receive, and where.",
    blocks: [
      {
        text: [
          "Each of these acts on our instructions under a data processing agreement. Several are based outside Malaysia, so your data may be transferred abroad. We prefer providers' Singapore regions where offered, and we record the legal basis for each transfer before any pilot.",
        ],
      },
      {
        heading: "Language-model provider",
        list: [
          "Provider: Google LLC, through the Gemini API.",
          "Receives: the lesson question and model answer (for hints), and the text of your interview answer (for feedback). Only if you allow AI processing.",
          "Location: Google's data centres, which may be outside Malaysia. We use a paid (billing-enabled) API key, because Google may use data sent through its free tier to improve its products; under the paid terms it does not."
        ],
      },
      {
        heading: "Database and sign-in",
        list: ["Provider: Supabase, Inc.", "Receives: everything listed in the privacy notice.", "Location: Singapore (ap-southeast-1)."],
      },
      {
        heading: "Hosting",
        list: ["Provider: Vercel Inc. (planned; during development the app runs on a team member's computer).", "Receives: requests as they pass through the app; short-lived server logs.", "Location: Vercel's Singapore region (sin1)."],
      },
      {
        heading: "Email",
        list: [
          "Provider: Resend, Inc. (used only once booking emails are switched on).",
          "Receives: your email address, and the status, time and link of a booking change. Only if you allow booking emails.",
          "Location: United States.",
        ],
      },
      {
        heading: "Your browser's dictation (not ours)",
        text: ["If you use dictation in Chrome, Google processes the sound under its own terms. CareerPrep never receives or stores audio."],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of use",
    short: "Terms",
    summary: "The rules for using CareerPrep.",
    blocks: [
      {
        heading: "What CareerPrep is",
        text: [
          "CareerPrep is a study and guidance tool. It is not career, legal or employment advice, and it does not promise a job, an interview or any outcome. Talk to a career adviser before making decisions about your studies or career.",
          "Students use CareerPrep free. Institutions that run it pay a licence under a separate agreement.",
        ],
      },
      {
        heading: "Your account",
        list: [
          "Give your real name and an email address you control. One account per person.",
          "Keep your password private. Tell us at muhammadfaizsyahmi.mohdrohaizad@student.gmi.edu.my if you think someone else has used your account.",
          "You can delete your account at any time in Settings.",
        ],
      },
      {
        heading: "Acceptable use",
        list: [
          "Only enter your own information. Do not enter other people's personal data in notes or answers.",
          "Do not try to see other users' data, get around the access rules, or overload the service.",
          "Do not use the AI features to generate content unrelated to your studies, or to produce anything unlawful or abusive.",
          "Staff accounts are for guidance work only and are covered by the staff confidentiality undertaking.",
        ],
      },
      {
        heading: "AI-written content",
        text: ["Hints and feedback are written by AI and can be wrong. See \"How AI is used\" for the limits."],
      },
      {
        heading: "Data sources",
        text: ["Occupation and skill data come from third parties; see \"Data sources and accessibility\"."],
      },
      {
        heading: "Changes and contact",
        text: [
          "We may change these terms; we will tell you in the app before a change takes effect. Governing law: Malaysia. Contact: muhammadfaizsyahmi.mohdrohaizad@student.gmi.edu.my.",
        ],
      },
    ],
  },
  {
    slug: "ai",
    title: "How AI is used, and its limits",
    short: "AI use",
    summary: "Where CareerPrep uses a language model, how its output is checked, and what it cannot do.",
    blocks: [
      {
        heading: "Where AI is used",
        list: [
          "Hints in lessons: three steps (a nudge, the idea behind the answer, an everyday analogy). Code rejects any hint that copies the answer, and the model answer only appears after you submit.",
          "Interview feedback: structure (STAR), evidence, technical accuracy and one next step. No grade and no praise or criticism of you as a person.",
          "Building the skill map (done in advance, not while you use the app): every skill must quote the sentence from your course outline it came from, and code checks the quote word for word.",
        ],
      },
      {
        heading: "Where AI is not used",
        list: [
          "Mastery checks run with AI switched off and are marked against a fixed answer key in code. Only a mastery check can mark a skill as mastered.",
          "Match scores are a fixed formula in code. Links below 0.6 confidence do not count and are marked \"check with adviser\".",
        ],
      },
      {
        heading: "How it is checked",
        text: [
          "Each AI step is a single call whose output must fit a fixed format, followed by code checks. If the output is missing or fails a check, you get a vetted fixed hint instead, or your answer is marked \"needs adviser\" so a person can look at it.",
        ],
      },
      {
        heading: "Limits",
        list: [
          "AI output can be wrong. Treat it as a starting point and check with an adviser.",
          "One programme only: the GMI Diploma in Software Engineering. Learning outcomes were entered from our own course outlines.",
          "Nine occupations only. The MASCO-to-ESCO crosswalk is our own; no official machine-readable version exists.",
          "English only. ESCO has no Malay version.",
          "No outcome data yet: we can show the system works as designed, not that it improves employment. That needs a pilot.",
          "No live job-market data.",
        ],
      },
    ],
  },
  {
    slug: "staff-undertaking",
    title: "Staff confidentiality undertaking",
    short: "Staff undertaking",
    summary: "What advisers and institution staff agree to before they can see any student data.",
    blocks: [
      {
        text: [
          "Before your dashboard opens, you agree to the following. Your acceptance is recorded with the date and the version of this undertaking.",
        ],
      },
      {
        heading: "I agree that I will",
        list: [
          "Use student data in CareerPrep only to give career guidance to the students assigned to me, or (for institution staff) to plan services from anonymous totals.",
          "Not copy, download, photograph, forward or share student data outside CareerPrep, except as my institution's policy for guidance records allows.",
          "Not try to identify students from anonymous totals.",
          "Not change or delete student data. My only actions are on bookings.",
          "Give a reason whenever I cancel an accepted session; the student sees it.",
          "Report any suspected data breach to muhammadfaizsyahmi.mohdrohaizad@student.gmi.edu.my straight away, so the 72-hour notice to the Commissioner can be met.",
          "Stop using CareerPrep and tell muhammadfaizsyahmi.mohdrohaizad@student.gmi.edu.my when I leave my role.",
        ],
      },
      {
        heading: "Duration",
        text: ["These duties continue after my access ends. Breach may lead to removal of access and action under my institution's staff rules."],
      },
    ],
  },
  {
    slug: "pilot",
    title: "Pilot partner confidentiality and data sharing",
    short: "Pilot partners",
    summary: "A summary for institutions of who holds which data during a pilot, and what each side keeps confidential.",
    blocks: [
      {
        heading: "Roles",
        text: [
          "The partner institution decides to use CareerPrep for its students. The CareerPrep team operates CareerPrep and processes student data on the institution's instructions. No pilot agreement is signed yet; when one is, its full terms apply and this page summarises them.",
        ],
      },
      {
        heading: "What is shared",
        list: [
          "The institution may share programme information (module names and course outlines) so the skill map can be built.",
          "Students' own data comes from the students, with their consent. The institution does not upload student records.",
          "The institution sees anonymous totals only: coverage by target occupation and the most common gap skills, with any group under 5 students hidden. Advisers see their own students' progress only where the student allows it.",
        ],
      },
      {
        heading: "Confidentiality",
        list: [
          "Both sides keep the other's non-public information confidential and use it only for the pilot.",
          "Pilot results are published only in anonymous form, and only with both sides' agreement.",
          "When the pilot ends, student accounts are deleted within 30 days unless a student chooses to keep using CareerPrep. Students can export their data first."
        ],
      },
      {
        heading: "Security and breaches",
        text: [
          "Data is protected by row-level access rules in the database, so each student reaches only their own records. Either side tells the other of a suspected breach within 24 hours, so the 72-hour notice to the Commissioner can be met.",
        ],
      },
    ],
  },
  {
    slug: "sources",
    title: "Data sources and attribution",
    short: "Data sources",
    summary: "Where CareerPrep's occupation and skill data come from.",
    blocks: [
      {
        heading: "MASCO 2020 and eMASCO",
        text: [
          "Occupation codes, titles (in Malay) and task lists come from the Malaysia Standard Classification of Occupations 2020 (MASCO 2020), published by the Ministry of Human Resources (Kementerian Sumber Manusia, KESUMA) on the eMASCO portal, emasco.mohr.gov.my. Content © Kementerian Sumber Manusia. English titles and the interview questions built from each task are our own.",
          "The portal's terms say its content may not be altered, copied or distributed for commercial purposes without the Ministry's permission. CareerPrep uses it non-commercially as a student project. Before any paid institutional use, we will ask the Ministry for permission (masco@mohr.gov.my).",
        ],
      },
      {
        heading: "ESCO",
        text: [
          "Skill names and occupation-skill relations come from ESCO (European Skills, Competences, Qualifications and Occupations), version 1.2.1, © European Union. The European Commission's reuse policy (Commission Decision 2011/833/EU) lets anyone reuse its content, which it licenses under Creative Commons Attribution 4.0 (CC BY 4.0), as long as the source is credited and changes are marked. We use a subset of ESCO and link it to MASCO ourselves. CareerPrep is not endorsed by the European Commission.",
        ],
      },
      {
        heading: "Our own work",
        text: [
          "The MASCO-to-ESCO crosswalk for the nine occupations and the module learning outcomes for the GMI Diploma in Software Engineering were prepared by the CareerPrep team. They are not official.",
        ],
      },
    ],
  },
  {
    slug: "accessibility",
    title: "Accessibility statement",
    short: "Accessibility",
    summary: "How we try to make CareerPrep work for everyone, and what we have not checked yet.",
    blocks: [
      {
        heading: "Our aim",
        text: [
          "We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. This is a goal, not a claim: CareerPrep has not been independently audited.",
        ],
      },
      {
        heading: "What we have done",
        list: [
          "Every task works with a keyboard, with a visible focus outline.",
          "Body text is 16px, buttons and links are at least 44px tall, and text contrast is at least 4.5:1.",
          "Meaning is never shown by colour alone; statuses carry words and an icon.",
          "The skills radar chart has a table with the same numbers.",
          "Animations stop when your device asks for reduced motion.",
          "The interview is text-first; there is no timer anywhere.",
        ],
      },
      {
        heading: "Known gaps",
        list: [
          "We have tested with automated checks and keyboard only, not yet with screen-reader users.",
          "The app is in English only for now.",
        ],
      },
      {
        heading: "Tell us",
        text: ["If something doesn't work for you, email muhammadfaizsyahmi.mohdrohaizad@student.gmi.edu.my. We aim to reply within 5 working days."],
      },
    ],
  },
];

export function legalPage(slug: string): LegalPage | undefined {
  return LEGAL_PAGES.find((p) => p.slug === slug);
}
