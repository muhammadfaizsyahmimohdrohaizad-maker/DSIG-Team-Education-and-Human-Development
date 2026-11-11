import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Requests and recent sessions" };

export default function Page() {
  return <PageShell title="Requests and recent sessions" board="Adviser: booking requests" />;
}
