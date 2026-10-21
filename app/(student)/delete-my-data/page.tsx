import type { Metadata } from "next";
import Link from "next/link";
import { btn } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteMyData } from "@/features/onboarding/actions";

export const metadata: Metadata = { title: "Delete my data" };

export default function DeleteMyDataPage() {
  return (
    <div className="centered stack-lg">
      <div className="page-head">
        <h1>Delete my data</h1>
      </div>
      <Card className="stack">
        <p className="prose">Delete all data for this account? This removes your modules, answers and bookings and cannot be undone.</p>
        <form action={deleteMyData} className="row">
          <SubmitButton variant="danger">Delete my data</SubmitButton>
          <Link href="/map" className={btn("secondary")}>Keep my data</Link>
        </form>
      </Card>
    </div>
  );
}
