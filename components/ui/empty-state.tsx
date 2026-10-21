import type { ReactNode } from "react";

/** Heading, one sentence, one verb-first action. It sits inside its panel so the frame stays. */
export function EmptyState({
  title,
  children,
  action,
  level = 2,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  level?: 2 | 3;
}) {
  const Heading = `h${level}` as "h2" | "h3";
  return (
    <div className="empty">
      <Heading>{title}</Heading>
      <p>{children}</p>
      {action}
    </div>
  );
}
