import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Create your account" };

export default function Page() {
  return <PageShell title="Create your account" board="Log in / Sign up" />;
}
