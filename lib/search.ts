export type IndexEntry = {
  fileName: string;
  blobUrl: string;
  pageNumber: number;
  text: string;
  embedding: number[];
};

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Returns the top-k entries most similar to the query embedding. */
export function topKByCosine(
  entries: IndexEntry[],
  queryEmbedding: number[],
  k: number
): IndexEntry[] {
  return entries
    .map((entry) => ({ entry, score: cosineSimilarity(entry.embedding, queryEmbedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.entry);
}
