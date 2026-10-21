import type { Metadata } from "next";
import { MapView } from "@/features/map/map-view";
import { MATCH_CONFIDENCE_THRESHOLD } from "@/lib/config";
import { getSkillsMap } from "@/server/engines/matches";
import { getStore } from "@/server/data";

export const metadata: Metadata = { title: "Map: your modules and skills" };

export default async function MapPage() {
  const store = getStore();
  const [{ axes, modules, ticked }, { skills, groups }, links] = await Promise.all([
    getSkillsMap(),
    store.getSkills(),
    store.getLinks(),
  ]);
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const moduleName = new Map(modules.map((m) => [m.id, m.name]));

  return (
    <div className="stack-lg">
      <div className="page-head">
        <p className="stage-label">Stage 1 of 4 · Map</p>
        <h1>Your modules, mapped to skills</h1>
        <p>
          Tick the modules you have finished. Every skill we find comes with the exact line from your course outline, so you
          can check it yourself.
        </p>
      </div>
      <MapView
        axes={axes}
        modules={modules}
        initialTicked={ticked}
        tau={MATCH_CONFIDENCE_THRESHOLD}
        links={links.map((l) => {
          const skill = skillById.get(l.skillId)!;
          return { ...l, label: skill.escoLabel, group: groups[skill.group], groupIndex: skill.group, moduleName: moduleName.get(l.moduleId) ?? "" };
        })}
      />
    </div>
  );
}
