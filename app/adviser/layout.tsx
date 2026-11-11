import { AppHeader, ADVISER_NAV } from "@/components/app-header";

// Every adviser page sits behind a current staff undertaking: has_current_undertaking() in RLS,
// and a redirect to /staff/undertaking here once server/data/adviser.ts exists.
export default function AdviserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader nav={ADVISER_NAV} home="/adviser/requests" account={{ initials: "··", name: "Account", href: "/staff/undertaking" }} />
      {children}
    </>
  );
}
