import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Booking" };

export default function Page() {
  return <PageShell title="Booking" board="Booking detail" />;
}
