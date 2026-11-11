import type { ReactNode } from "react";
import { SegmentedLinks } from "./ui";

// The Log in / Sign up card (Login board): a white card on cream, with the two pages as a segmented switch.
export function AuthCard({ current, title, intro, children, footer }: { current: "/sign-in" | "/sign-up"; title: string; intro: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main id="main" className="flex flex-1 items-start justify-center bg-cream px-4 pb-[72px] pt-8 tablet:pt-14">
      <section aria-labelledby="auth-title" className="flex w-full max-w-[480px] flex-col gap-6 rounded-card border border-hairline bg-white px-5 py-8 tablet:px-8 tablet:py-10">
        <div className="flex flex-col gap-1.5">
          <h1 id="auth-title" className="m-0 text-[30px] leading-[1.15] tracking-[-0.02em]">{title}</h1>
          <p className="m-0">{intro}</p>
        </div>
        <SegmentedLinks
          label="Log in or sign up"
          current={current}
          items={[{ href: "/sign-in", label: "Log in" }, { href: "/sign-up", label: "Sign up" }]}
        />
        {children}
        <p className="m-0 text-center text-[15px]">{footer}</p>
      </section>
    </main>
  );
}
