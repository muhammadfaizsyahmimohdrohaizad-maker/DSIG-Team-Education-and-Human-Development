import { redirect } from "next/navigation";
import Cohort from "@/app/adviser/cohort/page";
import { AppHeader } from "@/components/app-header";
import { currentUser, db } from "@/server/data/supabase";
import { ownProfile } from "@/server/data/account";
import { bookingTime } from "@/lib/booking-time";

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const profile = await ownProfile(user.id);
  if (profile?.role !== "institution") redirect("/dashboard");
  const { data, error } = await (
    await db()
  )
    .from("audit_log")
    .select("id, action, accessed_at")
    .order("accessed_at", { ascending: false })
    .limit(50);
  return (
    <>
      <AppHeader
        nav={[]}
        home="/institution"
        notifications={[]}
        account={{ firstName: profile.fullName, initials: "IN", links: [] }}
      />
      <Cohort searchParams={Promise.resolve({})} />
      <section className="mx-auto w-full max-w-[960px] px-4 pb-16">
        <h2>Recent record access</h2>
        {error ? (
          <p>Could not load the access log.</p>
        ) : !data?.length ? (
          <p>No recorded access yet.</p>
        ) : (
          <ul>
            {data.map((row) => (
              <li key={row.id}>
                {bookingTime(row.accessed_at)} · {row.action.replaceAll("_", " ")}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
