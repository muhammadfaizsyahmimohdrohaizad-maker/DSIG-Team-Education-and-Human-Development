import { exportNotes } from "@/features/learning/actions";
export async function GET() {
  const r = await exportNotes();
  if (!r.ok)
    return new Response(r.error.message, {
      status: r.error.code === "NOT_FOUND" ? 404 : r.error.code === "UNAUTHENTICATED" ? 401 : 500,
    });
  return new Response(r.value.markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="careerprep-notes.md"',
      "Cache-Control": "private, no-store",
    },
  });
}
