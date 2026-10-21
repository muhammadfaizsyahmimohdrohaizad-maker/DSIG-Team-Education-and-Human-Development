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
        <p className="prose">
          Delete your account and all its data? This removes your profile, consent record, modules, ratings, practice history,
          interview answers, feedback and bookings straight away. It cannot be undone. Take a copy first in{" "}
          <Link href="/settings">Settings</Link> if you want one.
        </p>
        <form action={deleteMyData} className="row">
          <SubmitButton variant="danger">Delete my account and data</SubmitButton>
          <Link href="/settings" className={btn("secondary")}>Keep my data</Link>
        </form>
      </Card>
    </div>
  );
}
