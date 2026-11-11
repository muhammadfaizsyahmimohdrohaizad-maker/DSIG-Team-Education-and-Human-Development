import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Book an adviser" };

export default function Page() {
  return <PageShell title="Book an adviser" board="Book" />;
}
