import { ActionForm } from "@/components/action-form";
import { WorkspacePage } from "@/components/workspace-page";
import { requestParentApproval } from "@/features/onboarding/actions";
import { AppHeader, STUDENT_NAV } from "@/components/app-header";
import { currentUser } from "@/server/data/supabase";
import { ownProfile } from "@/server/data/account";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const profile = await ownProfile(user.id);
  if (!profile)
    return (
      <WorkspacePage title="Profile unavailable">
        <p>Please sign in again to load your profile.</p>
      </WorkspacePage>
    );
  if (profile.locked) {
    async function resend() {
      "use server";
      const result = await requestParentApproval();
      return result.ok ? "Approval requested for " + result.value.sentTo : result.error.message;
    }
    return (
      <WorkspacePage title="Parent approval needed">
        <p>Ask your parent or guardian to open the approval email.</p>
        <ActionForm submit={resend} label="Send a fresh approval email" />
      </WorkspacePage>
    );
  }
  const names = (profile?.fullName || "Student").trim().split(/\s+/);
  return (
    <>
      <AppHeader
        home="/dashboard"
        nav={STUDENT_NAV}
        notifications={[]}
        account={{
          firstName: names[0] || "Student",
          initials: names
            .slice(0, 2)
            .map((s) => s[0])
            .join(""),
          links: [
            { href: "/about-you", label: "My profile" },
            { href: "/settings", label: "Settings and privacy" },
          ],
        }}
      />
      {children}
    </>
  );
}
