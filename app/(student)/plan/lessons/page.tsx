import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "All lessons" };

export default function Page() {
  return <PageShell title="All lessons" board="All lessons" />;
}
