import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Parent or guardian approval" };

export default function Page() {
  return <PageShell title="Parent or guardian approval" board="Parent consent (under 18)" />;
}
