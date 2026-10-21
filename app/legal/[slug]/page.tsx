import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "../../_components/public-shell";
import { LEGAL_PAGES, legalPage } from "@/content/legal/pages";
import { LegalBody } from "../../_components/legal-body";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/config";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return LEGAL_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const page = legalPage((await params).slug);
  return { title: page?.title ?? "Legal" };
}

export default async function LegalPageView({ params }: Params) {
  const page = legalPage((await params).slug);
  if (!page) notFound();
  return (
    <PublicShell>
      <article className="stack-lg">
        <div className="page-head">
          <p>
            <span className="draft-flag">Draft for legal review</span>
          </p>
          <h1>{page.title}</h1>
          <p>{page.summary}</p>
          <p className="meta">Effective date: {LEGAL_EFFECTIVE_DATE}..</p>
        </div>
        <LegalBody blocks={page.blocks} />
        <nav aria-label="Other legal pages" className="stack-sm">
          <h2 style={{ fontSize: "var(--text-body)" }}>Other pages</h2>
          <ul className="footer-links">
            {LEGAL_PAGES.filter((p) => p.slug !== page.slug).map((p) => (
              <li key={p.slug}>
                <Link href={`/legal/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </PublicShell>
  );
}
