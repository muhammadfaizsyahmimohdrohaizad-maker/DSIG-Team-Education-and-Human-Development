import type { LegalBlock } from "@/content/legal/pages";

export function LegalBody({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <div className="legal">
      {blocks.map((b, i) => (
        <section key={i}>
          {b.heading ? <h2>{b.heading}</h2> : null}
          {b.text?.map((t) => <p key={t}>{t}</p>)}
          {b.list ? (
            <ul>
              {b.list.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}
