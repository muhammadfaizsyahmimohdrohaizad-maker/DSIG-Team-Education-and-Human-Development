"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

const AnnounceContext = createContext<(message: string) => void>(() => {});

/** One polite status region per page. Components call useAnnounce() to push a message into it. */
export function LiveRegionProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  // A trailing zero-width space lets the same message be announced twice in a row.
  const announce = useCallback((next: string) => setMessage((prev) => (prev === next ? `${next}​` : next)), []);
  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" className="visually-hidden">
        {message}
      </div>
    </AnnounceContext.Provider>
  );
}

export function useAnnounce() {
  return useContext(AnnounceContext);
}
