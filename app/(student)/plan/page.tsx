import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Your plan" };

export default function Page() {
  return <PageShell title="Your plan" board="Plan (practice and study)" />;
}
