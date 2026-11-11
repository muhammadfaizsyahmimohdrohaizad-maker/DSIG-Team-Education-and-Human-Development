import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Privacy notice" };

export default function Page() {
  return <PageShell title="Privacy notice" board="Privacy notice" />;
}
