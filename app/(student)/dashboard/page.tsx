import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Dashboard" };

export default function Page() {
  return <PageShell title="Dashboard" board="Student dashboard; Dashboard, first visit" />;
}
