import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Your CV" };

export default function Page() {
  return <PageShell title="Your CV" board="CV" />;
}
