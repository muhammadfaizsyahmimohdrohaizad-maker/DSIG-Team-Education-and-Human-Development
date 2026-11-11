import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Mastery check" };

export default function Page() {
  return <PageShell title="Mastery check" board="Check result" />;
}
