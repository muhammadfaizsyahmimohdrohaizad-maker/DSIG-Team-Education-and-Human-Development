import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Settings and privacy" };

export default function Page() {
  return <PageShell title="Settings and privacy" board="Settings and privacy" />;
}
