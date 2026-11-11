import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Skill gap" };

export default function Page() {
  return <PageShell title="Skill gap" board="Skill gap" />;
}
