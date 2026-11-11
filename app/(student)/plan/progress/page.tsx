import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Progress" };

export default function Page() {
  return <PageShell title="Progress" board="Progress summary" />;
}
