import { LiveRegionProvider } from "@/components/ui/live-region";
import { StageNav } from "@/components/ui/stage-nav";
import { latestAnswerId } from "@/server/engines/feedback";
import { getStore } from "@/server/data";
import { DemoFooter } from "../_components/demo-footer";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const [bookings, latest] = await Promise.all([getStore().listBookings(), latestAnswerId()]);
  const updates = bookings.filter((b) => b.studentId === "aina" && b.changedSinceViewed).length;

  return (
    <LiveRegionProvider>
      <StageNav updates={updates} feedbackHref={latest ? `/feedback/${latest}` : "/interview"} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <DemoFooter role="student" />
    </LiveRegionProvider>
  );
}
