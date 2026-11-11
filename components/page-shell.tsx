// Placeholder body for routes whose screen is not built yet. Each names its mockup board.
export function PageShell({ title, board, children }: { title: string; board: string; children?: React.ReactNode }) {
  return (
    <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
      <h1 className="m-0 text-[28px] leading-tight desktop:text-4xl">{title}</h1>
      {children ?? <p className="m-0 text-muted">Not built yet. Mockup board: {board}.</p>}
    </main>
  );
}
