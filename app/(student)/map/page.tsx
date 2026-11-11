import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Career map" };

export default function Page() {
  return <PageShell title="Career map" board="Map" />;
}
