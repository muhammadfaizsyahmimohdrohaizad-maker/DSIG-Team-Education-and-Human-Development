import { AppHeader, ADVISER_NAV } from "@/components/app-header";
import { getAdviserHeaderSample } from "./sample-account";

// Every adviser page sits behind a current staff undertaking: has_current_undertaking() in RLS,
// and a redirect to /staff/undertaking here once server/data/adviser.ts exists.
export default function AdviserLayout({ children }: { children: React.ReactNode }) {
  const { account, notifications } = getAdviserHeaderSample();
  return (
    <>
      <AppHeader nav={ADVISER_NAV} home="/adviser/requests" account={account} notifications={notifications} />
      {children}
    </>
  );
}
