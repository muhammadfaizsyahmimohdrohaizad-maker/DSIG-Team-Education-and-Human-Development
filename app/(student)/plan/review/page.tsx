import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, ErrorState } from "@/components/ui";
import { getDueCards } from "@/features/review/actions";
import { ReviewSession } from "@/features/review/review-session";

export const metadata: Metadata = { title: "Review" };

// Review board (Review.dc.html, Phone-Review.dc.html). Reads the student's real cards due today.
export default async function ReviewPage() {
  const due = await getDueCards();
  return (
    <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
      <Link href="/plan" className="inline-flex min-h-11 items-center self-start font-semibold">Back to my plan</Link>
      {due.ok ? (
        <ReviewSession cards={due.value.cards} nextDue={due.value.nextDue} />
      ) : (
        <ErrorState title="Your review cards didn't load." actions={<ButtonLink href="/plan/review">Try again</ButtonLink>}>
          {due.error.message} Reference {due.error.ref}.
        </ErrorState>
      )}
    </main>
  );
}
