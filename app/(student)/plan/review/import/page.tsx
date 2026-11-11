import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Turn notes into review cards" };

export default function Page() {
  return <PageShell title="Turn notes into review cards" board="Notes to review cards" />;
}
