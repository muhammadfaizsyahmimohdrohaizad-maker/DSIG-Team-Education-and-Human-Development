import { WorkspacePage, Panel, RouteLink } from "@/components/workspace-page";

export default function Page() {
  return <WorkspacePage title="My plan">
    <div className="grid gap-4 tablet:grid-cols-2">
      <Panel><h2 className="text-2xl">Résumé scanner</h2><p>Compare your résumé with the essential skills for an occupation. Review the evidence and see which skills you could illustrate more clearly.</p><RouteLink href="/plan/resume">Scan my résumé</RouteLink></Panel>
      <Panel><h2 className="text-2xl">Mock interview</h2><p>Practise questions for your target occupation and review feedback on your answers.</p><RouteLink href="/plan/interview">Start interview practice</RouteLink></Panel>
    </div>
  </WorkspacePage>;
}
