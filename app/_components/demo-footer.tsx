import Link from "next/link";
import { resetDemo } from "@/features/onboarding/actions";

/** Footer for both shells. The role switch and reset are for the demo build only. */
export function DemoFooter({ role }: { role: "student" | "adviser" }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p>
          Demo build. Every student shown is fictional{role === "student" ? ", and no audio is ever stored" : ""}.
        </p>
        <div className="row">
          {role === "student" ? <Link href="/delete-my-data">Delete my data</Link> : null}
          <span>View as:</span>
          <Link href="/map" aria-current={role === "student" ? "true" : undefined}>
            Student
          </Link>
          <Link href="/adviser" aria-current={role === "adviser" ? "true" : undefined}>
            Adviser
          </Link>
          <form action={resetDemo}>
            <button type="submit" className="link-btn">
              Reset demo data
            </button>
          </form>
        </div>
      </div>
    </footer>
  );
}
