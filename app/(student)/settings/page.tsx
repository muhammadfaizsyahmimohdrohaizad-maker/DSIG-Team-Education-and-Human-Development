import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink, Card, ErrorState, SoftPanel } from "@/components/ui";
import { listMyConsents } from "@/features/account/actions";
import { nameParts } from "@/features/account/header";
import { ConsentSwitches, DeleteAccount } from "@/features/account/settings-form";
import { getProfile } from "@/server/data/profiles";
import { getOccupations } from "@/server/data/reference";
import { currentUser } from "@/server/data/supabase";

export const metadata: Metadata = { title: "Settings and privacy" };

const pageTitle = "m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]";

// Settings and privacy board. The "Booking emails" switch is not shown: there is no action to change
// profiles.reminder_emails yet.
export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const [profile, consents, occupations] = await Promise.all([getProfile(user.id), listMyConsents(), getOccupations()]);
  if (!profile) redirect("/dashboard");
  const target = occupations.find((o) => o.code === profile.target)?.titleEn;
  const adviserSees = consents.ok && consents.value.current.adviser_visibility
    ? "Your target job and skill progress, plus what you tick for each booking."
    : "Only what you tick for each booking.";

  return (
    <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
      <div className="flex flex-col gap-1.5">
        <h1 className={pageTitle}>Settings and privacy</h1>
        <p className="m-0 max-w-[48rem]">See what CareerPrep keeps about you, who can see it, and change your choices at any time.</p>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          {consents.ok
            ? <ConsentSwitches current={consents.value.current} history={consents.value.history} isUnder18={profile.isUnder18} />
            : <ErrorState title="Your choices didn't load." actions={<ButtonLink href="/settings">Try again</ButtonLink>}>{consents.error.message}</ErrorState>}

          <Card as="section" aria-labelledby="who-h" gap="gap-3">
            <h2 id="who-h" className="m-0 text-[22px]">Who can see what</h2>
            <dl className="m-0 flex flex-col gap-2">
              <div><dt className="font-bold text-navy">You</dt><dd className="m-0">Everything on this account.</dd></div>
              <div><dt className="font-bold text-navy">Your adviser</dt><dd className="m-0">{adviserSees}</dd></div>
              <div><dt className="font-bold text-navy">GMI</dt><dd className="m-0">Group totals only, never your name. Groups smaller than 5 students are hidden.</dd></div>
            </dl>
          </Card>

          <Card as="section" aria-labelledby="data-h" gap="gap-3">
            <h2 id="data-h" className="m-0 text-[22px]">Your data</h2>
            <p className="m-0">We keep your data while your account is active and delete it 12 months after your last log-in. Download a copy at any time.</p>
            <div className="flex flex-wrap items-center gap-3">
              <a href="/careerprep/api/export" download className="inline-flex min-h-12 items-center rounded-button border border-navy bg-white px-[18px] font-semibold text-navy no-underline hover:bg-cream hover:text-navy">Download my data</a>
              <Link href="/privacy" className="inline-flex min-h-11 items-center">Read the Privacy Notice</Link>
            </div>
          </Card>

          <DeleteAccount fullName={profile.fullName} />
        </div>

        <SoftPanel as="aside" aria-labelledby="me-h" className="min-w-0 flex-[1_1_300px]" gap="gap-3">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-navy font-bold text-white">{nameParts(profile.fullName).initials}</span>
            <span className="flex min-w-0 flex-col">
              <b id="me-h" className="text-navy">{profile.fullName}</b>
              <span className="break-all text-sm">{user.email}</span>
            </span>
          </div>
          <dl className="m-0 flex flex-col gap-2 text-[15px]">
            <div><dt className="text-sm text-muted">Target job</dt><dd className="m-0 font-semibold text-navy">{target ?? "Not chosen yet"}</dd></div>
          </dl>
          <ButtonLink href="/about-you" variant="outline">Update my skills and projects</ButtonLink>
          <form action="/careerprep/auth/sign-out" method="post">
            <button type="submit" className="inline-flex min-h-11 items-center font-semibold text-maroon underline">Log out</button>
          </form>
        </SoftPanel>
      </div>
    </main>
  );
}
