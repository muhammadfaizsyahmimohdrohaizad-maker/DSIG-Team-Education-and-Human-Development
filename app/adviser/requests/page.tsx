import type { Metadata } from "next";
import { ButtonLink, ErrorState, HeroBand } from "@/components/ui";
import { listRequests } from "@/features/adviser/actions";
import { RequestsBoard } from "@/features/adviser/requests-board";
import { ownProfile } from "@/server/data/account";
import { currentUser } from "@/server/data/supabase";

export const metadata: Metadata = { title: "Booking requests" };

const greeting = () => {
  const h = Number(new Date().toLocaleString("en-MY", { hour: "numeric", hour12: false, timeZone: "Asia/Kuala_Lumpur" }));
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

// Adviser board (booking requests). Week = the next 7 days.
export default async function RequestsPage() {
  const user = await currentUser();
  const [requests, me] = await Promise.all([listRequests(), user ? ownProfile(user.id) : null]);
  const list = requests.ok ? requests.value : [];
  const now = Date.now();
  const week = now + 7 * 864e5;
  const waiting = list.filter((r) => r.status === "requested" || r.status === "change_requested").length;
  const thisWeek = list.filter((r) => r.status === "accepted" && new Date(r.start).getTime() >= now && new Date(r.start).getTime() < week).length;
  const students = new Set(list.map((r) => r.studentName)).size;

  return (
    <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
      <HeroBand row gap="gap-x-8 gap-y-4" className="justify-between" aria-labelledby="hi-h">
        <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-1.5">
          <h1 id="hi-h" className="m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]">{greeting()}, {me ? me.fullName : "there"}</h1>
          <p className="m-0 text-cream">Each student chose what to share with you for their booking. You see nothing else.</p>
        </div>
        <dl className="m-0 flex flex-wrap gap-6">
          {[["Waiting", waiting], ["This week", thisWeek], ["Students", students]].map(([k, v]) => (
            <div key={k as string} className="flex flex-col">
              <dt className="text-sm text-cream">{k}</dt>
              <dd className="m-0 font-display text-[32px] font-bold leading-none text-white">{v}</dd>
            </div>
          ))}
        </dl>
      </HeroBand>
      {requests.ok
        ? <RequestsBoard requests={list} />
        : <ErrorState title="Requests didn't load." actions={<ButtonLink href="/adviser/requests">Try again</ButtonLink>}>{requests.error.message}</ErrorState>}
    </main>
  );
}
