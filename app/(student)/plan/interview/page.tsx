import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Mock interview" };

export default function Page() {
  return <PageShell title="Mock interview" board="Mock interview" />;
}
