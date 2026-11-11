// SAMPLE DATA for the student header (name chip and notifications), from the Dashboard board.
// Swap for the signed-in profile (server/data/profiles.ts, D1) and real notifications when they exist.
import type { HeaderAccount, HeaderNotification } from "@/components/app-header";

export function getStudentHeaderSample(): { account: HeaderAccount; notifications: HeaderNotification[] } {
  return {
    account: {
      firstName: "Aina",
      initials: "AR",
      links: [
        { href: "/about-you", label: "My profile" },
        { href: "/settings", label: "Settings and privacy" },
      ],
    },
    notifications: [
      { id: "n1", text: "Pn. Nurul Huda accepted your booking for Thu 12 Nov, 10:00 am", when: "10 min ago", href: "/book", unread: true },
      { id: "n2", text: "6 review cards are due today", when: "Today, 8:00 am", href: "/plan/review", unread: true },
      { id: "n3", text: "New adviser feedback on your mock interview", when: "Yesterday", href: "/plan/progress", unread: true },
    ],
  };
}
