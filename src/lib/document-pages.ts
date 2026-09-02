/**
 * Counts pages locally before an order is created. PDFs contain page objects in their
 * document structure; images are single-page. Office documents need server-side
 * rendering for an exact count, so the caller deliberately falls back to review.
 */
export async function detectPageCount(file: File): Promise<{ pages: number; detected: boolean }> {
  if (file.type.startsWith("image/")) return { pages: 1, detected: true };
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const source = new TextDecoder("latin1").decode(bytes);
    const pages = (source.match(/\/Type\s*\/Page(?!s)\b/g) ?? []).length;
    if (pages > 0) return { pages, detected: true };
  }
  return { pages: 1, detected: false };
}
