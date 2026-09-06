import { list, put } from "@vercel/blob";
import type { IndexEntry } from "./search";

const INDEX_PATHNAME = "policy-index.json";

export async function readIndex(): Promise<IndexEntry[]> {
  const { blobs } = await list({ prefix: INDEX_PATHNAME });
  const match = blobs.find((b) => b.pathname === INDEX_PATHNAME);
  if (!match) return [];

  const res = await fetch(match.url, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function writeIndex(entries: IndexEntry[]): Promise<void> {
  await put(INDEX_PATHNAME, JSON.stringify(entries), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}
