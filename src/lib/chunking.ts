export function chunkText(
  text: string,
  targetSize = 1000,
  overlap = 150
): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= targetSize) return [clean];

  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    let end = start + targetSize;

    if (end < clean.length) {
      const lastPeriod = clean.lastIndexOf('.', end);
      const lastNewline = clean.lastIndexOf('\n', end);
      const boundary = Math.max(lastPeriod, lastNewline);

      if (boundary > start + targetSize * 0.5) {
        end = boundary + 1;
      }
    } else {
      end = clean.length;
    }

    chunks.push(clean.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks.filter(c => c.length > 50);
}
