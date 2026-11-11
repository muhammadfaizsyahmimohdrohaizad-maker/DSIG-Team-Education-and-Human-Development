import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Terms and conditions" };

export default function Page() {
  return <PageShell title="Terms and conditions" board="Privacy notice (footer links)" />;
}
