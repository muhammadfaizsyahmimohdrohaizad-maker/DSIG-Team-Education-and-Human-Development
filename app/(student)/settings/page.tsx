import type { Metadata } from "next";
import Link from "next/link";
import { btn } from "@/components/ui/button";
import { ConsentForm } from "@/features/onboarding/consent-form";
import { getStore } from "@/server/data";
import type { Consent } from "@/lib/types";

export const metadata: Metadata = { title: "Settings and my data" };

const yesNo = (v: boolean) => (v ? "Yes" : "No");
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function Choices({ c }: { c: Consent }) {
  return (
    <dl className="stat-row">
      <div className="stat"><dt className="secondary muted">Store and use my data</dt><dd>{yesNo(c.processing)}</dd></div>
      <div className="stat"><dt className="secondary muted">AI hints and feedback</dt><dd>{yesNo(c.aiProcessing)}</dd></div>
      <div className="stat"><dt className="secondary muted">Booking emails</dt><dd>{yesNo(c.bookingEmails)}</dd></div>
      <div className="stat"><dt className="secondary muted">Adviser sees my progress</dt><dd>{yesNo(c.adviserVisibility)}</dd></div>
    </dl>
  );
}

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function SettingsPage({ searchParams }: Props) {
  const { saved } = await searchParams;
  const store = getStore();
  const [student, history] = await Promise.all([store.getStudent(), store.listConsents()]);
  const current = history[0] ?? null;

  return (
    <div className="stack-lg">
      <div className="page-head">
        <h1>Settings and my data</h1>
        <p>
          Signed in as {student.name}
          {student.email ? ` (${student.email})` : ""}. You can change your choices, take a copy of everything, or delete it all.
        </p>
      </div>
      {saved ? <p className="notice notice-ok" role="status">Your choices are saved. They apply from now on.</p> : null}

      <section className="card stack" aria-labelledby="record-title">
        <h2 id="record-title">Your consent record</h2>
        {current ? (
          <>
            <p className="secondary muted">
              Current since {when(current.createdAt)}, notice version {current.noticeVersion}
              {current.under18 ? ", under 18 with a parent or guardian's agreement" : ""}.
            </p>
            <Choices c={current} />
            {history.length > 1 ? (
              <details className="disclosure">
                <summary>Earlier choices ({history.length - 1})</summary>
                <ul className="stack">
                  {history.slice(1).map((c) => (
                    <li key={c.createdAt} className="stack-sm">
                      <p className="secondary muted">{when(c.createdAt)} · notice {c.noticeVersion}</p>
                      <Choices c={c} />
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </>
        ) : (
          <p>No consent recorded yet.</p>
        )}
      </section>

      <section className="card stack" aria-labelledby="change-title">
        <h2 id="change-title">Change your choices</h2>
        <ConsentForm initial={current} from="settings" />
      </section>

      <section className="card stack" aria-labelledby="export-title">
        <h2 id="export-title">Export my data</h2>
        <p className="prose">
          A JSON file with everything we store about you: profile, consent record, modules, ratings, practice, answers, feedback
          and bookings. You can open it in any text editor or take it to another service.
        </p>
        <div>
          <a href="/settings/export" className={btn("secondary")} download>
            Download my data
          </a>
        </div>
      </section>

      <section className="card stack" aria-labelledby="delete-title">
        <h2 id="delete-title">Delete my data</h2>
        <p className="prose">Removes your account and everything linked to it. You will be asked to confirm.</p>
        <div>
          <Link href="/delete-my-data" className={btn("secondary")}>
            Delete my data
          </Link>
        </div>
      </section>
    </div>
  );
}
