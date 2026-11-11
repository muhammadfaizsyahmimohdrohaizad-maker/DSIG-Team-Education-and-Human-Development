// SAMPLE DATA for the adviser header, from the Adviser boards. Swap for the signed-in adviser's profile.
import type { HeaderAccount, HeaderNotification } from "@/components/app-header";

export function getAdviserHeaderSample(): { account: HeaderAccount; notifications: HeaderNotification[] } {
  return {
    account: {
      firstName: "Nurul",
      initials: "NH",
      links: [
        { href: "/adviser/availability", label: "My availability" },
        { href: "/staff/undertaking", label: "Staff undertaking" },
      ],
    },
    notifications: [],
  };
}
