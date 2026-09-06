"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";

interface PolicyFile {
  file: File;
  status: "idle" | "uploading" | "indexing" | "done" | "error";
  error?: string;
  url?: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [files, setFiles] = useState<PolicyFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalMessage, setGlobalMessage] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files).map((file) => ({
      file,
      status: "idle" as const,
    }));
    setFiles(selectedFiles);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.dataTransfer.files) return;
    const droppedFiles = Array.from(e.dataTransfer.files)
      .filter((file) => file.type === "application/pdf")
      .map((file) => ({
        file,
        status: "idle" as const,
      }));
    setFiles(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const processAndIndexFiles = async () => {
    if (!password) {
      setGlobalMessage("Please enter the admin password.");
      return;
    }

    if (files.length === 0) {
      setGlobalMessage("Please select at least one PDF file.");
      return;
    }

    setIsProcessing(true);
    setGlobalMessage("");

    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      const item = updatedFiles[i];
      item.status = "uploading";
      setFiles([...updatedFiles]);

      try {
        // Upload directly to Vercel Blob using client upload helper
        const blob = await upload(item.file.name, item.file, {
          access: "public",
          handleUploadUrl: "/api/admin/blob-upload",
        });

        item.url = blob.url;
        item.status = "indexing";
        setFiles([...updatedFiles]);

        // Save index / metadata to your backend
        const saveRes = await fetch("/api/admin/save-index", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": password,
          },
          body: JSON.stringify({
            fileName: item.file.name,
            blobUrl: blob.url,
          }),
        });

        if (!saveRes.ok) {
          const errData = await saveRes.json();
          throw new Error(errData.error || "Failed to save policy index");
        }

        item.status = "done";
      } catch (err: any) {
        item.status = "error";
        item.error = err.message || "Upload or indexing failed";
      }

      setFiles([...updatedFiles]);
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f4f0] p-8 flex flex-col items-center">
      <div className="max-w-2xl w-full bg-white p-8 rounded-xl shadow-sm border border-stone-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Policy Admin</h1>
        <p className="text-stone-600 text-sm mb-6">
          Add or update policy PDFs. Everything — reading the PDF, splitting it into sections, and
          generating search embeddings — happens directly in your browser.
        </p>

        {globalMessage && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {globalMessage}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">
            Admin Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password..."
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center bg-stone-50 hover:bg-stone-100 transition cursor-pointer mb-6"
        >
          <input
            type="file"
            multiple
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="pdf-upload-input"
          />
          <label htmlFor="pdf-upload-input" className="cursor-pointer block">
            <p className="text-slate-700 font-medium">Drop policy PDFs here, or click to choose</p>
            <p className="text-xs text-stone-500 mt-1">You can select all 30 at once</p>
          </label>
        </div>

        {files.length > 0 && (
          <div className="space-y-2 mb-6">
            {files.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200 text-sm"
              >
                <span className="truncate font-medium text-slate-700 max-w-[250px]">
                  {item.file.name}
                </span>

                <div className="text-xs">
                  {item.status === "idle" && <span className="text-stone-500">Ready</span>}
                  {item.status === "uploading" && (
                    <span className="text-amber-600 font-medium">Uploading to Blob...</span>
                  )}
                  {item.status === "indexing" && (
                    <span className="text-blue-600 font-medium">Indexing text...</span>
                  )}
                  {item.status === "done" && (
                    <span className="text-emerald-600 font-semibold">✓ Indexed</span>
                  )}
                  {item.status === "error" && (
                    <span className="text-red-600 font-medium">
                      {item.error || "Upload error"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={processAndIndexFiles}
          disabled={isProcessing || files.length === 0}
          className="w-full py-3 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Processing Policies..." : `Index ${files.length} file(s)`}
        </button>
      </div>
    </div>
  );
}
