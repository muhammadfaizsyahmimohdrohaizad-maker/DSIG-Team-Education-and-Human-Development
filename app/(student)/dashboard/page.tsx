import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink, Card, HeroBand, Kicker, SoftPanel } from "@/components/ui";
import { currentUser } from "@/server/data/supabase";
import { getProfile } from "@/server/data/profiles";
import { getSkillGap } from "@/features/plan/actions";

const tools = [
  { href: "/map", title: "Career map", detail: "Compare occupations and see which skills support each match." },
  { href: "/plan/resume", title: "Résumé scanner", detail: "Compare résumé evidence with your chosen occupation." },
  { href: "/plan/interview", title: "Mock interview", detail: "Practise answering questions about your target occupation." },
  { href: "/book", title: "Adviser booking", detail: "Find an available session to discuss your next step." },
];

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const profile = await getProfile(user.id);
  const gap = profile?.target ? await getSkillGap() : null;
  const next = gap?.ok
    ? { title: gap.value.target.title, detail: "Prepare your résumé and practise interview answers for this role.", href: "/plan", action: "Open my plan" }
    : profile?.educationLevel
      ? { title: "Find your target occupation", detail: "Compare the occupations linked to your profile, then choose one to work towards.", href: "/map", action: "Explore my matches" }
      : { title: "Start with a skill you have used", detail: "Add a module, a project or a skill. Your career map will show which occupations use it.", href: "/about-you", action: "Build my profile" };
  return <main id="main" className="mx-auto grid w-full max-w-[1280px] gap-6 px-4 pb-24 pt-6 tablet:px-8">
    <h1 className="text-3xl desktop:text-4xl">Welcome{profile?.fullName ? ", " + profile.fullName.trim().split(/\s+/)[0] : ""}</h1>
    <div className="grid gap-4 tablet:grid-cols-[2fr_1fr]">
      <HeroBand gap="gap-4"><Kicker onNavy>Your next step</Kicker><h2 className="text-3xl">{next.title}</h2>
        <p className="max-w-xl">{next.detail}</p><ButtonLink variant="on-navy" href={next.href} className="self-start">{next.action}</ButtonLink>
        {gap && !gap.ok && <p role="status">{gap.error.message}</p>}
      </HeroBand>
      <SoftPanel as="section"><h2 className="text-xl">My profile</h2>
        <dl>{[["Skills",profile?.skills.length],["Modules",profile?.moduleIds.length],["Projects",profile?.projects.length]].map(([label,count]) =>
          <div key={label} className="flex justify-between border-b border-hairline py-2"><dt>{label}</dt><dd className="font-bold">{count ?? 0}</dd></div>)}</dl>
        <Link href="/about-you" className="font-semibold">Edit my profile</Link>
      </SoftPanel>
    </div>
    <section aria-labelledby="workspace-tools"><h2 id="workspace-tools" className="mb-4 text-2xl">Your career workspace</h2>
      <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">{tools.map(tool =>
        <Card as="article" key={tool.href}><h3 className="text-xl"><Link href={tool.href}>{tool.title}</Link></h3><p>{tool.detail}</p></Card>)}</div>
    </section>
  </main>;
}
