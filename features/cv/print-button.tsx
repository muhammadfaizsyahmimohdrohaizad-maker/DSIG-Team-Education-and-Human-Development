"use client";
// Local component until the UI kit Button from components/ui is merged; swap it then.

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center justify-center rounded-button bg-maroon px-5 font-semibold text-white"
    >
      Save as PDF
    </button>
  );
}
