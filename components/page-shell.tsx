// Placeholder body for routes whose screen is not built yet. Each names its mockup board.
export function PageShell({ title, board, children }: { title: string; board: string; children?: React.ReactNode }) {
  return (
    <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 pb-24 pt-5 tablet:px-6 tablet:pb-16 tablet:pt-8">
      <h1 className="text-[28px] leading-tight desktop:text-4xl">{title}</h1>
      {children ?? <p className="text-muted">Not built yet. Mockup board: {board}.</p>}
    </main>
  );
}
