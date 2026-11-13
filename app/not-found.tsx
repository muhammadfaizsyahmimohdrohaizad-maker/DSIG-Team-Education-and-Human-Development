import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = { title: "Page not found" };

// Shown for any address that doesn't exist. It renders inside the root layout only, so it brings its own
// header, <main id="main"> for the skip link, and footer.
export default function NotFound() {
  return (
    <>
      <PublicHeader variant="plain" />
      <main id="main" className="mx-auto flex w-full max-w-[860px] flex-1 flex-col gap-4 px-4 pb-16 pt-10 tablet:px-6 tablet:pt-16">
        <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.08em] text-maroon">Error 404</p>
        <h1 className="m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]">We couldn&apos;t find that page</h1>
        <p className="m-0 max-w-[40rem]">The link may be old, or the address may have a typo. Your account and your data are not affected.</p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/">Go to the homepage</ButtonLink>
          <ButtonLink href="/dashboard" variant="outline">Open my dashboard</ButtonLink>
        </div>
      </main>
      <SiteFooter variant="public" />
    </>
  );
}
