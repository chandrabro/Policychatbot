export type Chunk = { pageNumber: number; text: string };

const WORDS_PER_CHUNK = 150;
const OVERLAP_WORDS = 30;

/** Splits each page's text into overlapping chunks small enough for the embedding model. */
export function chunkPages(pages: { pageNumber: number; text: string }[]): Chunk[] {
  const chunks: Chunk[] = [];

  for (const page of pages) {
    const words = page.text.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + WORDS_PER_CHUNK, words.length);
      const text = words.slice(start, end).join(" ");
      if (text.trim()) chunks.push({ pageNumber: page.pageNumber, text });
      if (end === words.length) break;
      start = end - OVERLAP_WORDS;
    }
  }

  return chunks;
}
