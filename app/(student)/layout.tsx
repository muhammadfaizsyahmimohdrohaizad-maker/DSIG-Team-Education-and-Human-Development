import { AppHeader, STUDENT_NAV } from "@/components/app-header";

// Profile name comes from D1 once server/data/profiles.ts exists.
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader nav={STUDENT_NAV} home="/dashboard" account={{ initials: "··", name: "Account", href: "/settings" }} />
      {children}
    </>
  );
}
