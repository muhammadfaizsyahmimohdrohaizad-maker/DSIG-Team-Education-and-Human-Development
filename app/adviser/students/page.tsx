import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Students" };

export default function Page() {
  return <PageShell title="Students" board="Adviser: students" />;
}
