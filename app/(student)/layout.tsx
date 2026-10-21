import { LiveRegionProvider } from "@/components/ui/live-region";
import { StageNav } from "@/components/ui/stage-nav";
import { requireStudent } from "@/server/auth/account";
import { latestAnswerId } from "@/server/engines/feedback";
import { getStore } from "@/server/data";
import { SiteFooter } from "../_components/site-footer";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireStudent();
  const store = getStore();
  const [student, bookings, latest] = await Promise.all([store.getStudent(), store.listBookings(), latestAnswerId()]);
  const updates = bookings.filter((b) => b.studentId === student.id && b.changedSinceViewed).length;

  return (
    <LiveRegionProvider>
      <StageNav updates={updates} feedbackHref={latest ? `/feedback/${latest}` : "/interview"} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter student />
    </LiveRegionProvider>
  );
}
