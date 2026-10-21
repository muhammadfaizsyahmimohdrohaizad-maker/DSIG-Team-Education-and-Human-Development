import { Skeleton } from "@/components/ui/skeleton";

/** Live feedback takes a few seconds to write, so the page holds its shape meanwhile. */
export default function Loading() {
  return (
    <div className="stack-lg">
      <div className="page-head">
        <p className="stage-label">Stage 4 of 4 · Feedback</p>
        <h1>Feedback on your answer</h1>
        <p>Reading your answer. This takes a few seconds.</p>
      </div>
      <Skeleton height={96} label="Loading your answer" />
      <Skeleton height={280} label="Writing feedback" />
    </div>
  );
}
