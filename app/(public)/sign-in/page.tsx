import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Log in" };

export default function Page() {
  return <PageShell title="Log in" board="Log in / Sign up" />;
}
