/** Same footprint as the panel it stands in for, so nothing jumps when data arrives. */
export function Skeleton({ height = 160, label = "Loading" }: { height?: number; label?: string }) {
  return (
    <div className="card" aria-busy="true" role="status">
      <span className="visually-hidden">{label}</span>
      <div style={{ height, background: "var(--canvas)", borderRadius: "var(--radius)" }} />
    </div>
  );
}
