import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, ErrorState } from "@/components/ui";
import { getImportSetup } from "@/features/review/actions";
import { NotesImport } from "@/features/review/notes-import";

export const metadata: Metadata = { title: "Make review cards from your notes" };

// Notes to review cards board (NotesImport.dc.html).
export default async function NotesImportPage() {
  const setup = await getImportSetup();
  return (
    <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
      <Link href="/plan/review" className="inline-flex min-h-11 items-center self-start font-semibold">Back to review</Link>
      <div className="flex max-w-3xl flex-col gap-2">
        <h1 className="m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-tight">Make review cards from your notes</h1>
        <p className="m-0">Add your own lecture or lesson notes. CareerPrep turns them into question-and-answer cards that come back in your reviews.</p>
      </div>
      {setup.ok ? (
        <NotesImport ai={setup.value.ai} />
      ) : (
        <ErrorState title="This page didn't load." actions={<ButtonLink href="/plan/review/import">Try again</ButtonLink>}>
          {setup.error.message} Reference {setup.error.ref}.
        </ErrorState>
      )}
    </main>
  );
}
