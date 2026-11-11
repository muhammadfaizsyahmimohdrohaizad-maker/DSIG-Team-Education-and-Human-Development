import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Institution overview" };

// Institution role: cohort totals (groups of 5 or more) and the audit log for data access requests.
export default function Page() {
  return <PageShell title="Institution overview" board="none yet (pitched separately)" />;
}
