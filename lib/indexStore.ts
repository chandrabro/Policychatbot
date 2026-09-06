import { list, put } from "@vercel/blob";
import type { IndexEntry } from "./search";
import fs from "fs/promises";
import path from "path";

const INDEX_PATHNAME = "policy-index.json";
const LOCAL_INDEX_PATH = path.join(process.cwd(), "data", "policy-index.json");

export async function readIndex(): Promise<IndexEntry[]> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({ prefix: INDEX_PATHNAME });
      const match = blobs.find((b) => b.pathname === INDEX_PATHNAME);
      if (!match) return [];

      const res = await fetch(match.url, { cache: "no-store" });
      if (!res.ok) return [];
      return res.json();
    } catch (err) {
      console.warn("Vercel Blob readIndex failed, falling back to local file:", err);
    }
  }

  try {
    const data = await fs.readFile(LOCAL_INDEX_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeIndex(entries: IndexEntry[]): Promise<void> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await put(INDEX_PATHNAME, JSON.stringify(entries), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      return;
    } catch (err) {
      console.warn("Vercel Blob writeIndex failed, falling back to local file:", err);
    }
  }

  await fs.mkdir(path.dirname(LOCAL_INDEX_PATH), { recursive: true });
  await fs.writeFile(LOCAL_INDEX_PATH, JSON.stringify(entries, null, 2), "utf-8");
}

