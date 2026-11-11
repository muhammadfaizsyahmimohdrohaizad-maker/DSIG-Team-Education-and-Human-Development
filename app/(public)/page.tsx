import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "CareerPrep" };

export default function Page() {
  return <PageShell title="CareerPrep" board="Homepage (Main)" />;
}
