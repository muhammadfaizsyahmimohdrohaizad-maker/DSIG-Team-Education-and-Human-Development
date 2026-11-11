import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Review" };

export default function Page() {
  return <PageShell title="Review" board="Review (flashcards)" />;
}
