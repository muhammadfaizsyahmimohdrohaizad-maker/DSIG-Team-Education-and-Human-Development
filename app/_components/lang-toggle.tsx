"use client";

import { useState } from "react";

/**
 * English / Bahasa Malaysia switch. Only English is written so far, so choosing BM says so
 * instead of pretending to translate.
 */
export function LangToggle() {
  const [asked, setAsked] = useState(false);
  return (
    <div className="lang">
      <div className="lang-switch" role="group" aria-label="Language">
        <button type="button" aria-pressed="true">EN</button>
        <button type="button" aria-pressed="false" onClick={() => setAsked(true)}>BM</button>
      </div>
      <p className="meta" role="status">{asked ? "Bahasa Malaysia is not available yet. The app is in English for now." : ""}</p>
    </div>
  );
}
