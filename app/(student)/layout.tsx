import { AppHeader, STUDENT_NAV } from "@/components/app-header";
import { getStudentHeaderSample } from "./sample-account";

// Header data is sample data until server/data/profiles.ts exists (see ./sample-account.ts).
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { account, notifications } = getStudentHeaderSample();
  return (
    <>
      <AppHeader nav={STUDENT_NAV} home="/dashboard" account={account} notifications={notifications} />
      {children}
    </>
  );
}
