import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Tell us about yourself" };

export default function Page() {
  return <PageShell title="Tell us about yourself" board="Tell us about yourself" />;
}
