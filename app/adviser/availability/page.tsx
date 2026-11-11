import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Your availability" };

export default function Page() {
  return <PageShell title="Your availability" board="Adviser: availability" />;
}
