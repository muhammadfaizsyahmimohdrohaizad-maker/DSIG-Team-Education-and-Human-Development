import { AppHeader, ADVISER_NAV } from "@/components/app-header";
import { currentUser } from "@/server/data/supabase";
import { hasCurrentUndertaking, ownProfile } from "@/server/data/account";
import { redirect } from "next/navigation";

export default async function AdviserLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const profile = await ownProfile(user.id);
  if (profile?.role !== "adviser") redirect("/dashboard");
  if (!(await hasCurrentUndertaking(user.id))) redirect("/staff/undertaking");
  const names = profile.fullName.trim().split(/\s+/);
  return (
    <>
      <AppHeader
        nav={ADVISER_NAV}
        home="/adviser/requests"
        notifications={[]}
        account={{
          firstName: names[0] || "Adviser",
          initials: names
            .slice(0, 2)
            .map((n) => n[0])
            .join(""),
          links: [{ href: "/staff/undertaking", label: "Staff undertaking" }],
        }}
      />
      {children}
    </>
  );
}
