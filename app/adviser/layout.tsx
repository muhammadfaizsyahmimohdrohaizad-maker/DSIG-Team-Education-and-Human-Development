import { redirect } from "next/navigation";
import { AppHeader, ADVISER_NAV } from "@/components/app-header";
import { SiteFooter } from "@/components/site-footer";
import { headerFor } from "@/features/account/header";
import { hasCurrentUndertaking } from "@/server/data/account";
import { currentUser } from "@/server/data/supabase";

// Every adviser page sits behind a current staff undertaking: has_current_undertaking() in RLS, and this
// redirect so an adviser who hasn't accepted the current version sees it first.
export default async function AdviserLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (!(await hasCurrentUndertaking(user.id))) redirect("/staff/undertaking");
  const { account, notifications } = await headerFor([
    { href: "/adviser/availability", label: "My availability" },
    { href: "/staff/undertaking", label: "Staff undertaking" },
  ]);
  return (
    <>
      <AppHeader nav={ADVISER_NAV} home="/adviser/requests" account={account} notifications={notifications} />
      {children}
      <SiteFooter variant="app" />
    </>
  );
}
