/**
 * Counts pages locally before an order is created. PDFs contain page objects in their
 * document structure; images are single-page. Office documents are parsed from their
 * ZIP-based structure to count slides or sheets.
 */

function readUint16LE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] ?? 0) |
    ((bytes[offset + 1] ?? 0) << 8) |
    ((bytes[offset + 2] ?? 0) << 16) |
    ((bytes[offset + 3] ?? 0) << 24)
  );
}

interface ZipEntry {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  offset: number;
}

/**
 * Parse ZIP local file headers and return entry metadata with file offsets.
 */
function parseZipEntries(bytes: Uint8Array): ZipEntry[] {
  const text = new TextDecoder("latin1").decode(bytes);
  const entries: ZipEntry[] = [];

  let offset = 0;
  while (offset < bytes.length - 30) {
    const signature = readUint32LE(bytes, offset);
    if (signature !== 0x04034b50) break; // Not a local file header

    const compressionMethod = readUint16LE(bytes, offset + 8);
    const compressedSize = readUint32LE(bytes, offset + 18);
    const fileNameLength = readUint16LE(bytes, offset + 26);
    const extraFieldLength = readUint16LE(bytes, offset + 28);

    const dataOffset = offset + 30 + fileNameLength + extraFieldLength;
    const fileName = text.substring(offset + 30, offset + 30 + fileNameLength);

    entries.push({
      name: fileName,
      compressionMethod,
      compressedSize,
      offset: dataOffset,
    });

    offset = dataOffset + compressedSize;

    // Safety: prevent infinite loop on corrupt files.
    const lastEntry = entries[entries.length - 1];
    if (offset <= 0 || (lastEntry !== undefined && offset <= lastEntry.offset)) break;
  }

  return entries;
}

/**
 * Decompress a DEFLATE-compressed ZIP entry using the DecompressionStream API.
 */
async function decompressEntry(bytes: Uint8Array, entry: ZipEntry): Promise<string | null> {
  if (entry.compressionMethod === 0) {
    // Stored (no compression).
    return new TextDecoder("utf-8").decode(
      bytes.slice(entry.offset, entry.offset + entry.compressedSize),
    );
  }

  if (entry.compressionMethod !== 8) return null; // Not DEFLATE.

  try {
    const compressedData = bytes.slice(entry.offset, entry.offset + entry.compressedSize);
    const ds = new DecompressionStream("deflate-raw");
    const writer = ds.writable.getWriter();
    void writer.write(compressedData);
    void writer.close();

    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let pos = 0;
    for (const chunk of chunks) {
      result.set(chunk, pos);
      pos += chunk.length;
    }

    return new TextDecoder("utf-8").decode(result);
  } catch {
    return null;
  }
}

/**
 * Find a ZIP entry by name and return its metadata.
 */
function findEntry(entries: ZipEntry[], name: string): ZipEntry | undefined {
  return entries.find((e) => e.name === name);
}

/**
 * Detect PDF page count from raw bytes.
 */
function detectPdfPages(bytes: Uint8Array): number {
  const source = new TextDecoder("latin1").decode(bytes);

  // Primary: count /Type /Page objects (not /Pages).
  const primary = (source.match(/\/Type\s*\/Page(?!s)\b/g) ?? []).length;
  if (primary > 0) return primary;

  // Fallback: count /Page entries in the page tree (some PDFs use different formatting).
  const fallback = (source.match(/\/Type\s*\/Page\b/g) ?? []).length;
  if (fallback > 0) return fallback;

  // Last resort: look for /Count in the page tree root.
  const countMatch = /\/Type\s*\/Pages\b[^>]*\/Count\s+(\d+)/g;
  let maxCount = 0;
  let match;
  while ((match = countMatch.exec(source)) !== null) {
    const count = parseInt(match[1] ?? "0", 10);
    if (count > maxCount) maxCount = count;
  }
  return maxCount;
}

/**
 * Detect DOCX page count by parsing the ZIP structure and analyzing document.xml.
 *
 * Strategy:
 * 1. Parse ZIP entries to find word/document.xml
 * 2. Decompress and parse the XML content
 * 3. Count explicit page breaks (<w:br w:type="page"/>)
 * 4. Count section breaks that imply page boundaries (<w:sectPr>)
 * 5. If no explicit breaks found, estimate based on content volume
 */
async function detectDocxPages(bytes: Uint8Array): Promise<{ pages: number; detected: boolean }> {
  const entries = parseZipEntries(bytes);

  // Find the main document content.
  const docEntry =
    findEntry(entries, "word/document.xml") ?? findEntry(entries, "word/document2.xml"); // Some DOCX variants use document2.xml
  if (!docEntry) return { pages: 1, detected: false };

  const docXml = await decompressEntry(bytes, docEntry);
  if (!docXml) return { pages: 1, detected: false };

  // Count explicit page breaks.
  const pageBreaks = (docXml.match(/<w:br\s[^>]*?w:type="page"[^>]*?\/>/g) ?? []).length;

  // Count section breaks (each <w:sectPr> marks the end of a section/page).
  const sectBreaks = (docXml.match(/<w:sectPr\b/g) ?? []).length;

  // Explicit breaks give us a reliable count.
  const explicitPages = pageBreaks + sectBreaks;
  if (explicitPages > 0) {
    // The document starts on page 1, so pages = breaks + 1
    // (unless there are 0 breaks, which means 1 page).
    return { pages: explicitPages + 1, detected: true };
  }

  // No explicit breaks found — estimate from content volume.
  // Strip XML tags to get plain text content.
  const plainText = docXml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length === 0) return { pages: 1, detected: true };

  // Try to extract page dimensions from document settings for better estimation.
  let charsPerPage = 3000; // Default: ~3000 chars per A4 page with standard formatting

  const settingsEntry = findEntry(entries, "word/settings.xml");
  if (settingsEntry) {
    const settingsXml = await decompressEntry(bytes, settingsEntry);
    if (settingsXml) {
      // Extract page width and height (in twips, 1 inch = 1440 twips).
      const widthMatch = settingsXml.match(/<w:pgSz[^>]*?w:w="(\d+)"/);
      const heightMatch = settingsXml.match(/<w:pgSz[^>]*?w:h="(\d+)"/);
      const marginMatch = settingsXml.match(/<w:pgMar[^>]*?w:(?:l|r|t|b)="(\d+)"/g);

      if (widthMatch && heightMatch) {
        const pageWidth = parseInt(widthMatch[1] ?? "11906", 10); // Default A4 width
        const pageHeight = parseInt(heightMatch[1] ?? "16838", 10); // Default A4 height

        // Calculate usable area (subtract margins).
        let totalMargins = 1440 + 1440; // Default left + right margins (1 inch each)
        if (marginMatch) {
          const margins = marginMatch.map((m) => {
            const val = m.match(/w:(\w+)="(\d+)"/);
            return val ? parseInt(val[2] ?? "0", 10) : 0;
          });
          if (margins.length >= 4) {
            totalMargins = (margins[0] ?? 0) + (margins[1] ?? 0); // left + right
          }
        }

        const usableWidth = pageWidth - totalMargins;
        // Approximate characters per line (assuming 12pt font, ~0.1 inch per char).
        const charsPerLine = Math.max(20, Math.floor(usableWidth / 144));
        // Approximate lines per page (assuming 12pt font with 1.5 line spacing).
        const linesPerPage = Math.max(20, Math.floor(pageHeight / 360));
        charsPerPage = Math.max(1000, charsPerLine * linesPerPage);
      }
    }
  }

  // Estimate pages from content length.
  const estimatedPages = Math.max(1, Math.ceil(plainText.length / charsPerPage));

  // When estimating, we mark as detected but note it's an estimate.
  // The UI will show "Detected automatically" for any detected:true.
  return { pages: estimatedPages, detected: true };
}

/**
 * Detect legacy DOC page count. DOC is a binary format that's difficult to
 * parse client-side, so we extract any readable text and estimate.
 */
async function detectDocPages(bytes: Uint8Array): Promise<{ pages: number; detected: boolean }> {
  // DOC is a complex binary format. We try to extract readable text and estimate.
  const source = new TextDecoder("latin1").decode(bytes);

  // Look for page break characters (U+000C = form feed, commonly used in DOC).
  // eslint-disable-next-line no-control-regex
  const pageBreaks = (source.match(/\x0c/g) ?? []).length;
  if (pageBreaks > 0) {
    return { pages: pageBreaks + 1, detected: true };
  }

  // Try to find text content between Word document markers.
  // This is a heuristic fallback for simple DOC files.
  const textExtractor = /[\x20-\x7E\xA0-\xFF]{20,}/g;
  const textChunks = source.match(textExtractor) ?? [];
  const totalTextLength = textChunks.reduce((sum, chunk) => sum + chunk.length, 0);

  if (totalTextLength > 500) {
    // Estimate ~3000 characters per page.
    const estimatedPages = Math.max(1, Math.ceil(totalTextLength / 3000));
    return { pages: estimatedPages, detected: true };
  }

  // Cannot reliably detect — fall back to 1 page with review needed.
  return { pages: 1, detected: false };
}

export async function detectPageCount(file: File): Promise<{ pages: number; detected: boolean }> {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  // Images are always 1 page.
  if (mime.startsWith("image/")) return { pages: 1, detected: true };

  // PDF detection.
  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pages = detectPdfPages(bytes);
    if (pages > 0) return { pages, detected: true };
    return { pages: 1, detected: false };
  }

  // ZIP-based Office formats: PPTX, DOCX, XLSX.
  if (
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    name.endsWith(".pptx")
  ) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const entries = parseZipEntries(bytes);
      const slides = entries.filter((e) => /^ppt\/slides\/slide\d+\.xml$/.test(e.name)).length;
      if (slides > 0) return { pages: slides, detected: true };
    } catch {
      /* fall through */
    }
    return { pages: 1, detected: false };
  }

  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      return await detectDocxPages(bytes);
    } catch {
      /* fall through */
    }
    return { pages: 1, detected: false };
  }

  if (
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    name.endsWith(".xlsx")
  ) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const entries = parseZipEntries(bytes);
      const sheets = entries.filter((e) => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.name)).length;
      if (sheets > 0) return { pages: sheets, detected: true };
    } catch {
      /* fall through */
    }
    return { pages: 1, detected: false };
  }

  // Legacy .doc format.
  if (mime === "application/msword" || name.endsWith(".doc")) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      return await detectDocPages(bytes);
    } catch {
      /* fall through */
    }
    return { pages: 1, detected: false };
  }

  // Other text formats — cannot estimate rendered page count client-side.
  return { pages: 1, detected: false };
}
