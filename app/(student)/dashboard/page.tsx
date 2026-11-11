import { redirect } from "next/navigation";
import { WorkspacePage, Panel, RouteLink } from "@/components/workspace-page";
import { currentUser } from "@/server/data/supabase";
import { getProfile } from "@/server/data/profiles";
import { getSkillGap } from "@/features/plan/actions";

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const p = await getProfile(user.id);
  const gap = p?.target ? await getSkillGap() : null;
  return (
    <WorkspacePage title={"Welcome" + (p?.fullName ? ", " + p.fullName.split(" ")[0] : "")}>
      <Panel>
        <h2>
          {gap?.ok
            ? gap.value.target.title
            : p?.educationLevel
              ? "Choose your target job"
              : "Tell us about yourself"}
        </h2>
        {gap?.ok ? (
          <>
            <p>
              {gap.value.rows.filter((r) => r.state === "mastered").length} mastered skills ·{" "}
              {gap.value.lessonsLeft} lessons remaining
            </p>
            <RouteLink href="/skill-gap">Continue your plan</RouteLink>
          </>
        ) : (
          <>
            <p>
              {gap && !gap.ok
                ? gap.error.message
                : "Match your skills and modules to occupations in Malaysia."}
            </p>
            <RouteLink href={p?.educationLevel ? "/map" : "/about-you"}>
              {p?.educationLevel ? "Explore your matches" : "Build your profile"}
            </RouteLink>
          </>
        )}
      </Panel>
      <Panel>
        <h2>Practice and support</h2>
        <RouteLink href="/plan/interview">Mock interview</RouteLink>
        <RouteLink href="/plan/review">Review cards</RouteLink>
        <RouteLink href="/book">Book an adviser</RouteLink>
      </Panel>
    </WorkspacePage>
  );
}
