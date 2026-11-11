import { PublicHeader } from "@/components/public-header";
import { WorkspacePage, Panel, RouteLink } from "@/components/workspace-page";
export default function Page() {
  return (
    <>
      <PublicHeader variant="plain" />
      <WorkspacePage title="Terms and conditions">
        <Panel>
          <h2>Using CareerPrep</h2>
          <p>
            CareerPrep is a student-built career preparation prototype from the German-Malaysian Institute. It
            matches skills to occupations, provides practice materials, and lets students request adviser
            sessions.
          </p>
          <p>
            A match reflects the skills and information you enter. Hiring and admission decisions belong to
            employers and institutions.
          </p>
        </Panel>
        <Panel>
          <h2>Your account and work</h2>
          <p>
            Keep your login details private. Submit work you have permission to share and leave other people’s
            personal information out of project descriptions and interview answers.
          </p>
          <p>
            If you are under 18, your parent or guardian must approve your account before you use the learning
            features.
          </p>
          <RouteLink href="/privacy">How we use your data and how to contact us</RouteLink>
        </Panel>
      </WorkspacePage>
    </>
  );
}
