"use client";

import { useEffect } from "react";
import { markBookingsViewed } from "./actions";

/** Once the page has been shown, clear the "Updated" markers so the header count goes away. */
export function MarkViewed({ pending }: { pending: boolean }) {
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => void markBookingsViewed(), 800);
    return () => clearTimeout(t);
  }, [pending]);
  return null;
}
