import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Cohort" };

export default function Page() {
  return <PageShell title="Cohort" board="Adviser: cohort" />;
}
