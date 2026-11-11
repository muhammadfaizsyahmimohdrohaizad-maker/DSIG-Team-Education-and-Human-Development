import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/server/data/supabase";
import { loadAboutYou } from "@/features/matches/load";
import { AboutYouForm } from "@/features/matches/about-you-form";

export const metadata: Metadata = { title: "Tell us about yourself" };

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const data = await loadAboutYou(user.id);
  if (!data) redirect("/dashboard");

  return (
    <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 pb-24 pt-5 tablet:px-6 tablet:pb-16 tablet:pt-8">
      <div className="flex max-w-[720px] flex-col gap-2">
        <h1 className="m-0 text-[28px] leading-tight desktop:text-4xl">Tell us about yourself</h1>
        <p className="m-0 text-ink">
          CareerPrep matches what you add to the skills listed for each official job in MASCO 2020 and ESCO.
          The more you add, the more matches you&apos;ll see. Everything except where you are now is optional.
        </p>
      </div>
      <AboutYouForm data={data} />
    </main>
  );
}
