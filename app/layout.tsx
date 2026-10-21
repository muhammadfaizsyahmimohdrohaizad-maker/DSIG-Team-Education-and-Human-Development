import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "CareerPrep", template: "%s · CareerPrep" },
  description: "See how your diploma modules connect to real jobs, then practise for them.",
};

// Every page depends on who is signed in, so none is prerendered.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
