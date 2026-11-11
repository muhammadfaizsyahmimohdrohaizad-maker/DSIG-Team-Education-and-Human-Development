import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { WorkspacePage, Panel, RouteLink } from "@/components/workspace-page";
import { updateConsent, listMyConsents, deleteMyAccount } from "@/features/account/actions";

export default async function Page() {
  const consents = await listMyConsents();
  async function update(form: FormData) {
    "use server";
    const r = await updateConsent({ kind: form.get("kind"), given: form.has("given") });
    if (!r.ok) return r.error.message;
    revalidatePath("/settings");
    return "Choice saved.";
  }
  async function remove(form: FormData) {
    "use server";
    const r = await deleteMyAccount({ confirmation: form.get("name") });
    if (!r.ok) return r.error.fields?.confirmation || r.error.message;
    redirect("/");
  }
  return (
    <WorkspacePage title="Settings and privacy">
      <Panel>
        <h2>Optional permissions</h2>
        {!consents.ok ? (
          <p>{consents.error.message}</p>
        ) : (
          (["ai_processing", "adviser_visibility"] as const).map((kind) => (
            <ActionForm key={kind} submit={update} label="Save choice">
              <input type="hidden" name="kind" value={kind} />
              <label>
                <input type="checkbox" name="given" defaultChecked={consents.value.current[kind]} />{" "}
                {kind === "ai_processing"
                  ? "Allow optional AI feedback"
                  : "Allow my adviser to see my progress before a session"}
              </label>
            </ActionForm>
          ))
        )}
        <RouteLink href="/privacy">Read the privacy notice</RouteLink>
      </Panel>
      <Panel>
        <h2>Account data</h2>
        <a download href="/careerprep/api/export">
          Download my data (JSON)
        </a>
        <details>
          <summary>Delete my account</summary>
          <p>Deleting your account permanently removes your linked records.</p>
          <ActionForm submit={remove} label="Permanently delete my account">
            <label>
              Type your full account name <input required name="name" />
            </label>
          </ActionForm>
        </details>
      </Panel>
    </WorkspacePage>
  );
}
