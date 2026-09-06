"use client";

import { useCallback, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { extractPdfPagesText } from "@/lib/pdfExtract";
import { chunkPages } from "@/lib/chunk";
import { embedTexts, type ModelProgress } from "@/lib/embeddingModel";

type FileStatus =
  | "waiting"
  | "reading"
  | "embedding"
  | "uploading"
  | "saving"
  | "done"
  | "error";

type FileRow = {
  file: File;
  status: FileStatus;
  detail?: string;
  error?: string;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [rows, setRows] = useState<FileRow[]>([]);
  const [running, setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newRows: FileRow[] = Array.from(files)
      .filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
      .map((file) => ({ file, status: "waiting" }));
    setRows((r) => [...r, ...newRows]);
  };

  const updateRow = (index: number, patch: Partial<FileRow>) => {
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const processFile = useCallback(
    async (index: number, file: File) => {
      try {
        updateRow(index, { status: "reading", detail: "Extracting text from PDF…" });
        const pages = await extractPdfPagesText(file);
        const chunks = chunkPages(pages);
        if (chunks.length === 0) {
          updateRow(index, { status: "error", error: "No readable text found in this PDF." });
          return;
        }

        updateRow(index, { status: "embedding", detail: "Loading free AI model…" });
        const embeddings = await embedTexts(
          chunks.map((c) => c.text),
          (p: ModelProgress) => {
            if (p.status === "progress" && typeof p.progress === "number") {
              updateRow(index, { detail: `Downloading AI model… ${Math.round(p.progress)}%` });
            } else if (p.status === "ready" || p.status === "done") {
              updateRow(index, { detail: `Embedding ${chunks.length} chunks…` });
            }
          }
        );

        updateRow(index, { status: "uploading", detail: "Uploading PDF…" });
        const blob = await upload(`policies/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/admin/blob-upload",
          clientPayload: password,
        });

        updateRow(index, { status: "saving", detail: "Saving to search index…" });
        const res = await fetch("/api/admin/save-index", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password,
            fileName: file.name,
            blobUrl: blob.url,
            entries: chunks.map((c, i) => ({
              pageNumber: c.pageNumber,
              text: c.text,
              embedding: embeddings[i],
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save index.");

        updateRow(index, { status: "done", detail: `${chunks.length} chunks indexed.` });
      } catch (e: any) {
        updateRow(index, { status: "error", error: e.message || "Something went wrong." });
      }
    },
    [password]
  );

  const startIndexing = async () => {
    if (!password) {
      alert("Enter the admin password first.");
      return;
    }
    setRunning(true);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].status === "done") continue;
      await processFile(i, rows[i].file);
    }
    setRunning(false);
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl text-ink">Policy Admin</h1>
      <p className="mt-1 text-sm text-mute">
        Add or update policy PDFs. Everything — reading the PDF, splitting it
        into sections, and generating search embeddings — happens right here
        in your browser using a free AI model. Nothing is installed and
        nothing costs money.
      </p>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Admin password"
        className="mt-6 w-full rounded-md border border-line bg-panel px-3 py-2 text-ink outline-none focus:border-navy"
      />

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        className="mt-4 cursor-pointer rounded-lg border-2 border-dashed border-line bg-panel p-8 text-center hover:border-navy"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <p className="font-medium text-ink">Drop policy PDFs here, or click to choose</p>
        <p className="mt-1 text-sm text-mute">You can select all 30 at once</p>
      </div>

      {rows.length > 0 && (
        <div className="mt-6 space-y-2">
          {rows.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-md border border-line bg-panel px-3 py-2 text-sm"
            >
              <span className="truncate text-ink">{r.file.name}</span>
              <span
                className={
                  r.status === "done"
                    ? "text-navy"
                    : r.status === "error"
                    ? "text-amber"
                    : "text-mute"
                }
              >
                {r.status === "error" ? r.error : r.detail || r.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <button
          onClick={startIndexing}
          disabled={running}
          className="mt-5 w-full rounded-md bg-navy py-2.5 font-medium text-white transition hover:bg-navy-dark disabled:opacity-50"
        >
          {running ? "Indexing…" : `Index ${rows.length} file(s)`}
        </button>
      )}
    </main>
  );
}
