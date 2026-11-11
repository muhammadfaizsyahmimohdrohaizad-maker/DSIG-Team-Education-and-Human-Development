import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Lesson" };

export default function Page() {
  return <PageShell title="Lesson" board="Learning page" />;
}
