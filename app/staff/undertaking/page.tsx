import { redirect } from "next/navigation";
import { WorkspacePage, Panel } from "@/components/workspace-page";
import { ActionForm } from "@/components/action-form";
import { acceptUndertaking } from "@/features/adviser/actions";

export default function Page() {
  async function accept() {
    "use server";
    const r = await acceptUndertaking();
    if (!r.ok) return r.error.message;
    redirect("/adviser/requests");
  }
  return (
    <WorkspacePage title="Staff undertaking">
      <Panel>
        <p>
          I will use student information only to support the requested session. I will respect each student’s
          sharing choices and keep the information confidential. Opening a shared record is logged.
        </p>
        <ActionForm label="I accept the staff undertaking" submit={accept} />
      </Panel>
    </WorkspacePage>
  );
}
