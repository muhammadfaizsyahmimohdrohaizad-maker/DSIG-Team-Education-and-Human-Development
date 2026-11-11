import Link from "next/link";
import { ChevronLeftIcon } from "./ui/icons";

// Header for signed-out pages. "account": Log in and Sign up (homepage, privacy notice).
// "back": a way home from the sign-in and sign-up pages. "plain": the wordmark only (parent consent).
export function PublicHeader({ variant }: { variant: "account" | "back" | "plain" }) {
  return (
    <header className="border-b border-hairline bg-white">
      <div className="mx-auto flex max-w-[1328px] items-center justify-between gap-3 px-4 py-3 tablet:px-6">
        <Link href="/" className="inline-flex min-h-11 items-center font-display text-xl font-bold tracking-[-0.02em] text-navy no-underline hover:text-navy">
          CareerPrep
        </Link>
        {variant === "account" ? (
          <nav aria-label="Account" className="flex items-center gap-2">
            <Link href="/sign-in" className="inline-flex min-h-11 items-center rounded-field px-3.5 text-[15px] font-semibold text-navy no-underline hover:bg-cream hover:text-navy">Log in</Link>
            <Link href="/sign-up" className="inline-flex min-h-11 items-center rounded-field bg-maroon px-[18px] text-[15px] font-bold text-white no-underline hover:bg-maroon-dark hover:text-white">Sign up</Link>
          </nav>
        ) : null}
        {variant === "back" ? (
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-field px-3 text-[15px] font-semibold text-navy no-underline hover:bg-cream hover:text-navy">
            <ChevronLeftIcon size={18} />
            Back to home
          </Link>
        ) : null}
      </div>
    </header>
  );
}
