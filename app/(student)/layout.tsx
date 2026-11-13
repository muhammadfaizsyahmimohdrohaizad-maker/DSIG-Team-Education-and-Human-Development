import { AppHeader, STUDENT_NAV } from "@/components/app-header";
import { SiteFooter } from "@/components/site-footer";
import { headerFor } from "@/features/account/header";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { account, notifications } = await headerFor([
    { href: "/about-you", label: "My profile" },
    { href: "/settings", label: "Settings and privacy" },
  ]);
  return (
    <>
      <AppHeader nav={STUDENT_NAV} home="/dashboard" account={account} notifications={notifications} />
      {children}
      <SiteFooter variant="app" />
    </>
  );
}
